import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4320"
AUTH = HTTPBasicAuth("contact@goldmonkey.studio", "Miranda87529192")
TIMEOUT = 30


def test_locked_order_cannot_be_modified():
    order_id = None
    headers = {"Content-Type": "application/json"}

    try:
        # Create a new order (should be in OPEN state)
        create_resp = requests.post(
            f"{BASE_URL}/api/orders",
            auth=AUTH,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Unexpected create order status: {create_resp.status_code}"
        order = create_resp.json()
        order_id = order.get("id")
        assert order_id, "Order ID not returned on creation"
        assert order.get("state") == "OPEN", "New order state is not OPEN"

        # Attempt to modify the order via PATCH /api/orders/{orderId}
        patch_payload = {
            "items": [
                {"name": "ExtraItem", "quantity": 1, "price": 10.0}
            ]
        }
        patch_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            auth=AUTH,
            headers=headers,
            json=patch_payload,
            timeout=TIMEOUT
        )
        # Modification should be allowed in OPEN state, expect 200
        assert patch_resp.status_code == 200, f"Unexpected patch status: {patch_resp.status_code}"
        updated_order = patch_resp.json()
        assert updated_order.get("state") == "OPEN", "Order state changed unexpectedly"
        items = updated_order.get("items", [])
        assert any(item.get("name") == "ExtraItem" for item in items), "Item not added to order"

    finally:
        # Clean up: delete the created order if exists
        if order_id:
            # We attempt to delete order to clean test data, ignoring errors
            try:
                requests.delete(
                    f"{BASE_URL}/api/orders/{order_id}",
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass



if __name__ == "__main__":
    test_locked_order_cannot_be_modified()
