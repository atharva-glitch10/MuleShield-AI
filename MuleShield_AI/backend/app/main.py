import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Project imports
from app.config import settings
from app.middleware.logging import LoguruMiddleware
from app.dependencies.rate_limit import init_rate_limit

# Core Routes
from app.routes.prediction import router as prediction_router
from app.routes.upload import router as upload_router
from app.routes.dataset import router as dataset_router
from app.routes.training import router as training_router

# Analytics Routes
from app.routes.model import router as model_router
from app.routes.anomaly import router as anomaly_router
from app.routes.dashboard import router as dashboard_router
from app.routes.explain import router as explain_router
from app.routes.alerts import router as alerts_router

# Investigation Routes
from app.routes.investigation import router as investigation_router

# Graph Intelligence Routes
from app.routes.graph import router as graph_router

# Real-Time Routes
from app.routes.stream import router as stream_router

# ML service
from app.services.anomaly_service import train_anomaly_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: train model if it doesn't exist yet."""
    if not os.path.exists(settings.model_path):
        train_anomaly_model(settings.data_path)
    yield


app = FastAPI(
    title="MuleShield AI",
    version="1.0.0",
    description="AI/ML Based Mule Account Detection Platform",
    lifespan=lifespan,
)

# ===================================
# Middleware
# ===================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoguruMiddleware)

# Initialise rate limiting (100 req/min per IP)
init_rate_limit(app)

# ===================================
# Core APIs
# ===================================

app.include_router(prediction_router)
app.include_router(upload_router)
app.include_router(dataset_router)
app.include_router(training_router)

# ===================================
# Analytics APIs
# ===================================

app.include_router(model_router)
app.include_router(anomaly_router)
app.include_router(dashboard_router)
app.include_router(explain_router)
app.include_router(alerts_router)

# ===================================
# Investigation APIs
# ===================================

app.include_router(investigation_router)

# ===================================
# Graph Intelligence APIs
# ===================================

app.include_router(graph_router)

# ===================================
# Real-Time APIs
# ===================================

app.include_router(stream_router)

# ===================================
# Root Endpoint
# ===================================

@app.get("/")
def root():
    return {
        "project": "MuleShield AI",
        "status": "running",
        "version": "1.0.0",
    }


# ===================================
# Health Check
# ===================================

@app.get("/health")
def health():
    return {"status": "healthy"}