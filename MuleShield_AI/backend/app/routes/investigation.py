from fastapi import APIRouter

from app.services.investigation_service import (
    explain_record
)

router = APIRouter(
    tags=["Investigation"]
)


@router.get("/explain/{record_id}")
def explain(record_id: int):

    return explain_record(record_id)


@router.get("/high-risk-explanations")
def high_risk_explanations():

    results = []

    for record_id in range(20):

        try:

            results.append(
                explain_record(record_id)
            )

        except:
            pass

    return results