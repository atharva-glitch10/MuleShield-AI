from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
import pandas as pd
import joblib
import os

MODEL_PATH = "app/models/isolation_forest.pkl"


def preprocess_dataframe(df):

    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    df = df.fillna("Unknown")

    categorical_columns = df.select_dtypes(
        include=["object"]
    ).columns

    for col in categorical_columns:

        encoder = LabelEncoder()

        df[col] = encoder.fit_transform(
            df[col].astype(str)
        )

    return df


def train_anomaly_model(filepath):

    try:

        df = pd.read_csv(filepath)

        df = preprocess_dataframe(df)

        model = IsolationForest(
            contamination=0.05,
            random_state=42,
            n_estimators=100
        )

        model.fit(df)

        os.makedirs(
            "app/models",
            exist_ok=True
        )

        joblib.dump(
            model,
            MODEL_PATH
        )

        return {
            "status": "trained",
            "rows": len(df),
            "features": len(df.columns)
        }

    except Exception as e:

        return {
            "error": str(e)
        }


def load_model():
    """Load the IsolationForest model, training it on the latest data if missing.

    Returns:
        IsolationForest: The trained model ready for predictions.
    """
    if not os.path.exists(MODEL_PATH):
        # Compute absolute data path
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        data_path = os.path.join(base_dir, "app", "data", "latest.csv")
        train_result = train_anomaly_model(data_path)
        if "error" in train_result:
            raise RuntimeError(f"Failed to train model: {train_result['error']}")
    return joblib.load(MODEL_PATH)
_anomaly_cache = {}

def get_anomaly_scores(filepath):
    # Enable in-memory caching to avoid reading 170MB+ CSV and running ML inference on every HTTP request
    mtime = os.path.getmtime(filepath) if os.path.exists(filepath) else 0
    cache_key = (filepath, mtime)
    if cache_key in _anomaly_cache:
        return _anomaly_cache[cache_key]

    df_original = pd.read_csv(filepath)

    df_processed = preprocess_dataframe(
        df_original.copy()
    )

    model = load_model()

    predictions = model.predict(
        df_processed
    )

    scores = model.decision_function(
        df_processed
    )

    res = (
        df_original,
        predictions,
        scores
    )
    _anomaly_cache[cache_key] = res
    return res