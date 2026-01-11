import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30

def create_session():
    try:
        r = requests.post(f"{BASE_URL}/api/auth/request-magic-link", json={"email": EMAIL}, timeout=TIMEOUT)
        r.raise_for_status()
        dev_token = r.json().get("dev_token")
        if not dev_token:
            raise ValueError("No dev_token received")

        vr = requests.get(f"{BASE_URL}/api/auth/verify-magic-link", params={"token": dev_token}, timeout=TIMEOUT)
        vr.raise_for_status()
        session_token = vr.json().get("session_token")
        if not session_token:
            raise ValueError("No session_token received")

        return session_token
    except Exception as e:
        raise RuntimeError(f"Failed to create session: {e}")

def create_order(headers, table_id=1):
    payload = {"table_id": table_id}
    r = requests.post(f"{BASE_URL}/api/orders", json=payload, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    order = r.json()
    if not order.get("order_id") or order.get("state") != "OPEN":
        raise ValueError("Order creation failed or wrong state")
    return order

def patch_order_add_items(order_id, headers, items):
    payload = {"items": items}
    r = requests.patch(f"{BASE_URL}/api/orders/{order_id}", json=payload, headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    order = r.json()
    return order

def lock_order(order_id, headers):
    r = requests.post(f"{BASE_URL}/api/orders/{order_id}/lock", headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    order = r.json()
    return order

def close_order(order_id, headers):
    r = requests.post(f"{BASE_URL}/api/orders/{order_id}/close", headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    order = r.json()
    return order

def get_order(order_id, headers):
    r = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers, timeout=TIMEOUT)
    r.raise_for_status()
    order = r.json()
    return order

def test_post_api_orders_close_order():
    session_token = create_session()
    headers = {"x-chefiapp-token": session_token}

    order = None
    try:
        order = create_order(headers)
        order_id = order["order_id"]

        # Add items to order
        items = [
            {"item_id": "item1", "quantity": 2, "price_snapshot_cents": 500},
            {"item_id": "item2", "quantity": 1, "price_snapshot_cents": 300},
        ]
        order = patch_order_add_items(order_id, headers, items)
        assert order["state"] == "OPEN"
        assert "items" in order and len(order["items"]) == 2

        # Lock order
        order = lock_order(order_id, headers)
        assert order["state"] == "LOCKED"
        assert "total_cents" in order and order["total_cents"] == 1300

        # Close order
        order = close_order(order_id, headers)
        assert order["state"] == "CLOSED"

        # Verify order state is CLOSED and immutable
        order_fetched = get_order(order_id, headers)
        assert order_fetched["state"] == "CLOSED"

        # Attempt to modify closed order => should fail with 400
        patch_response = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            json={"items": [{"item_id": "item3", "quantity": 1, "price_snapshot_cents": 200}]},
            headers=headers,
            timeout=TIMEOUT,
        )
        assert patch_response.status_code == 400

    finally:
        if order and "order_id" in order:
            # No explicit delete endpoint for orders mentioned, so best effort no-op here.
            # If deletion endpoint existed, it would be called here to cleanup.
            pass

test_post_api_orders_close_order()