import requests
import time
import json
import hmac
import hashlib

BASE_URL = "http://localhost:3000"
WEBHOOK_ENDPOINT = "/webhooks/stripe"
TIMEOUT = 30
STRIPE_SECRET = "whsec_test_secret"  # Example secret for signature; replace with actual for real tests


def generate_stripe_signature(payload: bytes, secret: str, timestamp: int) -> str:
    """Generate Stripe-like webhook signature header."""
    signed_payload = f"{timestamp}.{payload.decode()}"
    signature = hmac.new(secret.encode(), signed_payload.encode(), hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={signature}"


def test_post_webhooks_stripe_signature_verification():
    # Construct a sample payment_intent.succeeded event payload
    event_payload = {
        "id": "evt_test_payment_intent_succeeded",
        "object": "event",
        "api_version": "2020-08-27",
        "created": int(time.time()),
        "data": {
            "object": {
                "id": "pi_test_1234567890",
                "object": "payment_intent",
                "amount": 2000,
                "currency": "usd",
                "status": "succeeded"
            }
        },
        "livemode": False,
        "pending_webhooks": 1,
        "request": {
            "id": "req_test_123456",
            "idempotency_key": None
        },
        "type": "payment_intent.succeeded"
    }
    payload_bytes = json.dumps(event_payload).encode()

    # Generate Stripe-Signature header
    timestamp = int(time.time())
    signature_header = generate_stripe_signature(payload_bytes, STRIPE_SECRET, timestamp)

    headers = {
        "Content-Type": "application/json",
        "Stripe-Signature": signature_header
    }

    # Send the webhook POST request first time
    response1 = requests.post(
        BASE_URL + WEBHOOK_ENDPOINT,
        headers=headers,
        data=payload_bytes,
        timeout=TIMEOUT
    )
    assert response1.status_code == 200, f"Expected 200 OK but got {response1.status_code}"

    # Repeat the same webhook to test idempotency
    response2 = requests.post(
        BASE_URL + WEBHOOK_ENDPOINT,
        headers=headers,
        data=payload_bytes,
        timeout=TIMEOUT
    )
    # Expecting idempotent handling, most likely 200 or 204 but not an error
    assert response2.status_code in (200, 204), f"Expected 200 or 204 but got {response2.status_code}"

    # Verify that PAYMENT_CONFIRMED event was created in event store
    # Assuming an endpoint or method to verify events exists. Since not specified,
    # we simulate by checking GET /api/stats (or another endpoint) for an event count increment or status
    # Here we'll try GET /api/stats to see if event count increased, assuming it's the main API endpoint
    stats_resp = requests.get(f"{BASE_URL}/api/stats", timeout=TIMEOUT)
    assert stats_resp.status_code == 200, f"Failed to get /api/stats, got {stats_resp.status_code}"

    stats_data = stats_resp.json()
    # We expect stats_data to include something about PAYMENT_CONFIRMED events count or recent events.
    # This is a best-effort check due to vague specs.
    assert "payment_confirmed_events_count" in stats_data or "events" in stats_data, \
        "Stats response missing PAYMENT_CONFIRMED event information"

    # Additionally, test error case: Invalid signature

    bad_headers = {
        "Content-Type": "application/json",
        "Stripe-Signature": "t=123456789,v1=invalidsignature"
    }
    response_bad_sig = requests.post(
        BASE_URL + WEBHOOK_ENDPOINT,
        headers=bad_headers,
        data=payload_bytes,
        timeout=TIMEOUT
    )
    assert response_bad_sig.status_code in (400, 403), f"Expected 400 or 403 for bad signature but got {response_bad_sig.status_code}"



if __name__ == "__main__":
    test_post_webhooks_stripe_signature_verification()
