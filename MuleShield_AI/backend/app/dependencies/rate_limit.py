from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from starlette.requests import Request

# Allow 100 requests per minute per IP
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

def init_rate_limit(app):
    """Attach rate limiting middleware and exception handler to FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)
    # Add middleware – SlowAPI uses starlette's middleware internally when the app is called
    # No explicit middleware class needed; just expose the limiter for route decorators
    return limiter
