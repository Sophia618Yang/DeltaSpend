from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings
from app.schemas.error import ErrorPayload, ErrorResponse


limiter = Limiter(key_func=get_remote_address, default_limits=[settings.default_rate_limit])


async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorPayload(
            code="RATE_LIMIT_EXCEEDED",
            message="Too many requests. Please try again later.",
        )
    )
    return JSONResponse(status_code=429, content=payload.model_dump())
