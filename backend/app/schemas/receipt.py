from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ReceiptItem(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    unit_price: Decimal = Field(gt=0)


class ParseReceiptResponse(BaseModel):
    merchant_name: str = Field(min_length=1, max_length=200)
    date: date
    total_amount: Decimal = Field(gt=0)
    items: list[ReceiptItem] = Field(default_factory=list)
