from fastapi import APIRouter
import threading
import traceback

from app.services.anomaly_service import train_anomaly_model

router = APIRouter(tags=["Training"])

@router.post("/train")
def train():
    result = train_anomaly_model("app/data/latest.csv")
    # Trigger XGBoost training + metric cache computation in a background thread
    # so the HTTP response is returned immediately
    def _background_train():
        try:
            from app.services.train_xgboost_service import train_and_save
            from app.services.model_metrics_service import compute_and_cache_all_metrics
            print("[Background] Starting XGBoost training...")
            train_and_save()
            print("[Background] XGBoost trained. Computing metrics cache...")
            compute_and_cache_all_metrics()
            print("[Background] Metrics cache written successfully.")
        except Exception as e:
            print(f"[Background] Training error: {e}")
            traceback.print_exc()
    thread = threading.Thread(target=_background_train, daemon=True)
    thread.start()
    return result

@router.post("/compute-metrics")
def compute_metrics_endpoint():
    """Manually trigger metrics computation and cache writing."""
    try:
        from app.services.model_metrics_service import compute_and_cache_all_metrics
        result = compute_and_cache_all_metrics()
        # Return only the scalar metrics, not the full curve arrays
        return {k: v for k, v in result.items()
                if k not in ("roc", "pr", "feature_importance", "model_comparison")}
    except Exception as e:
        return {"error": str(e)}