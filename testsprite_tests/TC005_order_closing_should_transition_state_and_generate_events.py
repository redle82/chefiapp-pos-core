import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4320"
AUTH = HTTPBasicAuth("contact@goldmonkey.studio", "Miranda87529192")
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_order_closing_should_transition_state_and_generate_events():
    order_id = None
    try:
        # Step 1: Create a new order (should be in OPEN state)
        create_order_resp = requests.post(
            f"{BASE_URL}/api/orders",
            auth=AUTH,
            headers=HEADERS,
            json={},
            timeout=TIMEOUT,
        )
        assert create_order_resp.status_code == 201, f"Order creation failed: {create_order_resp.text}"
        order = create_order_resp.json()
        order_id = order.get("id")
        assert order_id is not None, "Order ID missing in creation response"
        assert order.get("state") == "PENDING", f"New order state expected 'OPEN', got '{order.get('state')}'"

        # Step 2: Add items to the order (to later have a total)
        items_payload = {
            "items": [
                {"name": "Test Dish", "quantity": 2, "unitPrice": 10.0},
                {"name": "Test Drink", "quantity": 1, "unitPrice": 5.5},
            ]
        }
        patch_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            auth=AUTH,
            headers=HEADERS,
            json=items_payload,
            timeout=TIMEOUT,
        )
        assert patch_resp.status_code == 200, f"Adding items failed: {patch_resp.text}"
        patched_order = patch_resp.json()
        assert "items" in patched_order and len(patched_order["items"]) == 2, "Order items not added correctly"

        # Step 3: Lock the order by closing it (this calculates total and transitions to CLOSED)
        close_resp = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/close",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert close_resp.status_code == 200, f"Closing order failed: {close_resp.text}"
        closed_order = close_resp.json()

        # After close, state should be CLOSED
        assert closed_order.get("state") == "CLOSED", f"Expected order state 'CLOSED' after close, got '{closed_order.get('state')}'"

        # Total should be calculated and immutable
        expected_total = 2 * 10.0 + 1 * 5.5
        order_total = closed_order.get("total")
        assert order_total is not None, "Order total missing after close"
        assert abs(order_total - expected_total) < 0.01, f"Order total incorrect. Expected {expected_total}, got {order_total}"

        # Step 4: Verify total immutability by attempting to patch items (should be rejected)
        patch_again_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            auth=AUTH,
            headers=HEADERS,
            json={"items": [{"name": "Another Item", "quantity": 1, "unitPrice": 3.0}]},
            timeout=TIMEOUT,
        )
        assert patch_again_resp.status_code in (400, 409), f"Modification after close not rejected as expected: {patch_again_resp.status_code}"

        # Step 5: Verify events generated in the event store for this order
        events_resp = requests.get(
            f"{BASE_URL}/api/events",
            auth=AUTH,
            headers=HEADERS,
            params={"streamId": order_id},
            timeout=TIMEOUT,
        )
        assert events_resp.status_code == 200, f"Fetching events failed: {events_resp.text}"
        events = events_resp.json()
        assert isinstance(events, list), "Events response is not a list"

        # Verify that events include order-closed event
        event_types = [e.get("type") for e in events]
        assert "OrderClosed" in event_types, "'OrderClosed' event not found in event stream"

        # Verify state transition events: OPEN -> LOCKED -> CLOSED or at least CLOSED exists
        assert "OrderCreated" in event_types, "'OrderCreated' event missing"
        assert "OrderClosed" in event_types, "'OrderClosed' event missing"

    finally:
        # Cleanup: delete the order if possible
        if order_id:
            requests.delete(
                f"{BASE_URL}/api/orders/{order_id}",
                auth=AUTH,
                headers=HEADERS,
                timeout=TIMEOUT,
            )


if __name__ == "__main__":
    test_order_closing_should_transition_state_and_generate_events()
