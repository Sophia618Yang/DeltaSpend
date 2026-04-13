from app.core.config import settings
from app.providers.receipt.mock_provider import MockReceiptParserProvider
from app.providers.receipt.real_provider import GeminiReceiptParserProvider
from app.services.ocr_service import build_ocr_service


def build_receipt_provider():
    provider = settings.receipt_parser_provider.lower().strip()
    if provider == "real":
        return GeminiReceiptParserProvider(ocr_service=build_ocr_service())
    if provider == "mock":
        return MockReceiptParserProvider()

    raise ValueError("RECEIPT_PARSER_PROVIDER must be one of: mock, real")
