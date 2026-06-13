from fastapi import Header, HTTPException, Depends
from app.config import Settings, get_settings


def api_key_auth(
    x_api_key: str = Header(...),
    settings: Settings = Depends(get_settings),
) -> Settings:
    """Validate the X-API-Key header against the secret defined in .env.

    Returns the Settings instance for downstream injection.
    """
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return settings
