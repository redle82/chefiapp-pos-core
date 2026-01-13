import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30

def create_session_token():
    # Step 1: Request magic link
    resp = requests.post(
        f"{BASE_URL}/api/auth/request-magic-link",
        json={"email": EMAIL},
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    data = resp.json()
    dev_token = data.get("dev_token")
    assert dev_token, "dev_token not found in response"

    # Step 2: Verify magic link
    resp = requests.get(
        f"{BASE_URL}/api/auth/verify-magic-link",
        params={"token": dev_token},
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    data = resp.json()
    session_token = data.get("session_token")
    assert session_token, "session_token not found in response"
    return session_token

def test_post_api_orders_create_order():
    session_token = create_session_token()
    headers = {
        "x-chefiapp-token": session_token,
        "Content-Type": "application/json"
    }

    # Create a new order with a table_id, as required
    payload = {
        "table_id": "table-123"
    }

    order_id = None
    try:
        resp = requests.post(
            f"{BASE_URL}/api/orders",
            json=payload,
            headers=headers,
            timeout=TIMEOUT
        )
        resp.raise_for_status()
        data = resp.json()

        # Validate response keys
        assert "order_id" in data, "Response missing order_id"
        assert "state" in data, "Response missing state"
        assert "table_id" in data, "Response missing table_id"
        assert isinstance(data["table_id"], str), f"table_id should be string but got {type(data['table_id'])}"
        assert data["state"] == "PENDING", f"Expected state 'OPEN', got '{data['state']}'"

        order_id = data["order_id"]

        # Additional check: fetch order by GET to verify persistence and correctness
        get_resp = requests.get(
            f"{BASE_URL}/api/orders/{order_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        get_resp.raise_for_status()
        order_data = get_resp.json()
        assert order_data["order_id"] == order_id
        assert order_data["state"] == "PENDING"
        assert "table_id" in order_data
        assert isinstance(order_data["table_id"], str), f"table_id should be string but got {type(order_data['table_id'])}"

    finally:
        pass


if __name__ == "__main__":
    test_post_api_orders_create_order()
