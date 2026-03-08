import requests

BASE_URL = "http://localhost:4320"
TIMEOUT = 30

def test_get_api_subscription_status_retrieval():
    url = f"{BASE_URL}/api/subscription"
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to GET /api/subscription failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate required fields presence
    # Expecting subscription status and available features
    assert "subscriptionStatus" in json_data or "status" in json_data, "Response JSON missing 'subscriptionStatus' or 'status'"
    assert "availableFeatures" in json_data, "Response JSON missing 'availableFeatures'"

    # subscriptionStatus or status should be non-empty string
    status_value = json_data.get("subscriptionStatus") or json_data.get("status")
    assert isinstance(status_value, str) and status_value.strip() != "", "'subscriptionStatus' or 'status' should be a non-empty string"

    # availableFeatures should be a list (could be empty or with feature descriptions)
    features = json_data["availableFeatures"]
    assert isinstance(features, list), "'availableFeatures' should be a list"


if __name__ == "__main__":
    test_get_api_subscription_status_retrieval()
