import requests

BASE_URL = "http://localhost:4320"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_post_api_auth_request_magic_link_validation():
    url = f"{BASE_URL}/api/auth/request-magic-link"

    # Test valid email input
    valid_payload = {"email": "user@example.com"}
    try:
        response = requests.post(url, json=valid_payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200 or response.status_code == 204, (
            f"Expected status code 200 or 204 for valid email, got {response.status_code}"
        )
        # Optionally check response message or body if defined by API spec
    except requests.RequestException as e:
        assert False, f"Request failed for valid email input: {e}"

    # Test invalid email input - empty string
    invalid_payloads = [
        {"email": ""},
        {"email": "invalid-email"},
        {"email": "missing-at-symbol.com"},
        {"email": "@missing-username.com"},
        {"email": None},
        {},
    ]

    for payload in invalid_payloads:
        try:
            response = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
            # Expecting client error 400 or 422 for invalid inputs
            assert response.status_code in (400, 422), (
                f"Expected status code 400 or 422 for invalid email {payload.get('email')}, got {response.status_code}"
            )
        except requests.RequestException as e:
            assert False, f"Request failed for invalid email input {payload.get('email')}: {e}"

test_post_api_auth_request_magic_link_validation()