import pandas as pd
import numpy as np

from app.services.anomaly_service import (
    get_anomaly_scores
)


def explain_record(record_id):

    df, predictions, scores = get_anomaly_scores(
        "app/data/latest.csv"
    )

    if record_id >= len(df):

        return {
            "error": "record not found"
        }

    score = float(scores[record_id])
    prediction = int(predictions[record_id])

    reasons = []

    if score < -0.08:
        reasons.append("Extreme anomaly score")

    if score < -0.05:
        reasons.append("Potential mule account behaviour")

    if prediction == -1:
        reasons.append("Detected as anomaly by Isolation Forest")

    # XAI: Statistical Deviation Explanation
    numeric_df = df.select_dtypes(include=[np.number])
    if not numeric_df.empty:
        means = numeric_df.mean()
        stds = numeric_df.std().replace(0, 1)  # Avoid division by zero
        
        row_data = numeric_df.iloc[record_id]
        z_scores = ((row_data - means) / stds).abs()
        
        # Get top 3 deviating features
        top_features = z_scores.sort_values(ascending=False).head(3)
        
        for feature, z_val in top_features.items():
            if z_val > 2.0:
                reasons.append(
                    f"Feature '{feature}' is {z_val:.1f} standard deviations from the normal baseline."
                )

    risk_score = min(
        100,
        abs(score) * 1000
    )

    risk_level = (
        "HIGH"
        if risk_score > 70
        else "MEDIUM"
        if risk_score > 40
        else "LOW"
    )

    return {
        "record_id": record_id,
        "anomaly_score": score,
        "risk_score": round(
            risk_score,
            2
        ),
        "risk_level": risk_level,
        "prediction": prediction,
        "reasons": reasons
    }