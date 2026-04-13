from app.schemas.receipt import ParseReceiptResponse
from app.services.ocr_service import OCRService


class GeminiReceiptParserProvider:
    def __init__(self, ocr_service: OCRService):
        self.ocr_service = ocr_service

    async def parse(self, *, file_bytes: bytes, filename: str, content_type: str | None) -> ParseReceiptResponse:
        mime_type = content_type or "image/jpeg"
        return self.ocr_service.parse_receipt(image_bytes=file_bytes, mime_type=mime_type)
