from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.providers.receipt.base import ReceiptParserProvider
from app.schemas.receipt import ParseReceiptResponse


class ReceiptParsingService:
    def __init__(self, provider: ReceiptParserProvider):
        self.provider = provider

    async def parse_receipt(self, file: UploadFile) -> ParseReceiptResponse:
        allowed_types = {item.strip() for item in settings.allowed_receipt_image_types.split(",") if item.strip()}
        if not file.content_type or file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only these image types are supported: {sorted(allowed_types)}",
            )

        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        max_upload_bytes = settings.max_receipt_upload_size_mb * 1024 * 1024
        if len(file_bytes) > max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds max size of {settings.max_receipt_upload_size_mb}MB.",
            )

        return await self.provider.parse(
            file_bytes=file_bytes,
            filename=file.filename or "receipt-image",
            content_type=file.content_type,
        )
