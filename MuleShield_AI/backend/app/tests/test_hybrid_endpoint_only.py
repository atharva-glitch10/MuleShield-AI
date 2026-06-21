# test_hybrid_endpoint_only.py
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from fastapi.testclient import TestClient
import json
from app.main import app

client = TestClient(app)

def main():
    response = client.get("/model/hybrid-risk/0")
    print("Status code:", response.status_code)
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
    except Exception as e:
        print("Error parsing JSON:", e)
        print(response.text)

if __name__ == "__main__":
    main()
