from fastapi import APIRouter

from app.services.anomaly_service import (
    train_anomaly_model
)

router = APIRouter(
    tags=["Training"]
)

@router.post("/train")
def train():

    return train_anomaly_model(
        "app/data/latest.csv"
    )
    