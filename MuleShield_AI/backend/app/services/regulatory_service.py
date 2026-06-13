"""regulatory_service.py – Basic regulatory / compliance helpers."""


RISK_THRESHOLDS = {
    "HIGH": 70,
    "MEDIUM": 40,
    "LOW": 0,
}


def classify_risk_level(risk_score: float) -> str:
    """Map a numeric risk score (0-100) to a categorical risk level."""
    if risk_score >= RISK_THRESHOLDS["HIGH"]:
        return "HIGH"
    if risk_score >= RISK_THRESHOLDS["MEDIUM"]:
        return "MEDIUM"
    return "LOW"


def build_sar_summary(record_id: int, risk_score: float, reasons: list) -> dict:
    """Build a Suspicious Activity Report (SAR) summary for a record.

    Args:
        record_id: Identifier of the flagged account / transaction row.
        risk_score: Computed risk score (0-100).
        reasons: List of human-readable reason strings.

    Returns:
        A dict suitable for inclusion in an API response.
    """
    return {
        "record_id": record_id,
        "sar_required": risk_score >= RISK_THRESHOLDS["HIGH"],
        "risk_level": classify_risk_level(risk_score),
        "risk_score": round(risk_score, 2),
        "reasons": reasons,
        "recommended_action": (
            "File SAR immediately"
            if risk_score >= RISK_THRESHOLDS["HIGH"]
            else "Monitor account"
            if risk_score >= RISK_THRESHOLDS["MEDIUM"]
            else "No action required"
        ),
    }
