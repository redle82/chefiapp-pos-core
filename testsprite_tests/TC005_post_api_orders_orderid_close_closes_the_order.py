import requests

BASE_URL = "http://localhost:4320"
EMAIL = "test@chefiapp.test"
REQUEST_MAGIC_LINK_ENDPOINT = "/api/auth/request-magic-link"
VERIFY_MAGIC_LINK_ENDPOINT = "/api/auth/verify-magic-link"
ORDERS_ENDPOINT = "/api/orders"


def create_session_token():
    # Step 1: Request magic link
    resp = requests.post(
        BASE_URL + REQUEST_MAGIC_LINK_ENDPOINT,
        json={"email": EMAIL},
        timeout=30,
    )
    resp.raise_for_status()
    dev_token = resp.json().get("dev_token")
    assert dev_token, "dev_token missing in magic link request response"

    # Step 2: Verify magic link
    resp = requests.get(
        BASE_URL + VERIFY_MAGIC_LINK_ENDPOINT,
        params={"token": dev_token},
        timeout=30,
    )
    resp.raise_for_status()
    session_token = resp.json().get("session_token")
    assert session_token, "session_token missing in magic link verify response"
    return session_token


def create_order(session_token):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.post(BASE_URL + ORDERS_ENDPOINT, headers=headers, timeout=30)
    resp.raise_for_status()
    order = resp.json()
    order_id = order.get("id")
    assert order_id, "Order ID missing in create order response"
    assert order.get("state") == "PENDING", "New order state is not OPEN"
    return order_id


def close_order(session_token, order_id):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.post(
        f"{BASE_URL}{ORDERS_ENDPOINT}/{order_id}/close", headers=headers, timeout=30
    )
    resp.raise_for_status()
    return resp.json()


def get_order(session_token, order_id):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.get(f"{BASE_URL}{ORDERS_ENDPOINT}/{order_id}", headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def delete_order(session_token, order_id):
    headers = {"x-chefiapp-token": session_token}
    resp = requests.delete(f"{BASE_URL}{ORDERS_ENDPOINT}/{order_id}", headers=headers, timeout=30)
    # We do not assert here because not all systems expose delete or it may fail if closed
    return resp.status_code


def test_post_api_orders_orderid_close_closes_the_order():
    session_token = create_session_token()
    order_id = None

    try:
        # Create new order for testing
        order_id = create_order(session_token)

        # Close the order
        close_resp = close_order(session_token, order_id)
        # Validate the order closed response has the new state CLOSED
        closed_state = close_resp.get("state")
        assert closed_state == "CLOSED", f"Order state after close is not CLOSED but {closed_state}"

        # Attempt to modify the closed order should fail (e.g. add items)
        headers = {"x-chefiapp-token": session_token}
        patch_resp = requests.patch(
            f"{BASE_URL}{ORDERS_ENDPOINT}/{order_id}",
            headers=headers,
            json={"items": [{"itemId": "test", "quantity": 1}]},
            timeout=30,
        )
        assert patch_resp.status_code in {400, 403, 409}, (
            "Modifying a CLOSED order did not fail as expected, status code: "
            f"{patch_resp.status_code}"
        )

        # Retrieve order and confirm state is CLOSED, no further modifications applied
        order = get_order(session_token, order_id)
        assert order.get("state") == "CLOSED", "Order state is not CLOSED on retrieval after close"
        # Optionally validate items unchanged or empty, assuming original order had no items:
        assert not order.get("items"), "Items were modified in CLOSED order, which is not allowed"

    finally:
        # Cleanup: delete created order if possible
        if order_id:
            delete_order(session_token, order_id)



if __name__ == "__main__":
    test_post_api_orders_orderid_close_closes_the_order()
