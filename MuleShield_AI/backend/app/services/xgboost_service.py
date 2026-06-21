import os
import joblib
from typing import Any, Dict, List
import pandas as pd

# Optional import of xgboost – the package may be missing in some environments.
try:
    import xgboost  # noqa: F401
except ImportError:
    xgboost = None

# Path to the XGBoost model (relative to this file)
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "xgboost_classifier.pkl")

# Global placeholder for the loaded model – we will load it lazily.
_xgb_model = None

def _load_model() -> None:
    """Load the XGBoost model on first use.
    If the model file or the xgboost package is missing, keep _xgb_model as None.
    """
    global _xgb_model
    if _xgb_model is not None:
        return
    if not os.path.exists(_MODEL_PATH):
        return
    try:
        _xgb_model = joblib.load(_MODEL_PATH)
    except Exception:
        # If loading fails (e.g., due to version mismatch), keep None.
        _xgb_model = None

def get_xgb_probability(df: pd.DataFrame) -> float:
    """Return the probability of the positive class from the XGBoost model.

    Args:
        df: DataFrame with a single row of feature values. Object columns are
            converted to categorical dtype to match training.
    Returns:
        Float probability in the range [0.0, 1.0]. If the model is unavailable,
        returns 0.0.
    """
    # Ensure the model is loaded before we use it
    _load_model()
    if _xgb_model is None:
        # Model unavailable – return a neutral probability.
        return 0.0
    # Ensure object columns are categorical
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype('category')
    try:
        prob = _xgb_model.predict_proba(df)
    except Exception:
        # If prediction fails (e.g., due to dtype issues), fallback to 0.0
        return 0.0
    # Return probability of the positive (risky) class.
    return float(prob[0][1])
