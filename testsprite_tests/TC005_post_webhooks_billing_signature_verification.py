import requests
import hmac
import hashlib
import time
import json

BASE_URL = "http://localhost:3099"
WEBHOOK_ENDPOINT = "/webhooks/billing"
TIMEOUT = 30

# This secret should match the one used by the webhook server for signature verification
STRIPE_WEBHOOK_SECRET = "whsec_testsecret"


def generate_stripe_signature_header(payload: bytes, secret: str, timestamp: int) -> str:
    """
    Generate a Stripe-like signature header for a webhook request.
    Format: t=timestamp,v1=signature
    Signature is generated as HMAC_SHA256(secret, "{timestamp}.{payload}")
    """
    signed_payload = f"{timestamp}.".encode() + payload
    signature = hmac.new(
        key=secret.encode(),
        msg=signed_payload,
        digestmod=hashlib.sha256
    ).hexdigest()
    return f"t={timestamp},v1={signature}"


def test_post_webhooks_billing_signature_verification():
    # Simulate a Stripe billing webhook payload for subscription created event
    event_payload = {
        "id": "evt_test_subscription_created",
        "object": "event",
        "api_version": "2020-08-27",
        "created": int(time.time()),
        "data": {
            "object": {
                "id": "sub_test123",
                "object": "subscription",
                "customer": "cus_test123",
                "status": "active",
                "metadata": {},
                "items": {
                    "object": "list",
                    "data": [
                        {
                            "id": "si_test123",
                            "object": "subscription_item",
                            "price": {
                                "id": "price_test123",
                                "object": "price",
                                "product": "prod_test123",
                                "unit_amount": 1000,
                                "currency": "usd"
                            },
                            "quantity": 1
                        }
                    ]
                },
                "current_period_start": int(time.time()),
                "current_period_end": int(time.time()) + 2592000,
                "cancel_at_period_end": False,
                "canceled_at": None,
                "created": int(time.time()) - 3600,
                "plan": {
                    "id": "price_test123",
                    "nickname": "Basic Plan",
                    "amount": 1000,
                    "currency": "usd",
                    "interval": "month",
                    "product": "prod_test123"
                },
                "status_transitions": {},
                "latest_invoice": "in_test123"
            }
        },
        "livemode": False,
        "pending_webhooks": 1,
        "type": "customer.subscription.created"
    }

    payload_bytes = json.dumps(event_payload).encode('utf-8')
    timestamp = int(time.time())
    signature_header = generate_stripe_signature_header(payload_bytes, STRIPE_WEBHOOK_SECRET, timestamp)

    headers = {
        "Content-Type": "application/json",
        "Stripe-Signature": signature_header
    }

    # Successful webhook event delivery with valid signature
    response = requests.post(
        url=BASE_URL + WEBHOOK_ENDPOINT,
        headers=headers,
        data=payload_bytes,
        timeout=TIMEOUT
    )
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"

    # Failed webhook event delivery due to invalid signature
    invalid_headers = {
        "Content-Type": "application/json",
        "Stripe-Signature": f"t={timestamp},v1=invalidsignature"
    }
    response_invalid = requests.post(
        url=BASE_URL + WEBHOOK_ENDPOINT,
        headers=invalid_headers,
        data=payload_bytes,
        timeout=TIMEOUT
    )
    # Expecting 400 or 401 Unauthorized for invalid signature depending on implementation
    assert response_invalid.status_code in (400, 401), f"Expected 400 or 401 for invalid signature, got {response_invalid.status_code}"

    # Test handling of subscription update event with valid signature
    event_payload['id'] = "evt_test_subscription_updated"
    event_payload['type'] = "customer.subscription.updated"
    event_payload['data']['object']['status'] = "past_due"
    payload_bytes_update = json.dumps(event_payload).encode('utf-8')
    timestamp_update = int(time.time())
    signature_header_update = generate_stripe_signature_header(payload_bytes_update, STRIPE_WEBHOOK_SECRET, timestamp_update)
    headers_update = {
        "Content-Type": "application/json",
        "Stripe-Signature": signature_header_update
    }
    response_update = requests.post(
        url=BASE_URL + WEBHOOK_ENDPOINT,
        headers=headers_update,
        data=payload_bytes_update,
        timeout=TIMEOUT
    )
    assert response_update.status_code == 200, f"Expected 200 OK for subscription update, got {response_update.status_code}"

    # Test handling of subscription deleted event
    event_payload['id'] = "evt_test_subscription_deleted"
    event_payload['type'] = "customer.subscription.deleted"
    event_payload['data']['object']['status'] = "canceled"
    payload_bytes_deleted = json.dumps(event_payload).encode('utf-8')
    timestamp_deleted = int(time.time())
    signature_header_deleted = generate_stripe_signature_header(payload_bytes_deleted, STRIPE_WEBHOOK_SECRET, timestamp_deleted)
    headers_deleted = {
        "Content-Type": "application/json",
        "Stripe-Signature": signature_header_deleted
    }
    response_deleted = requests.post(
        url=BASE_URL + WEBHOOK_ENDPOINT,
        headers=headers_deleted,
        data=payload_bytes_deleted,
        timeout=TIMEOUT
    )
    assert response_deleted.status_code == 200, f"Expected 200 OK for subscription deletion, got {response_deleted.status_code}"



if __name__ == "__main__":
    test_post_webhooks_billing_signature_verification()
