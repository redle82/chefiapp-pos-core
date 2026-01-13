import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4320"
AUTH = HTTPBasicAuth("contact@goldmonkey.studio", "Miranda87529192")
TIMEOUT = 30

def test_health_endpoint_should_return_200_and_status_indicators():
    endpoints = ["/health", "/api/health"]
    expected_keys = {
        "systemOperational",
        "databaseConnected",
        "eventStoreInitialized",
        "coreEngineAvailable"
    }

    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        try:
            response = requests.get(url, auth=AUTH, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request to {url} failed with exception: {e}"

        assert response.status_code == 200, f"Expected status 200 from {url}, got {response.status_code}"

        try:
            resp_json = response.json()
        except ValueError:
            assert False, f"Response from {url} is not valid JSON"

        missing_keys = expected_keys - resp_json.keys()
        assert not missing_keys, f"Response from {url} missing keys: {missing_keys}"

        # Validate that all keys have a boolean value True or False
        for key in expected_keys:
            assert isinstance(resp_json[key], bool), f"Key '{key}' in response from {url} should be boolean"
        
        # Additionally check at least systemOperational and databaseConnected are True to validate "corrections"
        assert resp_json["systemOperational"] is True, f"systemOperational is not True in {url} response"
        assert resp_json["databaseConnected"] is True, f"databaseConnected is not True in {url} response"


if __name__ == "__main__":
    test_health_endpoint_should_return_200_and_status_indicators()
