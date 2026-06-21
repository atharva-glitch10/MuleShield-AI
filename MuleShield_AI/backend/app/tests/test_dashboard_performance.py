import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_model_performance_dashboard():
    response = client.get("/dashboard/model-performance")
    assert response.status_code == 200, f"Status code: {response.status_code}"
    data = response.json()
    # Expect metric keys
    expected_keys = {"accuracy", "precision", "recall", "f1", "roc_auc", "confusion_matrix"}
    assert expected_keys.issubset(set(data.keys())), f"Missing keys: {expected_keys - set(data.keys())}"
