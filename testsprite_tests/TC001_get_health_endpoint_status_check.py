import requests

def test_get_health_endpoint_status_check():
    base_url = "http://localhost:4320"
    url = f"{base_url}/health"

    try:
        response = requests.get(url, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert data.get("status") == "ok", f"Expected status 'ok', got {data.get('status')}"
    services = data.get("services")
    assert services is not None, "Expected 'services' key in response"

    assert services.get("database") == "up", f"Expected database status 'up', got {services.get('database')}"
    assert services.get("api") == "up", f"Expected api status 'up', got {services.get('api')}"

test_get_health_endpoint_status_check()