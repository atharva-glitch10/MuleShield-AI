from sklearn.feature_selection import mutual_info_classif
import pandas as pd

def rank_features(X: pd.DataFrame, y: pd.Series, top_n: int = 30) -> list:
    """Rank features by mutual information with the target."""
    # Convert categorical to codes if any
    X_numeric = X.copy()
    for col in X_numeric.select_dtypes(include=['object', 'category']).columns:
        X_numeric[col] = X_numeric[col].astype('category').cat.codes
    
    mi = mutual_info_classif(X_numeric.fillna(0), y, random_state=42)
    ranking = sorted(zip(X_numeric.columns, mi), key=lambda x: x[1], reverse=True)
    return [{"feature": f, "mutual_info": round(float(s), 6)} for f, s in ranking[:top_n]]
