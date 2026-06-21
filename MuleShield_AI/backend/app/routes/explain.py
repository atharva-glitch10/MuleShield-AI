from fastapi import APIRouter, Depends
from app.dependencies.auth import api_key_auth
from app.services.shap_service import get_shap_explanation

router = APIRouter(tags=["Explainability"], dependencies=[Depends(api_key_auth)])

@router.get("/explain/{record_id}")
def explain(record_id: int, top_n: int = 3):
    """Return SHAP explanation for a record.
    Returns a JSON object with the record id and a list of top features.
    """
    return {"record_id": record_id, "features": get_shap_explanation(record_id, top_n)}

@router.get("/explain/global-summary")
def explain_global_summary():
    """Return aggregated SHAP summary for all features."""
    import numpy as np
    from app.services.shap_service import _load_model_and_explainer, _explainer, _MODEL_PATH
    from app.services.model_metrics_service import load_data
    import os
    
    if not os.path.exists(_MODEL_PATH):
        return {"error": "Model not yet trained"}

    _load_model_and_explainer()
    if _explainer is None:
        return {"error": "Model not available"}
        
    X, _ = load_data()
    
    # Subsample if dataset is too large to make it fast
    if len(X) > 1000:
        X = X.sample(n=1000, random_state=42)
        
    shap_values = _explainer.shap_values(X)
    if isinstance(shap_values, list):
        shap_vals = shap_values[1]
    else:
        shap_vals = shap_values
        
    mean_abs_shap = np.abs(shap_vals).mean(axis=0)
    feature_importance = sorted(
        zip(X.columns, mean_abs_shap),
        key=lambda x: x[1], reverse=True
    )
    return {"features": [{"name": str(f), "importance": round(float(v), 4)}
                         for f, v in feature_importance[:20]]}
