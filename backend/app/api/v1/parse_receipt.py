from typing import Annotated

from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.core.config import settings
from app.core.rate_limit import limiter
from app.providers.receipt.mock_provider import MockReceiptParserProvider
from app.schemas.receipt import ParseReceiptResponse
from app.services.receipt_parsing_service import ReceiptParsingService

router = APIRouter(tags=["receipt"])


def get_receipt_parsing_service() -> ReceiptParsingService:
    return ReceiptParsingService(provider=MockReceiptParserProvider())


@router.post("/parse-receipt", response_model=ParseReceiptResponse, summary="Parse receipt image")
@limiter.limit(settings.parse_receipt_rate_limit)
async def parse_receipt(
    request: Request,
    file: Annotated[UploadFile, File(...)],
    service: Annotated[ReceiptParsingService, Depends(get_receipt_parsing_service)],
) -> ParseReceiptResponse:
    return await service.parse_receipt(file)
