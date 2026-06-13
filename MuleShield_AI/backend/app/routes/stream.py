import asyncio
import json
import random
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(
    tags=["Real-Time Streaming"]
)

@router.websocket("/ws/simulation")
async def simulation_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Generate a mock transaction
            mock_transaction = {
                "transaction_id": f"TXN-{random.randint(10000, 99999)}",
                "amount": round(random.uniform(10.0, 5000.0), 2),
                "is_anomaly": random.random() < 0.05, # 5% chance of being an anomaly
                "risk_score": random.randint(10, 99) if random.random() < 0.1 else random.randint(1, 15)
            }
            
            if mock_transaction["is_anomaly"]:
                mock_transaction["risk_score"] = random.randint(75, 99)
                
            await websocket.send_text(json.dumps(mock_transaction))
            
            # Emit every 2 seconds
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
