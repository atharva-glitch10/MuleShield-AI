from fastapi import APIRouter
import pandas as pd
import os

router = APIRouter(tags=["Dataset"])

FILE_PATH = "app/data/latest.csv"


@router.get("/dataset/summary")
def dataset_summary():

    if not os.path.exists(FILE_PATH):
        return {"error": "No dataset uploaded"}

    df = pd.read_csv(FILE_PATH)

    return {
        "status": "success",
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "missing_values": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum())
    }


@router.get("/dataset/preview")
def dataset_preview():

    if not os.path.exists(FILE_PATH):
        return {"error": "No dataset uploaded"}

    df = pd.read_csv(FILE_PATH)

    return {
        "rows": df.head(5).fillna("").to_dict(orient="records")
    }

@router.get("/dataset/types")
def dataset_types():

    df = pd.read_csv(FILE_PATH)

    return {
        "column_types":
            df.dtypes.astype(str).to_dict()
    }