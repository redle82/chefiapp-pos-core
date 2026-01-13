import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4320"
AUTH = HTTPBasicAuth("contact@goldmonkey.studio", "Miranda87529192")
TIMEOUT = 30

def test_order_can_be_locked_and_total_becomes_immutable():
    order_id = None
    headers = {"Content-Type": "application/json"}

    try:
        # Step 1: Create a new order (should be in OPEN state)
        create_resp = requests.post(
            f"{BASE_URL}/api/orders",
            auth=AUTH,
            headers=headers,
            json={},
            timeout=TIMEOUT
        )
        create_resp.raise_for_status()
        order = create_resp.json()
        order_id = order.get("id")
        assert order_id is not None, "Order creation response missing id"
        assert order.get("state") == "OPEN", "Order initial state is not OPEN"
        assert order.get("items") == [] or order.get("items") is None, "New order must have no items"
        assert order.get("total", 0) == 0, "New order total must be zero"

        # Step 2: Add items to the order in OPEN state
        items_to_add = [
            {"name": "Burger", "quantity": 2, "price": 5.5},
            {"name": "Fries", "quantity": 1, "price": 2.5}
        ]

        patch_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            auth=AUTH,
            headers=headers,
            json={"items": items_to_add},
            timeout=TIMEOUT
        )
        patch_resp.raise_for_status()
        updated_order = patch_resp.json()
        assert updated_order.get("state") == "OPEN", "Order state changed unexpectedly after adding items"
        assert isinstance(updated_order.get("items"), list), "Order items not a list"
        assert len(updated_order["items"]) == len(items_to_add), "Order items length mismatch after adding"
        # Calculate expected total
        expected_total = sum(i["quantity"] * i["price"] for i in items_to_add)
        # The total might still be zero since order is not locked
        # So we won't assert total correctness here

        # Step 3: Lock the order via PATCH (transition to LOCKED and calculate total)
        lock_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            auth=AUTH,
            headers=headers,
            json={"state": "LOCKED"},
            timeout=TIMEOUT
        )
        lock_resp.raise_for_status()
        locked_order = lock_resp.json()
        assert locked_order.get("state") == "LOCKED", "Order state is not LOCKED after locking"
        locked_total = locked_order.get("total")
        assert abs(locked_total - expected_total) < 0.01, "Locked order total does not match expected total"

        # Step 4: Attempt to modify the locked order items - should be rejected
        modified_items = [
            {"name": "Burger", "quantity": 1, "price": 5.5}
        ]
        patch_locked_resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            auth=AUTH,
            headers=headers,
            json={"items": modified_items},
            timeout=TIMEOUT
        )
        # Expecting failure (client or server error)
        assert patch_locked_resp.status_code >= 400, "Modification of locked order items should fail"

        # Step 5: Fetch the order again and verify no changes to total or items
        get_resp = requests.get(
            f"{BASE_URL}/api/orders/{order_id}",
            auth=AUTH,
            headers=headers,
            timeout=TIMEOUT
        )
        get_resp.raise_for_status()
        final_order = get_resp.json()
        assert final_order.get("state") == "LOCKED", "Order state changed unexpectedly after failed modification"
        assert abs(final_order.get("total") - locked_total) < 0.01, "Order total changed after locking"
        # Check that items remain unchanged
        items_after_lock = final_order.get("items")
        assert items_after_lock == updated_order.get("items"), "Order items changed after locking and failed modification"

    finally:
        if order_id:
            try:
                # Clean up: delete the order to avoid test data accumulation if DELETE endpoint exists
                requests.delete(
                    f"{BASE_URL}/api/orders/{order_id}",
                    auth=AUTH,
                    headers=headers,
                    timeout=TIMEOUT
                )
            except Exception:
                pass


if __name__ == "__main__":
    test_order_can_be_locked_and_total_becomes_immutable()
