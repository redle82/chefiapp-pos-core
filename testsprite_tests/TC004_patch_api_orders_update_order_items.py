import requests

BASE_URL = "http://localhost:4320"

def get_session_token():
    # Step 1: Request magic link
    email = "test@chefiapp.test"
    resp = requests.post(
        f"{BASE_URL}/api/auth/request-magic-link",
        json={"email": email},
        timeout=30
    )
    resp.raise_for_status()
    data = resp.json()
    dev_token = data.get("dev_token")
    if not dev_token:
        raise ValueError("dev_token not found in /api/auth/request-magic-link response")

    # Step 2: Verify magic link
    resp = requests.get(
        f"{BASE_URL}/api/auth/verify-magic-link",
        params={"token": dev_token},
        timeout=30
    )
    resp.raise_for_status()
    data = resp.json()
    session_token = data.get("session_token")
    if not session_token:
        raise ValueError("session_token not found in /api/auth/verify-magic-link response")
    return session_token

def test_patch_api_orders_update_order_items():
    session_token = get_session_token()
    headers = {"x-chefiapp-token": session_token}

    order_url = f"{BASE_URL}/api/orders"

    # Create a new order first (resource id is not provided)
    create_payload = {"table_id": 1}
    create_resp = requests.post(order_url, json=create_payload, headers=headers, timeout=30)
    create_resp.raise_for_status()
    order = create_resp.json()
    order_id = order.get("order_id")
    assert order_id is not None, "order_id missing in create order response"
    assert order.get("state") == "PENDING", f"Order state expected OPEN but got {order.get('state')}"
    # Make sure initial items are empty or list
    initial_items = order.get("items", [])
    assert isinstance(initial_items, list), "Initial items should be a list"

    try:
        # Add new items by PATCH to the order
        new_items = [
            {
                "product_id": "prod-123",
                "quantity": 2,
                "price_snapshot_cents": 500
            },
            {
                "product_id": "prod-456",
                "quantity": 1,
                "price_snapshot_cents": 1200
            }
        ]
        patch_payload = {"items": new_items}
        patch_resp = requests.patch(
            f"{order_url}/{order_id}",
            json=patch_payload,
            headers=headers,
            timeout=30
        )
        patch_resp.raise_for_status()
        updated_order = patch_resp.json()

        # Validate order_id and state remain correct
        assert updated_order.get("order_id") == order_id, "order_id changed unexpectedly"
        assert updated_order.get("state") == "PENDING", f"Order state expected OPEN but got {updated_order.get('state')}"

        # Validate items contain the new items
        patched_items = updated_order.get("items")
        assert isinstance(patched_items, list), "Patched items should be a list"
        # Ensure new items are merged or replaced accordingly 
        # We assume PATCH replaces items array (common REST patch for items)
        # So patched_items should equal new_items here
        assert patched_items == new_items, "Patched items do not match expected new items"

        # Double check by doing a GET to confirm persistence
        get_resp = requests.get(f"{order_url}/{order_id}", headers=headers, timeout=30)
        get_resp.raise_for_status()
        get_order = get_resp.json()
        assert get_order.get("order_id") == order_id
        assert get_order.get("state") == "PENDING"
        assert get_order.get("items") == new_items

    finally:
        # Cleanup, delete order if API allowed (not mentioned, so skipping delete)
        # If deletion was supported, it should be here.
        pass


if __name__ == "__main__":
    test_patch_api_orders_update_order_items()
