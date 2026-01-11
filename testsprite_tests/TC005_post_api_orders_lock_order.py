import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30

def create_session():
    # Step 1: Request magic link
    resp = requests.post(
        f"{BASE_URL}/api/auth/request-magic-link",
        json={"email": EMAIL},
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    data = resp.json()
    dev_token = data.get("dev_token")
    if not dev_token:
        raise RuntimeError("dev_token missing in /request-magic-link response")

    # Step 2: Verify magic link
    resp = requests.get(
        f"{BASE_URL}/api/auth/verify-magic-link",
        params={"token": dev_token},
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    data = resp.json()
    session_token = data.get("session_token")
    if not session_token:
        raise RuntimeError("session_token missing in /verify-magic-link response")
    return session_token

def create_order(session_token):
    headers = {"x-chefiapp-token": session_token}
    json_data = {"table_id": "test-table-001"}
    resp = requests.post(
        f"{BASE_URL}/api/orders",
        headers=headers,
        json=json_data,
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    data = resp.json()
    order_id = data.get("order_id")
    state = data.get("state")
    if not order_id or state != "OPEN":
        raise RuntimeError("Failed to create OPEN order")
    return order_id

def add_items_to_order(session_token, order_id, items):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.patch(
        f"{BASE_URL}/api/orders/{order_id}",
        headers=headers,
        json={"items": items},
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("state") != "OPEN":
        raise RuntimeError("Order state changed unexpectedly when adding items")
    return data

def lock_order(session_token, order_id):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.post(
        f"{BASE_URL}/api/orders/{order_id}/lock",
        headers=headers,
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    return resp.json()

def get_order(session_token, order_id):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.get(
        f"{BASE_URL}/api/orders/{order_id}",
        headers=headers,
        timeout=TIMEOUT
    )
    resp.raise_for_status()
    return resp.json()

def patch_order_expect_failure(session_token, order_id, items):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.patch(
        f"{BASE_URL}/api/orders/{order_id}",
        headers=headers,
        json={"items": items},
        timeout=TIMEOUT
    )
    return resp

def delete_order(session_token, order_id):
    # The PRD does not mention delete order endpoint, so skipping deletion.
    # Orders should be cleaned up by system or in persistent db reset after tests.
    # If needed, implement here.
    pass

def test_post_api_orders_lock_order():
    session_token = create_session()
    order_id = None
    try:
        order_id = create_order(session_token)

        # Add items to order - use at least 2 different items with known prices and quantities
        items = [
            {"menu_item_id": "item-001", "quantity": 2, "price_snapshot_cents": 500},
            {"menu_item_id": "item-002", "quantity": 1, "price_snapshot_cents": 300}
        ]
        updated_order = add_items_to_order(session_token, order_id, items)
        assert updated_order["order_id"] == order_id
        assert updated_order["state"] == "OPEN"
        assert "items" in updated_order
        assert len(updated_order["items"]) == 2

        # Lock the order
        lock_response = lock_order(session_token, order_id)
        assert lock_response["state"] == "LOCKED"

        # Retrieve order to verify total and state
        locked_order = get_order(session_token, order_id)
        assert locked_order["order_id"] == order_id
        assert locked_order["state"] == "LOCKED"
        assert "total_cents" in locked_order
        expected_total = sum(item["quantity"] * item["price_snapshot_cents"] for item in items)
        assert locked_order["total_cents"] == expected_total

        # Attempt to modify locked order: should fail (immutable)
        patch_resp = patch_order_expect_failure(session_token, order_id, [{"menu_item_id": "item-003","quantity":1,"price_snapshot_cents":100}])
        assert patch_resp.status_code == 400 or patch_resp.status_code == 403
        error_resp_json = None
        try:
            error_resp_json = patch_resp.json()
        except Exception:
            pass
        if error_resp_json and "error" in error_resp_json:
            assert isinstance(error_resp_json["error"], str)
    finally:
        # No delete order endpoint in PRD, so can't delete order explicitly here
        pass

test_post_api_orders_lock_order()