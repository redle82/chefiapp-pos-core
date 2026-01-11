import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30


def get_session_token():
    # Step 1: Request magic link
    resp = requests.post(
        f"{BASE_URL}/api/auth/request-magic-link",
        json={"email": EMAIL},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    dev_token = resp.json().get("dev_token")
    assert dev_token, "dev_token missing in request-magic-link response"

    # Step 2: Verify magic link
    resp = requests.get(
        f"{BASE_URL}/api/auth/verify-magic-link",
        params={"token": dev_token},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    session_token = resp.json().get("session_token")
    assert session_token, "session_token missing in verify-magic-link response"
    return session_token


def test_order_total_calculation_immutability():
    session_token = get_session_token()
    headers = {"x-chefiapp-token": session_token}

    # Create order with items
    create_order_payload = {
        "table_id": "T-123",
        "items": [
            {"item_id": "item1", "quantity": 2, "price_snapshot_cents": 1500},
            {"item_id": "item2", "quantity": 3, "price_snapshot_cents": 2500},
        ],
    }

    order_id = None
    try:
        # Create order (POST /api/orders)
        resp = requests.post(
            f"{BASE_URL}/api/orders", json=create_order_payload, headers=headers, timeout=TIMEOUT
        )
        resp.raise_for_status()
        order = resp.json()
        order_id = order.get("order_id")
        assert order_id, "order_id missing on order creation"
        assert order.get("state") == "OPEN"
        assert order.get("table_id") == create_order_payload["table_id"]

        # Attempt to patch order items while order is OPEN - this should succeed
        patch_payload = {
            "items": [
                {"item_id": "item1", "quantity": 10, "price_snapshot_cents": 1500}
            ]
        }
        patch_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}", json=patch_payload, headers=headers, timeout=TIMEOUT
        )
        patch_resp.raise_for_status()
        patched_order = patch_resp.json()
        assert patched_order.get("state") == "OPEN"

        # Lock order (PATCH /api/orders/{orderId}) - to move to LOCKED state and calculate total
        lock_payload = {"action": "lock"}
        lock_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}", json=lock_payload, headers=headers, timeout=TIMEOUT
        )
        lock_resp.raise_for_status()
        locked_order = lock_resp.json()
        assert locked_order.get("state") == "LOCKED"
        total_cents = locked_order.get("total_cents")
        assert isinstance(total_cents, int) and total_cents > 0, "total_cents must be computed and positive after lock"

        # Close order (POST /api/orders/{orderId}/close)
        close_resp = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/close", headers=headers, timeout=TIMEOUT
        )
        close_resp.raise_for_status()
        closed_order = close_resp.json()
        assert closed_order.get("order_id") == order_id
        assert closed_order.get("state") == "CLOSED"

        # Attempt to patch order after CLOSED: should fail immutability
        patch_payload_after_close = {
            "items": [
                {"item_id": "item1", "quantity": 1, "price_snapshot_cents": 1500}
            ]
        }
        patch_resp_after_close = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}", json=patch_payload_after_close, headers=headers, timeout=TIMEOUT
        )
        assert patch_resp_after_close.status_code == 400, "Modification of closed order should be rejected"

    finally:
        # Cleanup is not required as order is closed
        pass


test_order_total_calculation_immutability()
