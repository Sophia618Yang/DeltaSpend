def test_create_and_list_expenses(client):
    payload = {
        "amount": "23.50",
        "category": "food",
        "occurred_on": "2026-04-13",
        "note": "noodles",
    }

    create_response = client.post("/api/v1/expenses", json=payload)
    assert create_response.status_code == 201
    data = create_response.json()
    assert data["id"] == 1
    assert data["category"] == "food"

    list_response = client.get("/api/v1/expenses")
    assert list_response.status_code == 200
    items = list_response.json()
    assert len(items) == 1
    assert items[0]["id"] == 1


def test_validation_error_uses_unified_envelope(client):
    payload = {
        "amount": "-1",
        "category": "",
        "occurred_on": "invalid-date",
    }

    response = client.post("/api/v1/expenses", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert data["error"]["message"] == "Request validation failed."
    assert isinstance(data["error"]["details"], list)
