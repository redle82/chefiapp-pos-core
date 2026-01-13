import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TEST_PRODUCT_ID = "00000000-0000-0000-0000-000000000001"
REQUEST_TIMEOUT = 30


def authenticate():
    try:
        # Step 1: Request magic link
        resp = requests.post(
            f"{BASE_URL}/api/auth/request-magic-link",
            json={"email": EMAIL},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        dev_token = resp.json().get("dev_token")
        assert dev_token, "dev_token not found in /request-magic-link response"

        # Step 2: Verify magic link
        resp = requests.get(
            f"{BASE_URL}/api/auth/verify-magic-link",
            params={"token": dev_token},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        session_token = resp.json().get("session_token")
        assert session_token, "session_token not found in /verify-magic-link response"

        return session_token
    except (requests.RequestException, AssertionError) as e:
        raise RuntimeError(f"Authentication failed: {e}") from e


def test_order_creation_and_state_open():
    session_token = authenticate()
    headers = {"x-chefiapp-token": session_token, "Content-Type": "application/json"}

    order_payload = {
        "items": [
            {
                "productId": TEST_PRODUCT_ID,
                "name": "Test Product",
                "quantity": 1,
                "unitPrice": 1000,  # Example price in cents
            }
        ]
    }

    order_id = None

    try:
        resp = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_payload,
            headers=headers,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        resp_json = resp.json()
        order_id = resp_json.get("id")
        state = resp_json.get("state")

        assert order_id, "Order ID not returned in response"
        assert state == "PENDING", f"Expected order state 'PENDING', got '{state}'"

    finally:
        if order_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/orders/{order_id}",
                    headers=headers,
                    timeout=REQUEST_TIMEOUT,
                )
            except requests.RequestException:
                pass



if __name__ == "__main__":
    test_order_creation_and_state_open()
