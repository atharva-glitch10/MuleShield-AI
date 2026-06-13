"""data_service.py – Simple helpers for loading the main dataset."""
import os
import pandas as pd

DATA_PATH = "app/data/latest.csv"


def dataset_exists() -> bool:
    """Return True if the main CSV has been uploaded."""
    return os.path.exists(DATA_PATH)


def load_dataset() -> pd.DataFrame:
    """Load and return the latest CSV as a DataFrame.

    Raises:
        FileNotFoundError: if no dataset has been uploaded yet.
    """
    if not dataset_exists():
        raise FileNotFoundError(f"Dataset not found at '{DATA_PATH}'. Please upload a CSV first.")
    return pd.read_csv(DATA_PATH)