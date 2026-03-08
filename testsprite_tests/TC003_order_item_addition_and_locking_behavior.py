import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30
PRODUCT_ID = "00000000-0000-0000-0000-000000000001"


def authenticate():
    try:
        # Step 1: Request magic link
        resp = requests.post(
            f"{BASE_URL}/api/auth/request-magic-link",
            json={"email": EMAIL},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        dev_token = data.get("dev_token")
        assert dev_token, "dev_token missing in /request-magic-link response"

        # Step 2: Verify magic link
        resp = requests.get(
            f"{BASE_URL}/api/auth/verify-magic-link",
            params={"token": dev_token},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        session_token = data.get("session_token")
        assert session_token, "session_token missing in /verify-magic-link response"

        return session_token

    except (requests.RequestException, AssertionError) as e:
        raise RuntimeError(f"Authentication failed: {str(e)}")


def test_order_item_addition_and_locking_behavior():
    session_token = authenticate()
    headers = {
        "x-chefiapp-token": session_token,
        "Content-Type": "application/json",
    }

    order_id = None
    try:
        # Create order with one item using official product ID
        order_payload = {
            "items": [
                {
                    "productId": PRODUCT_ID,
                    "name": "Test Product",
                    "quantity": 2,
                    "unitPrice": 3000,
                }
            ]
        }
        resp = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        order = resp.json()
        order_id = order.get("id")
        assert order_id, "Order creation response missing 'id'"
        assert order.get("state") == "PENDING", "New order is not in OPEN state"
        assert isinstance(order.get("items"), list) and len(order["items"]) == 1, "Order items not created properly"
        item = order["items"][0]
        assert item["productId"] == PRODUCT_ID, "Order item productId mismatch"
        assert item["quantity"] == 2, "Order item quantity mismatch"
        assert item["unitPrice"] == 3000, "Order item unitPrice mismatch"

        # Patch order to lock it - expected to calculate total and make order immutable
        patch_payload = {"state": "LOCKED"}
        resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            json=patch_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        locked_order = resp.json()

        assert locked_order.get("id") == order_id, "Locked order id mismatch"
        assert locked_order.get("state") == "LOCKED", "Order state is not LOCKED after patch"
        # Validate total calculation: total = sum of quantity * unitPrice
        expected_total = 2 * 3000
        total = locked_order.get("total")
        assert isinstance(total, int), "Order total missing or not an integer"
        assert total == expected_total, f"Order total expected {expected_total} but got {total}"

        # Attempt to modify locked order's items should fail (we test immutability)
        modify_payload = {
            "items": [
                {
                    "productId": PRODUCT_ID,
                    "name": "Test Product Modified",
                    "quantity": 1,
                    "unitPrice": 1000,
                }
            ]
        }
        resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}",
            json=modify_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        # We expect failure - validate status code 4xx or 5xx
        assert resp.status_code >= 400, "Modifying locked order did not return error as expected"

    finally:
        if order_id:
            try:
                # Try to delete order if API supports DELETE; if not, skip cleanup
                # Since the PRD doesn't mention delete, this will be ignored.
                pass
            except Exception:
                pass



if __name__ == "__main__":
    test_order_item_addition_and_locking_behavior()
