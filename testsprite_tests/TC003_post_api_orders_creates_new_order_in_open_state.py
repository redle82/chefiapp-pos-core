import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30

def test_post_api_orders_creates_new_order_in_open_state():
    session = requests.Session()
    try:
        # Step 1: Request magic link to get dev_token
        resp = session.post(
            f"{BASE_URL}/api/auth/request-magic-link",
            json={"email": EMAIL},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        resp_json = resp.json()
        dev_token = resp_json.get("dev_token")
        assert dev_token, "dev_token not found in response"

        # Step 2: Verify magic link with dev_token to get session_token
        resp = session.get(
            f"{BASE_URL}/api/auth/verify-magic-link",
            params={"token": dev_token},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        resp_json = resp.json()
        session_token = resp_json.get("session_token")
        assert session_token, "session_token not found in response"

        headers = {
            "x-chefiapp-token": session_token,
            "Content-Type": "application/json",
        }

        # Step 3: Create a new order via POST /api/orders
        resp = session.post(
            f"{BASE_URL}/api/orders",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 200, f"Expected 200 OK but got {resp.status_code}"
        order = resp.json()

        # Validate response fields and order state
        assert "id" in order, "Order ID is missing"
        assert "state" in order, "Order state is missing"
        assert order["state"] == "PENDING", f"Order state expected OPEN but was {order['state']}"
        assert "items" in order, "Order items field missing"
        assert isinstance(order["items"], list), "Order items should be a list"
        assert len(order["items"]) == 0, f"Expected no items in order, found {len(order['items'])}"

    finally:
        # Cleanup - delete created order if it was created
        try:
            if 'order' in locals() and "id" in order:
                session.delete(
                    f"{BASE_URL}/api/orders/{order['id']}",
                    headers={"x-chefiapp-token": session_token},
                    timeout=TIMEOUT,
                )
        except Exception:
            pass


if __name__ == "__main__":
    test_post_api_orders_creates_new_order_in_open_state()
