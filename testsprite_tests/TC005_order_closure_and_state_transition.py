import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
PRODUCT_ID = "00000000-0000-0000-0000-000000000001"
TIMEOUT = 30


def authenticate():
    # Step 1: Request magic link
    resp = requests.post(
        f"{BASE_URL}/api/auth/request-magic-link",
        json={"email": EMAIL},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    dev_token = resp.json().get("dev_token")
    assert dev_token, "No dev_token received on magic link request"

    # Step 2: Verify magic link
    resp = requests.get(
        f"{BASE_URL}/api/auth/verify-magic-link",
        params={"token": dev_token},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    session_token = resp.json().get("session_token")
    assert session_token, "No session_token received on magic link verification"

    return session_token


def create_order(session_token):
    headers = {"x-chefiapp-token": session_token}
    order_payload = {
        "items": [
            {
                "product_id": PRODUCT_ID,
                "name": "Test Product",
                "quantity": 1,
                "unitPrice": 2500,
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
    data = resp.json()
    order_id = data.get("orderId")
    assert order_id, "No orderId returned on order creation"
    # Confirm initial state is OPEN as prerequisite for closure
    state = data.get("state")
    assert state and state.upper() == "PENDING", f"Created order initial state is not OPEN: {state}"
    return order_id


def close_order(session_token, order_id):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.post(
        f"{BASE_URL}/api/orders/{order_id}/close",
        headers=headers,
        timeout=TIMEOUT,
    )
    return resp


def get_order(session_token, order_id):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.get(
        f"{BASE_URL}/api/orders/{order_id}",
        headers=headers,
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    return resp.json()


def test_order_closure_and_state_transition():
    session_token = authenticate()
    order_id = None
    headers = {"x-chefiapp-token": session_token}

    try:
        order_id = create_order(session_token)

        # Close the order
        resp = close_order(session_token, order_id)
        assert resp.status_code == 200, f"Expected 200 on order close, got {resp.status_code}"
        close_data = resp.json()
        closed_state = close_data.get("state")
        assert closed_state is not None, "No order state in close response"
        assert closed_state.upper() == "CLOSED", f"Order state after close is not CLOSED but {closed_state}"

        # Verify order state with a GET
        order_info = get_order(session_token, order_id)
        order_state = order_info.get("state")
        assert order_state is not None, "No order state in order retrieval after close"
        assert order_state.upper() == "CLOSED", f"Order state after close GET is not CLOSED but {order_state}"

    finally:
        # Cleanup: Attempt to delete the order if API supported deletion; spec does not mention it.
        # So no delete endpoint used here.
        pass



if __name__ == "__main__":
    test_order_closure_and_state_transition()
