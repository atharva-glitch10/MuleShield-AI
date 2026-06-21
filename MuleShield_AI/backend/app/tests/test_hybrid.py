# test_hybrid.py
import json
from fastapi.testclient import TestClient
from app.main import app
from app.services.shap_service import get_shap_explanation

client = TestClient(app)

def test_hybrid_endpoint():
    response = client.get("/model/hybrid-risk/0")
    print("\nHybrid risk endpoint response (status", response.status_code, "):")
    print(json.dumps(response.json(), indent=2))

def test_shap_service():
    explanations = get_shap_explanation(record_id=0, top_n=3)
    print("\nSHAP explanation (top 3 features):")
    print(json.dumps(explanations, indent=2))

if __name__ == "__main__":
    test_hybrid_endpoint()
    test_shap_service()
