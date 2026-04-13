from app.core.config import settings


def test_parse_receipt_success(client):
    files = {"file": ("receipt.png", b"fake-image-bytes", "image/png")}

    response = client.post("/api/v1/parse-receipt", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "merchant_name" in data
    assert "date" in data
    assert "total_amount" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    assert all("name" in item and "unit_price" in item for item in data["items"])


def test_parse_receipt_rejects_non_image_with_unified_envelope(client):
    files = {"file": ("receipt.txt", b"not-an-image", "text/plain")}

    response = client.post("/api/v1/parse-receipt", files=files)

    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "HTTP_ERROR"
    assert isinstance(body["error"]["details"], list)


def test_parse_receipt_rejects_oversized_file_with_unified_envelope(client):
    original_limit = settings.max_receipt_upload_size_mb
    settings.max_receipt_upload_size_mb = 1

    try:
        oversized_bytes = b"0" * (1024 * 1024 + 1)
        files = {"file": ("large.png", oversized_bytes, "image/png")}
        response = client.post("/api/v1/parse-receipt", files=files)

        assert response.status_code == 413
        body = response.json()
        assert body["error"]["code"] == "HTTP_ERROR"
        assert isinstance(body["error"]["details"], list)
    finally:
        settings.max_receipt_upload_size_mb = original_limit
