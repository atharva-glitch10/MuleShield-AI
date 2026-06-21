import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_explain_endpoint():
    record_id = 0
    response = client.get(f"/explain/{record_id}")
    assert response.status_code == 200, f"Status code: {response.status_code}"
    data = response.json()
    assert data["record_id"] == record_id
    assert isinstance(data["features"], list)
    for f in data["features"]:
        assert "feature" in f and "impact" in f
        assert isinstance(f["impact"], (float, int))
