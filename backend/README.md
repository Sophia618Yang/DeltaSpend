# Delta Spend Backend (MVP 1.0)

## Run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Config via Environment Variables

All variables use the `DELTA_SPEND_` prefix:

- `DELTA_SPEND_DATABASE_URL` (default: `sqlite:///./delta_spend.db`)
- `DELTA_SPEND_DEFAULT_RATE_LIMIT` (default: `60/minute`)
- `DELTA_SPEND_READ_EXPENSES_RATE_LIMIT` (default: `30/minute`)
- `DELTA_SPEND_CREATE_EXPENSE_RATE_LIMIT` (default: `10/minute`)
- `DELTA_SPEND_PARSE_RECEIPT_RATE_LIMIT` (default: `5/minute`)
- `DELTA_SPEND_ALLOWED_RECEIPT_IMAGE_TYPES` (default: `image/jpeg,image/png,image/webp`)
- `DELTA_SPEND_MAX_RECEIPT_UPLOAD_SIZE_MB` (default: `10`)

## API Endpoints

- `GET /api/v1/health`
- `GET /api/v1/expenses`
- `POST /api/v1/expenses`
- `POST /api/v1/parse-receipt` (multipart form-data, field: `file`)

## Unified Error Response

All 429/422/500 errors follow the same envelope:

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
