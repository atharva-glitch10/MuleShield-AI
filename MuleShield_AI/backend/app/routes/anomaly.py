from fastapi import APIRouter
import pandas as pd

from app.services.anomaly_service import (
    get_anomaly_scores
)

router = APIRouter(
    tags=["Anomaly Detection"]
)


@router.get("/top-suspicious")
def top_suspicious():

    df, predictions, scores = get_anomaly_scores(
        "app/data/latest.csv"
    )

    result = []

    suspicious_idx = (
        pd.Series(scores)
        .sort_values()
        .head(10)
        .index
    )

    for idx in suspicious_idx:

        result.append({
            "record_id": int(idx),
            "anomaly_score": float(scores[idx]),
            "prediction": int(predictions[idx])
        })

    return {
        "count": len(result),
        "records": result
    }


@router.get("/risk-distribution")
def risk_distribution():

    df, predictions, scores = get_anomaly_scores(
        "app/data/latest.csv"
    )

    high = int((scores < -0.05).sum())

    medium = int(
        ((scores >= -0.05) &
         (scores < 0.05)).sum()
    )

    low = int((scores >= 0.05).sum())

    return {
        "high_risk": high,
        "medium_risk": medium,
        "low_risk": low
    }