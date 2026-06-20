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

    - Loads the latest CSV data.
    - Extracts features for XGBoost (all columns except the target `F3924`).
    - Retrieves XGBoost probability via `get_xgb_probability`.
    - Gets Isolation Forest anomaly score via `get_anomaly_scores`.
    - Applies the weighted formula:
        risk = 0.5 * xgb_prob * 100 + 0.3 * isolation_score + 0.2 * rule_score
    - Returns JSON with `record_id` and `hybrid_risk_score`.
    """
    import pandas as pd
    import numpy as np
    from app.services.anomaly_service import get_anomaly_scores
    from app.services.xgboost_service import get_xgb_probability

    # Load data
    import os
    # Build absolute path to the CSV data file
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    data_path = os.path.join(base_dir, "app", "data", "latest.csv")
    df = pd.read_csv(data_path)
    if record_id < 0 or record_id >= len(df):
        return {"error": "record_id out of range"}

    # Feature vector for XGBoost (exclude target column if present)
    feature_cols = [c for c in df.columns if c != "F3924"]
    features = df.iloc[record_id][feature_cols].fillna(0).tolist()
    # Convert to DataFrame for XGBoost service
    import pandas as pd
    features_df = pd.DataFrame([features])
    xgb_prob = get_xgb_probability(features_df)

    # Isolation Forest anomaly score
    _, _, scores = get_anomaly_scores(data_path)
    anomaly_score = scores[record_id]
    isolation_score = float(np.clip(abs(anomaly_score) * 1000, 0, 60))

    # Rule‑based component – placeholder (set to 0 for now)
    rule_score = 0

    # Hybrid risk calculation (weights 0.5, 0.3, 0.2)
    hybrid_score = (
        0.5 * xgb_prob * 100
        + 0.3 * isolation_score
        + 0.2 * rule_score
    )
    return {"record_id": record_id, "hybrid_risk_score": round(min(hybrid_score, 100), 2)}