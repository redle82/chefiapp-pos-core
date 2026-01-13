import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4320"
AUTH = HTTPBasicAuth("contact@goldmonkey.studio", "Miranda87529192")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_order_modification_should_allow_item_addition_when_open():
    order_id = None
    # Payload to create an order (empty items to start)
    create_payload = {}
    # Payload to add an item (example item)
    add_item_payload = {
        "items": [
            {
                "name": "Test Item",
                "quantity": 1,
                "price": 9.99
            }
        ]
    }

    def create_order():
        response = requests.post(
            f"{BASE_URL}/api/orders",
            auth=AUTH,
            headers=HEADERS,
            json=create_payload,
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        return response.json()["orderId"]

    def patch_order(order_id, payload):
        url = f"{BASE_URL}/api/orders/{order_id}"
        response = requests.patch(
            url,
            auth=AUTH,
            headers=HEADERS,
            json=payload,
            timeout=TIMEOUT,
        )
        return response

    def close_order(order_id):
        url = f"{BASE_URL}/api/orders/{order_id}/close"
        response = requests.post(
            url,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        response.raise_for_status()

    def delete_order(order_id):
        # No DELETE endpoint specified in PRD; we cannot delete.
        # So no deletion possible, thus no finally delete step.
        # We'll just leave the order created for test isolation.
        pass

    try:
        # 1) Create new order, should be in OPEN state
        order_id = create_order()
        assert order_id is not None and isinstance(order_id, str)

        # 2) Add item to OPEN order - should succeed
        resp_open = patch_order(order_id, add_item_payload)
        assert resp_open.status_code == 200
        resp_open_json = resp_open.json()
        assert "items" in resp_open_json
        # At least 1 item added
        items = resp_open_json["items"]
        assert any(item["name"] == "Test Item" for item in items)

        # 3) Close the order (lock it)
        close_order(order_id)

        # 4) Attempt to add item to LOCKED order - should fail
        resp_locked = patch_order(order_id, add_item_payload)
        assert resp_locked.status_code >= 400
        # Expect error message or indication of rejection due to state
        resp_locked_json = resp_locked.json()
        error_msg = resp_locked_json.get("error") or resp_locked_json.get("message") or ""
        assert "locked" in error_msg.lower() or "cannot modify" in error_msg.lower()

    finally:
        if order_id:
            delete_order(order_id)



if __name__ == "__main__":
    test_order_modification_should_allow_item_addition_when_open()
