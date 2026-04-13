from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.schemas.expense import ExpenseCreate, ExpenseResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["expenses"])


def get_expense_service(db: Annotated[Session, Depends(get_db)]) -> ExpenseService:
    return ExpenseService(db)


@router.get("", response_model=list[ExpenseResponse], summary="List expenses")
@limiter.limit(settings.read_expenses_rate_limit)
async def list_expenses(
    request: Request,
    service: Annotated[ExpenseService, Depends(get_expense_service)],
) -> list[ExpenseResponse]:
    return service.list_expenses()


@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an expense",
)
@limiter.limit(settings.create_expense_rate_limit)
async def create_expense(
    request: Request,
    payload: ExpenseCreate,
    service: Annotated[ExpenseService, Depends(get_expense_service)],
) -> ExpenseResponse:
    return service.create_expense(payload)
