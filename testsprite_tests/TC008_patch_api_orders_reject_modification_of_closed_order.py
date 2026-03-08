import requests

BASE_URL = "http://localhost:4320"


def authenticate_session():
    """Perform the login flow to obtain session_token."""
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/request-magic-link",
            json={"email": "test@chefiapp.test"},
            timeout=30,
        )
        resp.raise_for_status()
        dev_token = resp.json().get("dev_token")
        assert dev_token, "dev_token missing in /request-magic-link response"

        resp = requests.get(
            f"{BASE_URL}/api/auth/verify-magic-link",
            params={"token": dev_token},
            timeout=30,
        )
        resp.raise_for_status()
        session_token = resp.json().get("session_token")
        assert session_token, "session_token missing in /verify-magic-link response"
        return session_token
    except requests.RequestException as e:
        raise RuntimeError(f"Authentication failed: {e}")


def create_order(session_token):
    """Create a new order and return its order_id."""
    headers = {"x-chefiapp-token": session_token}
    payload = {"table_id": "42"}  # example table_id
    try:
        resp = requests.post(f"{BASE_URL}/api/orders", json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        order_id = data.get("order_id")
        state = data.get("state")
        assert order_id, "order_id missing in create order response"
        assert state == "PENDING", f"Expected state OPEN, got {state}"
        return order_id
    except requests.RequestException as e:
        raise RuntimeError(f"Create order failed: {e}")


def lock_order(session_token, order_id):
    """Lock the order and return the new state."""
    headers = {"x-chefiapp-token": session_token}
    try:
        resp = requests.post(f"{BASE_URL}/api/orders/{order_id}/lock", headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        state = data.get("state")
        assert state == "LOCKED", f"Expected state LOCKED after lock, got {state}"
        return state
    except requests.RequestException as e:
        raise RuntimeError(f"Lock order failed: {e}")


def close_order(session_token, order_id):
    """Close the order and return the new state."""
    headers = {"x-chefiapp-token": session_token}
    try:
        resp = requests.post(f"{BASE_URL}/api/orders/{order_id}/close", headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        state = data.get("state")
        assert state == "CLOSED", f"Expected state CLOSED after close, got {state}"
        return state
    except requests.RequestException as e:
        raise RuntimeError(f"Close order failed: {e}")


def patch_order(session_token, order_id, patch_payload):
    """Patch the order."""
    headers = {"x-chefiapp-token": session_token}
    try:
        resp = requests.patch(
            f"{BASE_URL}/api/orders/{order_id}", json=patch_payload, headers=headers, timeout=30
        )
        return resp
    except requests.RequestException as e:
        raise RuntimeError(f"Patch order failed: {e}")


def delete_order(session_token, order_id):
    """Delete the order to clean up."""
    # Note: The PRD does not specify a DELETE order endpoint.
    # If no such endpoint exists, then no cleanup possible.
    # Hence, left empty or a placeholder if API supports deletion in future.
    pass


def test_patch_api_orders_reject_modification_closed_order():
    session_token = authenticate_session()
    order_id = None
    try:
        # Create order (state OPEN)
        order_id = create_order(session_token)

        # Lock order (state LOCKED)
        lock_order(session_token, order_id)

        # Close order (state CLOSED)
        close_order(session_token, order_id)

        # Attempt to patch the CLOSED order
        patch_payload = {"items": [{"name": "Modified Item", "quantity": 1, "price_snapshot_cents": 1000}]}
        resp = patch_order(session_token, order_id, patch_payload)

        assert resp.status_code == 400, f"Expected HTTP 400 when patching CLOSED order, got {resp.status_code}"
        # Optionally, check error message presence
        try:
            error_json = resp.json()
            assert (
                "error" in error_json or "message" in error_json
            ), "Expected error message in response JSON for modification to CLOSED order"
        except Exception:
            # If response body is not JSON, pass
            pass

    finally:
        # No DELETE endpoint specified, so no cleanup possible here.
        # If cleanup is implemented, call delete_order(session_token, order_id) here.
        pass



if __name__ == "__main__":
    test_patch_api_orders_reject_modification_closed_order()
