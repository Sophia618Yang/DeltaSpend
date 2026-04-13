from typing import Protocol

from app.schemas.receipt import ParseReceiptResponse


class ReceiptParserProvider(Protocol):
    async def parse(self, *, file_bytes: bytes, filename: str, content_type: str | None) -> ParseReceiptResponse:
        ...
