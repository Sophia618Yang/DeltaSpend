import json
from decimal import Decimal

from app.core.config import settings
from app.schemas.receipt import ParseReceiptResponse, ReceiptItem


class OCRService:
    def __init__(self, api_key: str, model: str):
        try:
            from google import genai
        except ModuleNotFoundError as exc:
            raise RuntimeError(
                "google-genai is required for RECEIPT_PARSER_PROVIDER=real. "
                "Install backend requirements first."
            ) from exc

        self.client = genai.Client(api_key=api_key)
        self.model = model

    def parse_receipt(self, *, image_bytes: bytes, mime_type: str) -> ParseReceiptResponse:
        from google.genai import types

        prompt = (
            "You are extracting data from a financial purchase receipt. "
            "Be extremely precise. Return JSON only with keys: "
            "merchant_name (string), date (YYYY-MM-DD), total_amount (number), "
            "items (array of objects with name and unit_price number). "
            "Do not add any extra keys, text, commentary, or markdown."
        )

        response = self.client.models.generate_content(
            model=self.model,
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0,
            ),
        )

        payload = json.loads(response.text)
        items = [ReceiptItem(name=item["name"], unit_price=Decimal(str(item["unit_price"]))) for item in payload["items"]]

        return ParseReceiptResponse(
            merchant_name=payload["merchant_name"],
            date=payload["date"],
            total_amount=Decimal(str(payload["total_amount"])),
            items=items,
        )



def build_ocr_service() -> OCRService:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is required when RECEIPT_PARSER_PROVIDER=real")

    return OCRService(api_key=settings.gemini_api_key, model=settings.gemini_model)
