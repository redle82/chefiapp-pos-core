import requests

BASE_URL = "http://localhost:4320"
TIMEOUT = 30
AUTH = ("contact@goldmonkey.studio", "Miranda87529192")

def test_TC001_get_health_endpoint_returns_system_operational_status():
    url = f"{BASE_URL}/health"
    try:
        response = requests.get(url, auth=AUTH, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate that indicator keys are present and truthy
    required_keys = [
        "server_health",
        "database_connectivity",
        "event_store_initialized",
        "core_engine_available",
    ]

    for key in required_keys:
        assert key in json_data, f"Response JSON missing key '{key}'"
        assert isinstance(json_data[key], bool), f"Key '{key}' is not a boolean"
        assert json_data[key] is True, f"Key '{key}' expected to be True but was {json_data[key]}"


if __name__ == "__main__":
    test_TC001_get_health_endpoint_returns_system_operational_status()
