from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0, description="Expense amount")
    category: str = Field(min_length=1, max_length=50)
    occurred_on: date
    note: str | None = Field(default=None, max_length=255)


class ExpenseResponse(ExpenseCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
