import os
from typing import List
from pydantic import Field
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file."""

    # Core paths
    model_path: str = Field(
        default=os.path.join("app", "models", "isolation_forest.pkl"),
        env="MODEL_PATH",
    )
    xgb_model_path: str = Field(
        default=os.path.join("app", "models", "xgboost_classifier.pkl"),
        env="XGB_MODEL_PATH",
    )
    shap_cache_dir: str = Field(
        default=os.path.join("app", "shap_cache"),
        env="SHAP_CACHE_DIR",
    )
    data_path: str = Field(
        default=os.path.join("app", "data", "latest.csv"),
        env="DATA_PATH",
    )

    # Security
    api_key: str = Field(default="CHANGE_ME", env="API_KEY")

    # CORS
    allowed_origins: List[str] = Field(default=["*"], env="ALLOWED_ORIGINS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Singleton instance used throughout the app
settings: Settings = Settings()


def get_settings() -> Settings:
    """Return the singleton Settings instance (for FastAPI Depends)."""
    return settings
