import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from xgboost import XGBClassifier
from app.services.feature_engineering_service import engineer_features, generate_features

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_PATH = os.path.join(BASE_DIR, "app", "data", "latest.csv")
MODEL_PATH = os.path.join(BASE_DIR, "app", "models", "xgboost_classifier.pkl")

TARGET_COLUMN = "F3924"  # BOI target variable


def load_data() -> pd.DataFrame:
    """Load the dataset CSV.

    Returns:
        pandas DataFrame with all features and target.
    """
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    return df


def preprocess(df: pd.DataFrame) -> (pd.DataFrame, pd.Series):
    """Separate features and target, drop rows with missing target.
    """
    if TARGET_COLUMN not in df.columns:
        raise KeyError(f"Target column '{TARGET_COLUMN}' not present in data")
    y = df[TARGET_COLUMN]
    X = df.drop(columns=[TARGET_COLUMN])
    
    # Apply Feature Engineering
    X = generate_features(X)
    X = engineer_features(X)
    
    # Simple numeric fill for missing values – more complex preprocessing can be added later.
    X = X.fillna(0)
    # Convert object (string) columns to categorical dtype for XGBoost
    for col in X.select_dtypes(include=['object']).columns:
        X[col] = X[col].astype('category')
    return X, y


def train_and_save():
    df = load_data()
    X, y = preprocess(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        use_label_encoder=False,
        eval_metric="logloss",
        enable_categorical=True,
    )
    model.fit(X_train, y_train)

    # Save model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    # Compute metrics on test set for optional logging
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
    }
    print("XGBoost model trained and saved at", MODEL_PATH)
    print("Test metrics:", metrics)
    return metrics

if __name__ == "__main__":
    train_and_save()
