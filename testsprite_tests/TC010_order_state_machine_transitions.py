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

# ... (keeping other functions same, just ensuring correct lines matched) ...

if __name__ == "__main__":
    test_TC010_order_state_machine_transitions()
