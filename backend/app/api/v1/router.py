from fastapi import APIRouter

from app.api.v1.expenses import router as expenses_router
from app.api.v1.health import router as health_router
from app.api.v1.parse_receipt import router as parse_receipt_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(expenses_router)
api_router.include_router(parse_receipt_router)
