import os
import json
import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)
from app.services.feature_engineering_service import engineer_features, generate_features

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH = os.path.join(BASE_DIR, "app", "data", "latest.csv")
MODEL_PATH = os.path.join(BASE_DIR, "app", "models", "xgboost_classifier.pkl")
METRICS_CACHE_PATH = os.path.join(BASE_DIR, "app", "models", "metrics_cache.json")
TARGET_COLUMN = "F3924"

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"XGBoost model not found at {MODEL_PATH}")
    return joblib.load(MODEL_PATH)

_data_cache = {}

def load_data():
    path = os.path.abspath(DATA_PATH)
    mtime = os.path.getmtime(path) if os.path.exists(path) else 0
    cache_key = (path, mtime)
    if cache_key in _data_cache:
        return _data_cache[cache_key]

    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}")
    df = pd.read_csv(path)
    if TARGET_COLUMN not in df.columns:
        raise KeyError(f"Target column '{TARGET_COLUMN}' missing in data")
    y = df[TARGET_COLUMN]
    X = df.drop(columns=[TARGET_COLUMN])
    
    # Apply Feature Engineering
    X = generate_features(X)
    X = engineer_features(X)
    
    X = X.fillna(0)
    # Convert object columns to categorical for XGBoost compatibility
    for col in X.select_dtypes(include=['object']).columns:
        X[col] = X[col].astype('category')
    
    res = (X, y)
    _data_cache[cache_key] = res
    return res

def _save_cache(data: dict):
    """Persist computed metrics to disk."""
    os.makedirs(os.path.dirname(METRICS_CACHE_PATH), exist_ok=True)
    with open(METRICS_CACHE_PATH, "w") as f:
        json.dump(data, f)

def _load_cache() -> dict | None:
    """Read cached metrics from disk, return None if not found."""
    if os.path.exists(METRICS_CACHE_PATH):
        try:
            with open(METRICS_CACHE_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return None
    return None

def compute_and_cache_all_metrics():
    """
    Compute ALL heavy metrics (CV scores, ROC, PR, feature importance) ONCE
    and write them to disk. Call this after training.
    This is the only place where expensive computation happens.
    """
    from sklearn.model_selection import train_test_split

    X, y = load_data()
    model = load_model()

    # -- Use a simple 80/20 split (fast, stable for reporting) --
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    # Core classification metrics
    metrics = {
        "accuracy":  round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall":    round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
        "f1":        round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "roc_auc":   round(float(roc_auc_score(y_test, y_proba)), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }

    # ROC curve (subsampled to 100 points)
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    step_roc = max(1, len(fpr) // 100)
    metrics["roc"] = {
        "fpr": fpr[::step_roc].tolist(),
        "tpr": tpr[::step_roc].tolist(),
    }

    # Precision-Recall curve (subsampled to 100 points)
    prec, rec, _ = precision_recall_curve(y_test, y_proba)
    step_pr = max(1, len(prec) // 100)
    metrics["pr"] = {
        "precision": prec[::step_pr].tolist(),
        "recall":    rec[::step_pr].tolist(),
    }

    # Feature importance via mutual information (fast, on subsampled data)
    try:
        from app.services.feature_selection_service import rank_features
        sample_idx = X.sample(min(3000, len(X)), random_state=42).index
        metrics["feature_importance"] = rank_features(X.loc[sample_idx], y.loc[sample_idx])
    except Exception as e:
        metrics["feature_importance"] = []

    # Model comparison (run light sklearn models with 5-fold CV on subsampled data)
    try:
        from app.services.model_comparison_service import compare_models
        metrics["model_comparison"] = compare_models()
    except Exception as e:
        metrics["model_comparison"] = []

    _save_cache(metrics)
    return metrics

def compute_metrics():
    """Return cached metrics instantly. Returns a placeholder if cache is not ready yet."""
    cached = _load_cache()
    if cached:
        # Return only the classification metrics (not curves) for backward compat
        return {k: v for k, v in cached.items()
                if k not in ("roc", "pr", "feature_importance", "model_comparison")}
    # Cache not ready — return a placeholder immediately (do NOT block)
    return {
        "accuracy":  None,
        "precision": None,
        "recall":    None,
        "f1":        None,
        "roc_auc":   None,
        "confusion_matrix": [],
        "status": "Computing metrics in background. Refresh in ~60 seconds after training."
    }

def get_roc_pr_data():
    """Return cached ROC/PR data instantly. Returns empty if cache not ready."""
    cached = _load_cache()
    if cached and "roc" in cached and "pr" in cached:
        return {"roc": cached["roc"], "pr": cached["pr"]}
    return {"roc": {"fpr": [], "tpr": []}, "pr": {"precision": [], "recall": []}}

def get_cached_feature_importance():
    """Return cached feature importance instantly."""
    cached = _load_cache()
    if cached and "feature_importance" in cached:
        return cached["feature_importance"]
    return []

if __name__ == "__main__":
    print(compute_and_cache_all_metrics())
