"""risk_service.py – Composite risk scoring helpers.

Imports added for hybrid scoring.
"""

from .xgboost_service import get_xgb_probability
import pandas as pd
import numpy as np


def compute_composite_risk(anomaly_score: float, transaction_count: int = 0,
                           unique_beneficiaries: int = 0,
                           cash_withdrawals: float = 0.0,
                           total_credit_amount: float = 0.0) -> float:
    """Combine the ML anomaly score with rule-based signals into a 0-100 risk score.

    Args:
        anomaly_score: Raw IsolationForest decision score (negative = more anomalous).
        transaction_count: Number of transactions for the account.
        unique_beneficiaries: Number of distinct payees.
        cash_withdrawals: Total cash withdrawal amount.
        total_credit_amount: Total credits received.

    Returns:
        A float in the range [0, 100].
    """
    # Convert anomaly score to 0-100 (more negative -> higher risk)
    # Isolation Forest component (scaled to max 60 points)
    isolation_score = float(np.clip(abs(anomaly_score) * 1000, 0, 60))

    # Rule-based component (max 40 points)
    rule_score = 0
    if transaction_count > 100:
        rule_score += 10
    if unique_beneficiaries > 20:
        rule_score += 10
    if cash_withdrawals > 100_000:
        rule_score += 10
    if total_credit_amount > 500_000:
        rule_score += 10

    # XGBoost probability (expects feature list; placeholder empty list for now)
    # Placeholder: empty DataFrame for XGBoost probability
    empty_df = pd.DataFrame([[]])
    xgb_prob = get_xgb_probability(empty_df)  # TODO: replace with real features

    # Hybrid risk formula (weights: 0.5 XGB, 0.3 Isolation, 0.2 Rule)
    risk = (
        0.5 * xgb_prob * 100
        + 0.3 * isolation_score
        + 0.2 * rule_score
    )
    return round(min(risk, 100), 2)


def risk_label(score: float) -> str:
    """Return a human-readable risk label for a composite risk score."""
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MEDIUM"
    return "LOW"
