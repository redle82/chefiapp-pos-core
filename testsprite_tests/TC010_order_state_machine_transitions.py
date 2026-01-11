import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30

def get_session_token():
    # Step 1: request magic link
    resp = requests.post(
        f"{BASE_URL}/api/auth/request-magic-link",
        json={"email": EMAIL},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    dev_token = resp.json().get("dev_token")
    assert dev_token, "dev_token missing in magic link response"

    # Step 2: verify magic link
    resp = requests.get(
        f"{BASE_URL}/api/auth/verify-magic-link",
        params={"token": dev_token},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    session_token = resp.json().get("session_token")
    assert session_token, "session_token missing in verify magic link response"
    return session_token

def create_order(headers):
    payload = {
        "table_id": "T1"
    }
    resp = requests.post(f"{BASE_URL}/api/orders", json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    order = resp.json()
    assert "order_id" in order, "order_id missing in create order response"
    assert order.get("state") == "OPEN", f"Initial order state expected OPEN but got {order.get('state')}"
    return order["order_id"]

def delete_order(order_id, headers):
    # There is no explicit delete endpoint documented; so no deletion possible.
    # Orders cannot be deleted by API, so no deletion in finally block.
    # So this will be a no-op.
    pass

def patch_order_items(order_id, headers, items):
    resp = requests.patch(f"{BASE_URL}/api/orders/{order_id}", json={"items": items}, headers=headers, timeout=TIMEOUT)
    return resp

def lock_order(order_id, headers):
    resp = requests.post(f"{BASE_URL}/api/orders/{order_id}/lock", headers=headers, timeout=TIMEOUT)
    return resp

def close_order(order_id, headers):
    resp = requests.post(f"{BASE_URL}/api/orders/{order_id}/close", headers=headers, timeout=TIMEOUT)
    return resp

def get_order(order_id, headers):
    resp = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def test_TC010_order_state_machine_transitions():
    session_token = get_session_token()
    headers = {"x-chefiapp-token": session_token}

    order_id = create_order(headers)

    try:
        # 1) Check initial state: OPEN
        order = get_order(order_id, headers)
        assert order["state"] == "OPEN", "Order initial state is not OPEN"

        # 2) Valid transition OPEN -> LOCKED
        lock_resp = lock_order(order_id, headers)
        assert lock_resp.status_code == 200, "Lock order request failed"
        locked_order = lock_resp.json()
        assert locked_order["state"] == "LOCKED", "Order state did not change to LOCKED after lock"

        # 3) Valid transition LOCKED -> CLOSED
        close_resp = close_order(order_id, headers)
        assert close_resp.status_code == 200, "Close order request failed"
        closed_order = close_resp.json()
        assert closed_order["state"] == "CLOSED", "Order state did not change to CLOSED after close"

        # 4) Invalid transition CLOSED -> OPEN (try to patch items)
        patch_resp = patch_order_items(order_id, headers, items=[{"menu_item_id":"m1","quantity":1,"price_snapshot_cents":100}])
        assert patch_resp.status_code == 400 or patch_resp.status_code == 403, f"PATCH on CLOSED order should fail, got {patch_resp.status_code}"

        # 5) Invalid transition LOCKED -> OPEN (try to revert an order to OPEN by patching locked order)
        # Create a fresh order and lock it for this test
        order_id_2 = create_order(headers)
        lock_resp_2 = lock_order(order_id_2, headers)
        assert lock_resp_2.status_code == 200 and lock_resp_2.json().get("state") == "LOCKED"

        patch_resp_2 = patch_order_items(order_id_2, headers, items=[{"menu_item_id":"m1","quantity":1,"price_snapshot_cents":100}])
        assert patch_resp_2.status_code == 400 or patch_resp_2.status_code == 403, f"PATCH on LOCKED order should fail, got {patch_resp_2.status_code}"

        # Try POST /{orderId}/lock again on locked order (should be idempotent or error)
        lock_resp_3 = lock_order(order_id_2, headers)
        # Accept 200 with LOCKED state or 400/409 for invalid transition
        assert lock_resp_3.status_code in (200, 400, 409), f"Re-locking LOCKED order unexpected status {lock_resp_3.status_code}"

        # Try POST /{orderId}/close then PATCH back to OPEN on locked order
        close_resp_2 = close_order(order_id_2, headers)
        assert close_resp_2.status_code == 200 and close_resp_2.json().get("state") == "CLOSED"

        # Try to reopen closed order by patch (should fail)
        patch_resp_3 = patch_order_items(order_id_2, headers, items=[{"menu_item_id":"m1","quantity":1,"price_snapshot_cents":100}])
        assert patch_resp_3.status_code == 400 or patch_resp_3.status_code == 403, f"PATCH on CLOSED order should fail, got {patch_resp_3.status_code}"

    finally:
        # No delete endpoint; cleanup omitted
        pass

test_TC010_order_state_machine_transitions()