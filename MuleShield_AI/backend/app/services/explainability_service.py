"""explainability_service.py – Basic feature-level explainability for anomaly records."""
import pandas as pd
from app.services.anomaly_service import get_anomaly_scores, preprocess_dataframe


def get_top_features(record_id: int, top_n: int = 5) -> dict:
    """Return the top contributing features for a given record.

    Uses absolute feature value deviation from the training mean as a simple
    proxy for feature importance (no SHAP dependency required).

    Args:
        record_id: Zero-based row index into the dataset.
        top_n: Number of top features to return.

    Returns:
        A dict with ``record_id`` and ``top_features`` list.
    """
    df_raw, predictions, scores = get_anomaly_scores("app/data/latest.csv")

    if record_id >= len(df_raw):
        return {"error": "record not found"}

    df_processed = preprocess_dataframe(df_raw.copy())

    means = df_processed.mean()
    stds = df_processed.std().replace(0, 1)

    record = df_processed.iloc[record_id]
    deviation = ((record - means) / stds).abs()

    top_features = (
        deviation.sort_values(ascending=False)
        .head(top_n)
        .reset_index()
        .rename(columns={"index": "feature", 0: "deviation"})
        .to_dict(orient="records")
    )

    return {
        "record_id": record_id,
        "anomaly_score": float(scores[record_id]),
        "top_features": top_features,
    }
