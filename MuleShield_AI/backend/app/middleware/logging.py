import uuid
import time
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class LoguruMiddleware(BaseHTTPMiddleware):
    """Middleware that adds a unique request ID and logs request/response details.

    The request ID is injected into the ``state`` object so downstream code can
    access it via ``request.state.request_id``.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start = time.time()
        logger.info(
            "[START] {method} {url} id={req_id}",
            method=request.method,
            url=str(request.url),
            req_id=request_id,
        )
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            logger.exception("[ERROR] id={req_id} error={exc}", req_id=request_id, exc=exc)
            raise
        process_time = (time.time() - start) * 1000
        logger.info(
            "[END] {method} {url} status={status_code} duration={duration:.2f}ms id={req_id}",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            duration=process_time,
            req_id=request_id,
        )
        return response
