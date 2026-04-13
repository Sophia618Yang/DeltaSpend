from datetime import date
from decimal import Decimal

from app.schemas.receipt import ParseReceiptResponse, ReceiptItem


class MockReceiptParserProvider:
    """Mock provider for MVP wiring.

    Replace with real VLM provider in the next iteration.
    """

    async def parse(self, *, file_bytes: bytes, filename: str, content_type: str | None) -> ParseReceiptResponse:
        return ParseReceiptResponse(
            merchant_name="Mock Mart",
            date=date(2026, 4, 13),
            total_amount=Decimal("18.50"),
            items=[
                ReceiptItem(name="Milk", unit_price=Decimal("4.20")),
                ReceiptItem(name="Bread", unit_price=Decimal("3.30")),
                ReceiptItem(name="Coffee", unit_price=Decimal("11.00")),
            ],
        )
