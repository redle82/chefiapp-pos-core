import requests

BASE_URL = "http://localhost:4320"
TIMEOUT = 30

def test_get_api_health_endpoint_returns_system_operational_status():
    url = f"{BASE_URL}/api/health"
    try:
        response = requests.get(url, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate required health indicators presence and truthiness
    required_fields = [
        "database",       # database connectivity indicator
        "eventStore",     # event store initialization indicator
        "coreEngine"      # core engine availability indicator
    ]

    for field in required_fields:
        assert field in data, f"Missing field '{field}' in response JSON"
        status = data[field]
        assert isinstance(status, bool) or (isinstance(status, str) and status.lower() in ["ok", "healthy", "true"]), \
            f"Field '{field}' has unexpected value: {status}"
        assert status in [True, "OK", "ok", "healthy", "Healthy", "true", "True"], f"Field '{field}' is not indicating healthy status"


if __name__ == "__main__":
    test_get_api_health_endpoint_returns_system_operational_status()
