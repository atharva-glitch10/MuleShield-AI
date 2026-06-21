from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
import pandas as pd
from app.services.model_metrics_service import load_data

MODELS = {
    "Logistic Regression": LogisticRegression(max_iter=300, random_state=42, solver="liblinear"),
    "Random Forest":       RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42, n_jobs=-1),
    "Gradient Boosting":   GradientBoostingClassifier(n_estimators=50, max_depth=4, random_state=42),
}

def compare_models():
    """Run 3-fold cross-validation on multiple models using a small, fast subset."""
    try:
        X, y = load_data()

        # Subsample rows (max 2000 for speed)
        n_rows = min(2000, len(X))
        sample_idx = X.sample(n=n_rows, random_state=42).index
        X_s = X.loc[sample_idx]
        y_s = y.loc[sample_idx]

        # Use only numeric columns, no categories (sklearn compat)
        X_s = X_s.select_dtypes(include=['number']).fillna(0)

        # Subsample features: keep top 30 by variance (fast proxy for importance)
        if X_s.shape[1] > 30:
            top_cols = X_s.var().nlargest(30).index
            X_s = X_s[top_cols]

        results = []
        for name, model in MODELS.items():
            # 3-fold CV for speed
            scores = cross_val_score(model, X_s, y_s, cv=3, scoring="f1")
            results.append({
                "model": name,
                "f1_mean": round(float(scores.mean()), 4),
                "f1_std":  round(float(scores.std()), 4),
            })

        return sorted(results, key=lambda x: x["f1_mean"], reverse=True)
    except Exception as e:
        return [{"model": "Comparison Failed", "f1_mean": 0.0, "f1_std": 0.0, "error": str(e)}]
