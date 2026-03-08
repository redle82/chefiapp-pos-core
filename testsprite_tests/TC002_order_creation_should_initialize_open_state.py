import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4320"
ORDER_CREATE_ENDPOINT = f"{BASE_URL}/api/orders"
ORDER_DELETE_ENDPOINT = f"{BASE_URL}/api/orders/{{orderId}}"
TIMEOUT = 30
USERNAME = "contact@goldmonkey.studio"
PASSWORD = "Miranda87529192"

def test_order_creation_should_initialize_open_state():
    auth = HTTPBasicAuth(USERNAME, PASSWORD)
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    order_id = None
    try:
        # Create a new order with empty JSON payload
        response = requests.post(ORDER_CREATE_ENDPOINT, json={}, headers=headers, auth=auth, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        order = response.json()
        assert "id" in order, "Response JSON missing 'id'"
        order_id = order["id"]

        # Validate initial order state, items, and total
        assert order.get("state") == "OPEN", f"Expected state 'OPEN', got '{order.get('state')}'"
        assert "items" in order, "Response JSON missing 'items'"
        assert isinstance(order["items"], list), "'items' should be a list"
        assert len(order["items"]) == 0, f"Expected 0 items, got {len(order['items'])}"
        assert "total" in order, "Response JSON missing 'total'"
        assert order["total"] == 0, f"Expected total 0, got {order['total']}"
    finally:
        if order_id:
            try:
                # Delete the created order to clean up
                del_response = requests.delete(ORDER_DELETE_ENDPOINT.format(orderId=order_id), headers=headers, auth=auth, timeout=TIMEOUT)
                # Allow 200 or 204 as successful delete response
                assert del_response.status_code in (200, 204), f"Failed to delete order {order_id}, status {del_response.status_code}"
            except Exception:
                pass


if __name__ == "__main__":
    test_order_creation_should_initialize_open_state()
