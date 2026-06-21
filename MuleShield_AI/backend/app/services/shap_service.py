import os
import joblib
import pandas as pd
import shap
import numpy as np

# Path to the XGBoost model
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "xgboost_classifier.pkl")


# Lazy loading placeholders – will be initialized on first request
_xgb_model = None
_explainer = None

def _load_model_and_explainer():
    global _xgb_model, _explainer
    if _xgb_model is None or _explainer is None:
        try:
            import xgboost  # Ensure xgboost is available
        except ModuleNotFoundError as exc:
            raise ModuleNotFoundError("xgboost is required for SHAP explanations but is not installed.") from exc
        _xgb_model = joblib.load(_MODEL_PATH)
        _explainer = shap.TreeExplainer(_xgb_model)


def get_shap_explanation(record_id: int, top_n: int = 3):
    """Return SHAP explanation for a given record.

    Args:
        record_id: Index of the record in the CSV (0‑based).
        top_n: Number of top features to return.
    Returns:
        List of dicts ``[{"feature": str, "impact": float}, ...]`` ordered by absolute impact.
    """
    if not os.path.exists(_MODEL_PATH):
        return [{"feature": "N/A", "impact": 0.0, "note": "XGBoost model not yet trained. Run /train first."}]

    # Ensure model and explainer are loaded (lazy)
    _load_model_and_explainer()

    from app.services.model_metrics_service import load_data
    try:
        X, _ = load_data()
    except Exception as e:
        return [{"feature": "N/A", "impact": 0.0, "note": f"Failed to load dataset: {e}"}]

    if record_id < 0 or record_id >= len(X):
        raise IndexError("record_id out of range")

    # Encode category columns to codes for SHAP TreeExplainer
    X_coded = X.copy()
    for col in X_coded.select_dtypes(include=['category']).columns:
        X_coded[col] = X_coded[col].cat.codes
    for col in X_coded.select_dtypes(include=['object']).columns:
        X_coded[col] = X_coded[col].astype('category').cat.codes

    X_single = X_coded.iloc[[record_id]]

    # Compute SHAP values for the single row
    shap_values = _explainer.shap_values(X_single)

    if isinstance(shap_values, list):
        # Newer shap returns list of arrays for each class
        shap_vals = shap_values[1]
    else:
        shap_vals = shap_values

    record_shap = shap_vals[0]
    feature_cols = list(X.columns)
    
    # Pair each feature with its SHAP value
    feature_shap = list(zip(feature_cols, record_shap))
    # Sort by absolute impact descending
    feature_shap.sort(key=lambda kv: abs(kv[1]), reverse=True)
    top_features = [{"feature": f, "impact": round(float(v), 4)} for f, v in feature_shap[:top_n]]
    return top_features
