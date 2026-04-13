from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import http_exception_handler, internal_exception_handler, validation_exception_handler
from app.core.rate_limit import limiter, rate_limit_exception_handler
from app.db.base import Base
from app.db.session import engine
from app.models.expense import Expense  # noqa: F401

app = FastAPI(title=settings.app_name)
app.state.limiter = limiter


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, internal_exception_handler)

app.add_middleware(SlowAPIMiddleware)
app.include_router(api_router, prefix=settings.api_prefix)
