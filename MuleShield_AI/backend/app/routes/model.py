from fastapi import APIRouter
import os

router = APIRouter(
    tags=["Model"]
)


@router.get("/model/status")
def model_status():

    return {
        "model_exists": os.path.exists(
            "app/models/isolation_forest.pkl"
        ),
        "algorithm": "Isolation Forest"
    }