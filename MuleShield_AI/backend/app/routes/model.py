from fastapi import APIRouter
import os
from app.services.xgboost_service import get_xgb_probability
from app.services.risk_service import compute_composite_risk
import pandas as pd

router = APIRouter(
    tags=["Model"]
)


@router.get("/model/status")
def model_status():

    return {
        "model_exists": os.path.exists("app/models/isolation_forest.pkl"),
        "xgboost_exists": os.path.exists("app/models/xgboost_classifier.pkl"),
        "algorithm": "Isolation Forest + XGBoost",
    }

# Hybrid risk endpoint
@router.get("/model/hybrid-risk/{record_id}")
def hybrid_risk(record_id: int):
    """Compute hybrid risk score for a given record.

    - Loads features via cached load_data().
    - Retrieves XGBoost probability via get_xgb_probability.
    - Gets Isolation Forest anomaly score via get_anomaly_scores.
    - Applies the weighted formula:
        risk = 0.5 * xgb_prob * 100 + 0.3 * isolation_score + 0.2 * rule_score
    - Returns JSON with record_id and hybrid_risk_score.
    """
    from app.services.anomaly_service import get_anomaly_scores
    from app.services.model_metrics_service import load_data
    from app.services.risk_service import compute_composite_risk
    import os

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    data_path = os.path.join(base_dir, "app", "data", "latest.csv")

    try:
        X, _ = load_data()
    except Exception as e:
        return {"error": f"Failed to load dataset: {e}"}

    if record_id < 0 or record_id >= len(X):
        return {"error": "record_id out of range"}

    # Retrieve pre-engineered feature row from cached X
    features_df = X.iloc[[record_id]]

    # Isolation Forest anomaly score (cached)
    _, _, scores = get_anomaly_scores(data_path)
    anomaly_score = scores[record_id]

    hybrid_score = compute_composite_risk(anomaly_score, record_features=features_df)
    return {"record_id": record_id, "hybrid_risk_score": round(min(hybrid_score, 100), 2)}