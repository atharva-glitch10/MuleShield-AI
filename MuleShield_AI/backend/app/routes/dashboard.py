from fastapi import APIRouter
import pandas as pd

from app.services.anomaly_service import (
    get_anomaly_scores
)

router = APIRouter(
    tags=["Dashboard"]
)


@router.get("/dashboard/summary")
def dashboard_summary():

    df, predictions, scores = get_anomaly_scores(
        "app/data/latest.csv"
    )

    total_records = len(df)

    anomalies = int(
        (predictions == -1).sum()
    )

    normal_records = int(
        (predictions == 1).sum()
    )

    anomaly_percentage = round(
        (anomalies / total_records) * 100,
        2
    )

    return {
        "total_records": total_records,
        "anomalies": anomalies,
        "normal_records": normal_records,
        "anomaly_percentage": anomaly_percentage
    }


@router.get("/dashboard/high-risk")
def high_risk_records():

    df, predictions, scores = get_anomaly_scores(
        "app/data/latest.csv"
    )

    result = []

    suspicious_idx = (
        pd.Series(scores)
        .sort_values()
        .head(20)
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


@router.get("/dashboard/statistics")
def dashboard_statistics():

    df, predictions, scores = get_anomaly_scores(
        "app/data/latest.csv"
    )

    return {
        "total_records": int(len(df)),
        "total_features": int(len(df.columns)),
        "average_anomaly_score": float(scores.mean()),
        "minimum_anomaly_score": float(scores.min()),
        "maximum_anomaly_score": float(scores.max())
    }


@router.get("/dashboard/alerts")
def dashboard_alerts():

    df, predictions, scores = get_anomaly_scores(
        "app/data/latest.csv"
    )

    high_risk_count = int(
        (scores < -0.05).sum()
    )

    alerts = []

    if high_risk_count > 0:

        alerts.append({
            "severity": "HIGH",
            "message": f"{high_risk_count} suspicious records detected"
        })

    if high_risk_count > 100:

        alerts.append({
            "severity": "CRITICAL",
            "message": "Large number of anomalies detected"
        })

    return {
        "alert_count": len(alerts),
        "alerts": alerts
    }