import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4320"
AUTH = HTTPBasicAuth("contact@goldmonkey.studio", "Miranda87529192")
TIMEOUT = 30

def test_order_can_be_closed_successfully():
    order_id = None

    try:
        # Step 1: Create order (default state OPEN)
        create_order_resp = requests.post(
            f"{BASE_URL}/api/orders",
            json={"items": [{"productId": "00000000-0000-0000-0000-000000000001", "quantity": 1}]},
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert create_order_resp.status_code == 201, f"Order creation failed: {create_order_resp.text}"
        order = create_order_resp.json()
        order_id = order.get("id")
        assert order_id, "Created order has no ID"
        assert order.get("state") == "OPEN", f"Expected initial state OPEN but got {order.get('state')}"

        # Step 2: Lock the order (transition OPEN -> LOCKED)
        lock_resp = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/lock",
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert lock_resp.status_code == 200, f"Order lock failed: {lock_resp.text}"
        locked_order = lock_resp.json()
        assert locked_order.get("state") == "LOCKED", f"Expected state LOCKED after locking but got {locked_order.get('state')}"

        # Step 3: Transition order from LOCKED to PAID by patching state (simulate payment)
        patch_payload = {"state": "PAID"}
        patch_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            json=patch_payload,
            auth=AUTH,
            timeout=TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        assert patch_resp.status_code == 200, f"Order state patch to PAID failed: {patch_resp.text}"
        patched_order = patch_resp.json()
        assert patched_order.get("state") == "PAID", f"Expected state PAID after patch but got {patched_order.get('state')}"

        # Step 4: Close the order using POST /api/orders/{orderId}/close
        close_resp = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/close",
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert close_resp.status_code == 200, f"Order close failed: {close_resp.text}"
        closed_order = close_resp.json()
        assert closed_order.get("state") == "CLOSED", f"Expected state CLOSED after close but got {closed_order.get('state')}"

    finally:
        if order_id:
            # Clean up - delete the order (assuming DELETE endpoint exists for cleanup)
            try:
                requests.delete(
                    f"{BASE_URL}/api/orders/{order_id}",
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass


if __name__ == "__main__":
    test_order_can_be_closed_successfully()
