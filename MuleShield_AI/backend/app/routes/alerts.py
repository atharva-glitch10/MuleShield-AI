"""routes/alerts.py – Alert endpoints for the MuleShield dashboard."""
from fastapi import APIRouter
from app.services.anomaly_service import get_anomaly_scores

router = APIRouter(tags=["Alerts"])


@router.get("/alerts")
def get_alerts():
    """Return tiered alerts based on anomaly score distribution."""
    df, predictions, scores = get_anomaly_scores("app/data/latest.csv")

    high_risk_count = int((scores < -0.05).sum())
    critical_count = int((scores < -0.1).sum())

    alerts = []
    if critical_count > 0:
        alerts.append({
            "severity": "CRITICAL",
            "message": f"{critical_count} records flagged as critically suspicious",
        })
    if high_risk_count > 0:
        alerts.append({
            "severity": "HIGH",
            "message": f"{high_risk_count} records exceed the high-risk anomaly threshold",
        })
    if not alerts:
        alerts.append({
            "severity": "INFO",
            "message": "No significant anomalies detected in the current dataset",
        })

    return {"alert_count": len(alerts), "alerts": alerts}
