# Delta Spend Backend (MVP 1.0)

## Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Provider Switch (.env)

You can switch receipt parser provider via `.env`:

```env
RECEIPT_PARSER_PROVIDER=mock  # or real
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

- `mock`: uses local deterministic provider for development/tests.
- `real`: uses Gemini vision model through official Google SDK.

## Config via Environment Variables

All variables use the `DELTA_SPEND_` prefix unless explicitly noted:

- `DELTA_SPEND_DATABASE_URL` (default: `sqlite:///./delta_spend.db`)
- `DELTA_SPEND_DEFAULT_RATE_LIMIT` (default: `60/minute`)
- `DELTA_SPEND_READ_EXPENSES_RATE_LIMIT` (default: `30/minute`)
- `DELTA_SPEND_CREATE_EXPENSE_RATE_LIMIT` (default: `10/minute`)
- `DELTA_SPEND_PARSE_RECEIPT_RATE_LIMIT` (default: `5/minute`)
- `DELTA_SPEND_ALLOWED_RECEIPT_IMAGE_TYPES` (default: `image/jpeg,image/png,image/webp`)
- `DELTA_SPEND_MAX_RECEIPT_UPLOAD_SIZE_MB` (default: `10`)
- `RECEIPT_PARSER_PROVIDER` (`mock` or `real`)
- `GEMINI_API_KEY` (required for `real`)
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)

## API Endpoints

- `GET /api/v1/health`
- `GET /api/v1/expenses`
- `POST /api/v1/expenses`
- `POST /api/v1/parse-receipt` (multipart form-data, field: `file`)

## Unified Error Response

All HTTP errors (including 400/413/422/429/500) follow the same envelope:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": []
  }
}
```

## Testing

```bash
cd backend
pytest -q
```

## Layering (for upcoming AI module integration)

- `api/`: request/response layer only
- `services/`: orchestration/business workflow layer (future receipt parsing flow)
- `repositories/`: persistence access
- `models/`: SQLAlchemy models
