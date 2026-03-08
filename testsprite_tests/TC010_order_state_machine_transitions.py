import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
TIMEOUT = 30

def get_session_token():
    # Step 1: request magic link
    resp = requests.post(
        f"{BASE_URL}/api/auth/request-magic-link",
        json={"email": EMAIL},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    dev_token = resp.json().get("dev_token")
    assert dev_token, "dev_token missing in magic link response"

    # Step 2: verify magic link
    resp = requests.get(
        f"{BASE_URL}/api/auth/verify-magic-link",
        params={"token": dev_token},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    session_token = resp.json().get("session_token")
    assert session_token, "session_token missing in verify magic link response"
    return session_token

def create_order(headers):
    payload = {
        "table_id": "T1",
        "items": [
            {
                "productId": "00000000-0000-0000-0000-000000000001",
                "name": "Test Product",
                "quantity": 1,
                "unitPrice": 1000
            }
        ]
    }
    resp = requests.post(f"{BASE_URL}/api/orders", json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    order = resp.json()
    assert "order_id" in order, "order_id missing in create order response"
    assert order.get("state") == "PENDING", f"Initial order state expected PENDING but got {order.get('state')}"
    return order["order_id"]

def test_TC010_order_state_machine_transitions():
    session_token = get_session_token()
    headers = {
        "x-chefiapp-token": session_token,
        "Content-Type": "application/json",
    }

    # 1. Start: Create Order (PENDING)
    order_id = create_order(headers)
    print(f"Order created: {order_id} (PENDING)")

    # 2. Transition: Lock Order (PENDING -> LOCKED)
    lock_payload = {"state": "LOCKED"}
    resp = requests.patch(f"{BASE_URL}/api/orders/{order_id}", json=lock_payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    locked_order = resp.json()
    assert locked_order.get("state") == "LOCKED", f"Expected LOCKED, got {locked_order.get('state')}"
    print(f"Order locked: {order_id} (LOCKED)")

    # 3. Transition: Close Order (LOCKED -> CLOSED)
    close_payload = {"paymentMethod": "cash", "amountPaid": 1000}
    resp = requests.post(f"{BASE_URL}/api/orders/{order_id}/close", json=close_payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    closed_order = resp.json()
    # Note: Closed order might verify payments first, but simple close should work or at least transition state
    # Wait, simple close usually returns the closed order. Check state.
    # If using the 'close' endpoint, it expects state to be closed or returns success.
    # The response usually contains the order object.
    
    # Re-fetch to confirm if response format varies
    resp = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    final_order = resp.json()
    assert final_order.get("state") == "CLOSED", f"Expected CLOSED, got {final_order.get('state')}"
    print(f"Order closed: {order_id} (CLOSED)")

if __name__ == "__main__":
    test_TC010_order_state_machine_transitions()
