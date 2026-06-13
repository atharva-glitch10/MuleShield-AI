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
        # Train a new model using the default dataset
        train_result = train_anomaly_model("app/data/latest.csv")
        if "error" in train_result:
            raise RuntimeError(f"Failed to train model: {train_result['error']}")
    return joblib.load(MODEL_PATH)


def get_anomaly_scores(filepath):

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

    return (
        df_original,
        predictions,
        scores
    )
    