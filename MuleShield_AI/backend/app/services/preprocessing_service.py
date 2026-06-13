import pandas as pd
import numpy as np


def preprocess_dataset(filepath):

    df = pd.read_csv(filepath)

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Fill missing numeric values
    numeric_cols = df.select_dtypes(
        include=np.number
    ).columns

    for col in numeric_cols:
        df[col] = df[col].fillna(
            df[col].median()
        )

    # Fill missing categorical values
    categorical_cols = df.select_dtypes(
        exclude=np.number
    ).columns

    for col in categorical_cols:
        df[col] = df[col].fillna(
            "Unknown"
        )

    return df