import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4320"
AUTH = HTTPBasicAuth("contact@goldmonkey.studio", "Miranda87529192")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_order_items_can_be_added_to_open_order():
    order_id = None
    try:
        # Step 1: Create a new order (should be in OPEN state)
        create_order_payload = {
            "items": [
                {"product_id": "prod-001", "name": "InitialItem", "price": 1.00, "quantity": 1}
            ]
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/orders",
            json=create_order_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Order creation failed: {create_resp.text}"
        order_data = create_resp.json()
        order_id = order_data.get("id")
        assert order_id, "Created order ID is missing"
        assert order_data.get("state") == "OPEN", f"Expected order state OPEN but got {order_data.get('state')}"
        assert isinstance(order_data.get("items"), list), "Expected items to be a list"
        assert order_data.get("total") == 0, "Expected new order total to be zero"

        # Step 2: Patch the order to add items
        items_to_add = [
            {"product_id": "prod-002", "name": "Burger", "price": 12.50, "quantity": 2},
            {"product_id": "prod-003", "name": "Soda", "price": 3.00, "quantity": 1}
        ]
        patch_payload = {
            "items": items_to_add
        }
        patch_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            json=patch_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert patch_resp.status_code == 200, f"Failed to patch order with items: {patch_resp.text}"
        patched_order = patch_resp.json()
        assert patched_order.get("id") == order_id, "Order ID mismatch after patch"
        assert patched_order.get("state") == "OPEN", f"Order state changed after patch: {patched_order.get('state')}"
        response_items = patched_order.get("items")
        assert isinstance(response_items, list), "Items are not a list after patch"
        # Validate all added items are present
        names_in_response = [item.get("name") for item in response_items]
        for item in items_to_add:
            assert item["name"] in names_in_response, f"Item {item['name']} not found in order items after patch"
        # Calculate expected total
        expected_total = sum(item["price"] * item["quantity"] for item in items_to_add)
        actual_total = patched_order.get("total")
        assert abs(actual_total - expected_total) < 0.01, f"Order total expected {expected_total} but got {actual_total}"

    finally:
        if order_id:
            # Clean up: delete the order
            requests.delete(
                f"{BASE_URL}/api/orders/{order_id}",
                auth=AUTH,
                headers=HEADERS,
                timeout=TIMEOUT
            )


if __name__ == "__main__":
    test_order_items_can_be_added_to_open_order()
