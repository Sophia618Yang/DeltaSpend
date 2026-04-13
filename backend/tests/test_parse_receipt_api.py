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


def test_parse_receipt_rejects_non_image(client):
    files = {"file": ("receipt.txt", b"not-an-image", "text/plain")}

    response = client.post("/api/v1/parse-receipt", files=files)

    assert response.status_code == 400
