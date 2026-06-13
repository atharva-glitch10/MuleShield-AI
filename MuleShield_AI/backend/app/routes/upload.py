from fastapi import APIRouter, UploadFile, File

import shutil
import os

from app.services.preprocessing_service import (
    preprocess_dataset
)

from app.services.feature_engineering_service import (
    generate_features
)

router = APIRouter()

@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...)
):

    os.makedirs(
        "app/data",
        exist_ok=True
    )

    filepath = "app/data/latest.csv"

    with open(filepath, "wb") as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    df = preprocess_dataset(
        filepath
    )

    df = generate_features(
        df
    )

    df.to_csv(
        filepath,
        index=False
    )

    return {
        "message": "processed successfully",
        "rows": len(df),
        "columns": len(df.columns)
    }
    