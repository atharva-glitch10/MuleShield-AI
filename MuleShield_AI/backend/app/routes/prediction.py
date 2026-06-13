from fastapi import APIRouter

from app.models.transaction import Transaction
from app.services.ml_service import calculate_fraud_score

router = APIRouter()

@router.post("/predict")
def predict(transaction: Transaction):

    risk_score = calculate_fraud_score(transaction)

    return {
        "risk_score": risk_score,
        "risk_level":
            "High" if risk_score > 70
            else "Medium" if risk_score > 40
            else "Low"
    }