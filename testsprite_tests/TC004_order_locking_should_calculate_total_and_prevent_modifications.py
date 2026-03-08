import requests

BASE_URL = "http://localhost:4320"
AUTH = ("contact@goldmonkey.studio", "Miranda87529192")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_order_locking_should_calculate_total_and_prevent_modifications():
    # Step 1: Create a new order (should be in OPEN state)
    create_order_resp = requests.post(
        f"{BASE_URL}/api/orders", auth=AUTH, headers=HEADERS, timeout=TIMEOUT
    )
    assert create_order_resp.status_code == 201, f"Order creation failed: {create_order_resp.text}"
    order = create_order_resp.json()
    order_id = order.get("id")
    assert order_id, "Order ID not found in creation response"

    try:
        # Step 2: Add items to the order (PATCH /api/orders/{orderId})
        add_items_payload = {
            "items": [
                {"name": "Spaghetti Carbonara", "quantity": 2, "price": 12.5},
                {"name": "Focaccia Bread", "quantity": 1, "price": 4.0}
            ]
        }
        patch_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            json=add_items_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert patch_resp.status_code == 200, f"Adding items failed: {patch_resp.text}"
        patched_order = patch_resp.json()
        assert "items" in patched_order and len(patched_order["items"]) == 2, "Items not added correctly"

        # Step 3: Lock the order by POST /api/orders/{orderId}/close
        close_resp = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/close",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert close_resp.status_code == 200, f"Closing order failed: {close_resp.text}"
        closed_order = close_resp.json()

        # Verify the order is in LOCKED state (or as per documentation, might be "LOCKED" or state indicating locked)
        state = closed_order.get("state")
        assert state in ("LOCKED", "LOCKED", "locked", "Locked"), f"Order state unexpected after lock: {state}"

        # Verify total is calculated correctly: (2 * 12.5) + (1 * 4.0) = 29.0
        expected_total = 2 * 12.5 + 1 * 4.0
        total = closed_order.get("total")
        assert total is not None, "Total amount not found after closing order"
        assert abs(total - expected_total) < 0.01, f"Total calculated incorrectly: expected {expected_total}, got {total}"

        # Step 4: Attempt to modify the locked order should fail (add new item)
        modify_payload = {"items": [{"name": "Tiramisu", "quantity": 1, "price": 6.0}]}
        modify_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            json=modify_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        # Assuming the API returns 4xx status (e.g., 400 or 409) to indicate modification forbidden
        assert modify_resp.status_code >= 400 and modify_resp.status_code < 500, (
            f"Modification to locked order should be rejected, but got status {modify_resp.status_code}"
        )

        # Optionally verify error message indicates immutability or locked state
        err_json = {}
        try:
            err_json = modify_resp.json()
        except Exception:
            pass
        err_msg = err_json.get("message", "").lower()
        assert "locked" in err_msg or "immutable" in err_msg or "cannot modify" in err_msg or "forbidden" in err_msg, (
            f"Unexpected error message when modifying locked order: {err_msg}"
        )
    finally:
        # Clean up by deleting the order
        requests.delete(
            f"{BASE_URL}/api/orders/{order_id}", auth=AUTH, headers=HEADERS, timeout=TIMEOUT
        )



if __name__ == "__main__":
    test_order_locking_should_calculate_total_and_prevent_modifications()
