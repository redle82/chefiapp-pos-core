import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30


def authenticate():
    # Step 1: Request magic link
    resp = requests.post(f"{BASE_URL}/api/auth/request-magic-link", json={"email": EMAIL}, timeout=TIMEOUT)
    resp.raise_for_status()
    dev_token = resp.json().get("dev_token")
    assert dev_token, "dev_token missing in auth request response"

    # Step 2: Verify magic link
    resp = requests.get(f"{BASE_URL}/api/auth/verify-magic-link", params={"token": dev_token}, timeout=TIMEOUT)
    resp.raise_for_status()
    session_token = resp.json().get("session_token")
    assert session_token, "session_token missing in auth verify response"

    return session_token


def create_order(headers):
    payload = {"table_id": "table-1", "items": []}
    resp = requests.post(f"{BASE_URL}/api/orders", json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    order = resp.json()
    assert order.get("order_id"), "order_id missing in create order response"
    assert order.get("state") == "OPEN"
    return order.get("order_id")


def lock_order(order_id, headers):
    resp = requests.post(f"{BASE_URL}/api/orders/{order_id}/lock", headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    locked_order = resp.json()
    assert locked_order.get("order_id") == order_id
    assert locked_order.get("state") == "LOCKED"
    return locked_order


def delete_order(order_id, headers):
    # No specific DELETE endpoint mentioned in the PRD, so assume none exists.
    # Cleanup not possible via API, so skip.
    pass


def test_patch_api_orders_reject_modification_of_locked_order():
    session_token = authenticate()
    headers = {"x-chefiapp-token": session_token, "Content-Type": "application/json"}

    order_id = None
    try:
        # Create new order
        order_id = create_order(headers)

        # Lock the order
        locked_order = lock_order(order_id, headers)

        # Attempt to PATCH (modify) the locked order by adding items
        patch_payload = {
            "items": [
                {"item_id": "item-123", "quantity": 1, "price_snapshot_cents": 500}
            ]
        }
        resp = requests.patch(f"{BASE_URL}/api/orders/{order_id}", json=patch_payload, headers=headers, timeout=TIMEOUT)

        # Validate response is HTTP 400 with appropriate error message
        assert resp.status_code == 400
        error_resp = resp.json()
        assert "error" in error_resp or "message" in error_resp
        errmsg = error_resp.get("error") or error_resp.get("message")
        assert errmsg and ("locked" in errmsg.lower() or "immutable" in errmsg.lower()), f"Unexpected error message: {errmsg}"

    finally:
        if order_id:
            delete_order(order_id, headers)


test_patch_api_orders_reject_modification_of_locked_order()