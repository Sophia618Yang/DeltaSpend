from fastapi import HTTPException, UploadFile, status

from app.providers.receipt.base import ReceiptParserProvider
from app.schemas.receipt import ParseReceiptResponse


class ReceiptParsingService:
    def __init__(self, provider: ReceiptParserProvider):
        self.provider = provider

    async def parse_receipt(self, file: UploadFile) -> ParseReceiptResponse:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image uploads are supported.",
            )

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        return await self.provider.parse(
            file_bytes=file_bytes,
            filename=file.filename or "receipt-image",
            content_type=file.content_type,
        )
