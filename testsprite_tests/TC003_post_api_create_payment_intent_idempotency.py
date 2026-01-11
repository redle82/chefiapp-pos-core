import requests
import uuid

BASE_URL = "http://localhost:3000"

def test_post_api_create_payment_intent_idempotency():
    url = f"{BASE_URL}/api/create-payment-intent"
    headers = {
        "Content-Type": "application/json"
    }

    # Example payment intent data; adjust fields as needed for actual API
    payment_intent_data = {
        "amount": 1000,          # e.g., amount in cents
        "currency": "usd",
        "payment_method_types": ["card"]
    }

    idempotency_key = str(uuid.uuid4())

    try:
        # First request with idempotency key
        response1 = requests.post(
            url,
            headers={**headers, "Idempotency-Key": idempotency_key},
            json=payment_intent_data,
            timeout=30
        )
        assert response1.status_code == 201 or response1.status_code == 200, f"Unexpected status code: {response1.status_code}"
        json_resp1 = response1.json()
        assert "id" in json_resp1 and json_resp1["id"], "Response missing payment intent id"
        payment_intent_id = json_resp1["id"]

        # Second request with same idempotency key should return same payment intent, no duplicate creation
        response2 = requests.post(
            url,
            headers={**headers, "Idempotency-Key": idempotency_key},
            json=payment_intent_data,
            timeout=30
        )
        assert response2.status_code == 201 or response2.status_code == 200, f"Unexpected status code: {response2.status_code}"
        json_resp2 = response2.json()
        assert "id" in json_resp2 and json_resp2["id"], "Response missing payment intent id"
        assert json_resp2["id"] == payment_intent_id, "Payment intent IDs do not match, idempotency broken"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_create_payment_intent_idempotency()
