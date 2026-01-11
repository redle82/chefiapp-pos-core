import requests

BASE_URL = "http://localhost:4320"

def test_get_api_health_endpoint_validation():
    url = f"{BASE_URL}/api/health"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert isinstance(data, dict), "Response JSON is not an object"
    assert data.get("status") == "ok", "Status is not 'ok'"
    services = data.get("services")
    assert isinstance(services, dict), "services field is missing or not an object"
    assert services.get("database") == "up", "services.database is not 'up'"
    assert services.get("api") == "up", "services.api is not 'up'"

test_get_api_health_endpoint_validation()