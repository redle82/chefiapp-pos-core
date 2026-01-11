import requests

BASE_URL = "http://localhost:4310"
TIMEOUT = 30

def test_post_api_subscription_payment_method_update():
    url = f"{BASE_URL}/api/subscription/payment"
    headers = {
        "Content-Type": "application/json"
    }

    # Example valid payment method update payload (simulate a successful update)
    valid_payload = {
        "paymentMethodId": "pm_valid_123456789",  # Assuming the API expects a paymentMethodId field
        "billingDetails": {
            "name": "Test User",
            "email": "testuser@example.com"
        }
    }

    # Example invalid payload to simulate a payment processing error (e.g. invalid payment method)
    invalid_payload = {
        "paymentMethodId": "pm_invalid_000000000",
        "billingDetails": {
            "name": "Test User",
            "email": "testuser@example.com"
        }
    }

    # Test successful payment method update
    try:
        response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_resp = response.json()
        # Expecting success with updated payment info confirmation
        assert "success" in json_resp and json_resp["success"] is True, "Expected success:true in response"
        assert "paymentMethodId" in json_resp and json_resp["paymentMethodId"] == valid_payload["paymentMethodId"], "PaymentMethodId not correctly updated"
    except requests.RequestException as e:
        assert False, f"Request failed during valid payment method update test: {str(e)}"

    # Test payment processing error handling
    try:
        response = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        # Assuming API returns 400 or 402 on payment errors
        assert response.status_code in (400, 402), f"Expected status code 400 or 402 on payment error, got {response.status_code}"
        json_resp = response.json()
        # Check for error message or code indicating payment processing failure
        assert ("error" in json_resp and json_resp["error"]), "Expected error message in response for invalid payment method"
    except requests.RequestException as e:
        assert False, f"Request failed during invalid payment method test: {str(e)}"


test_post_api_subscription_payment_method_update()
