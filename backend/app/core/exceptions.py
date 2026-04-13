from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas.error import ErrorDetail, ErrorPayload, ErrorResponse


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    details: list[ErrorDetail] = []
    if isinstance(exc.detail, str):
        details = [ErrorDetail(message=exc.detail)]

    payload = ErrorResponse(
        error=ErrorPayload(
            code="HTTP_ERROR",
            message="Request failed.",
            details=details,
        )
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details = [
        ErrorDetail(
            field=".".join(str(item) for item in error.get("loc", [])),
            message=error.get("msg", "Invalid request"),
        )
        for error in exc.errors()
    ]

    payload = ErrorResponse(
        error=ErrorPayload(
            code="VALIDATION_ERROR",
            message="Request validation failed.",
            details=details,
        )
    )
    return JSONResponse(status_code=422, content=payload.model_dump())


async def internal_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorPayload(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred.",
        )
    )
    return JSONResponse(status_code=500, content=payload.model_dump())
