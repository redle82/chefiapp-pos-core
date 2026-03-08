import requests
import uuid

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
PRODUCT_ID = "00000000-0000-0000-0000-000000000001"
TIMEOUT = 30

def authenticate_and_get_token():
    try:
        r_magic = requests.post(
            f"{BASE_URL}/api/auth/request-magic-link",
            json={"email": EMAIL},
            timeout=TIMEOUT
        )
        r_magic.raise_for_status()
        dev_token = r_magic.json().get("dev_token")
        assert dev_token, "dev_token missing from magic link response"

        r_verify = requests.get(
            f"{BASE_URL}/api/auth/verify-magic-link",
            params={"token": dev_token},
            timeout=TIMEOUT
        )
        r_verify.raise_for_status()
        session_token = r_verify.json().get("session_token")
        assert session_token, "session_token missing from verify magic link response"
        return session_token
    except Exception as e:
        raise RuntimeError(f"Authentication failed: {e}")

def create_order(headers):
    payload = {
        "items": [
            {
                "productId": PRODUCT_ID,
                "name": "Test Product",
                "quantity": 1,
                "unitPrice": 1000
            }
        ]
    }
    resp = requests.post(f"{BASE_URL}/api/orders", json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    order_id = resp.json().get("id")
    assert order_id, "Order ID missing in create order response"
    return order_id

def lock_order(order_id, headers):
    patch_payload = {"state": "LOCKED"}
    resp = requests.patch(f"{BASE_URL}/api/orders/{order_id}", json=patch_payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    resp_json = resp.json()
    state = resp_json.get("state")
    assert state == "LOCKED", f"Order state expected LOCKED but got {state}"

def test_locked_order_cannot_be_modified():
    session_token = authenticate_and_get_token()
    headers = {"x-chefiapp-token": session_token}

    order_id = None
    try:
        order_id = create_order(headers)
        lock_order(order_id, headers)

        modification_payload = {
            "items": [
                {
                    "productId": PRODUCT_ID,
                    "name": "Test Product Modified",
                    "quantity": 2,
                    "unitPrice": 1200
                }
            ]
        }
        resp = requests.patch(f"{BASE_URL}/api/orders/{order_id}", json=modification_payload, headers=headers, timeout=TIMEOUT)
        assert 400 <= resp.status_code < 500, \
            f"Expected 4xx error status modifying locked order but got {resp.status_code}"
        error_json = resp.json()
        assert "error" in error_json or "message" in error_json, "Expected error message in response"
    finally:
        pass


if __name__ == "__main__":
    test_locked_order_cannot_be_modified()
