from app.core.config import settings
from app.providers.receipt.factory import build_receipt_provider
from app.providers.receipt.mock_provider import MockReceiptParserProvider
from app.providers.receipt.real_provider import GeminiReceiptParserProvider


def test_build_receipt_provider_returns_mock_by_default():
    original = settings.receipt_parser_provider
    settings.receipt_parser_provider = "mock"

    try:
        provider = build_receipt_provider()
        assert isinstance(provider, MockReceiptParserProvider)
    finally:
        settings.receipt_parser_provider = original


def test_build_receipt_provider_returns_real_when_configured():
    original_provider = settings.receipt_parser_provider
    original_key = settings.gemini_api_key

    settings.receipt_parser_provider = "real"
    settings.gemini_api_key = "fake-key"

    try:
        provider = build_receipt_provider()
        assert isinstance(provider, GeminiReceiptParserProvider)
    finally:
        settings.receipt_parser_provider = original_provider
        settings.gemini_api_key = original_key
