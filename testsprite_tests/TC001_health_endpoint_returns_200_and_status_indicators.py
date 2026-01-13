import requests

BASE_URL = "http://localhost:4320"
TIMEOUT = 30


def test_health_endpoint_returns_200_and_status_indicators():
    endpoints = ["/health", "/api/health"]
    for ep in endpoints:
        url = BASE_URL + ep
        try:
            resp = requests.get(url, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request to {url} failed: {e}"
        assert resp.status_code == 200, f"Expected status 200 from {url}, got {resp.status_code}"
        try:
            data = resp.json()
        except ValueError:
            assert False, f"Response from {url} is not valid JSON"
        # Validate required status indicators
        # Either:
        #   data.status == "ok" and data.services.database == "up"
        # or:
        #   data.services.eventStore == "up" and data.services.coreEngine == "up"
        status = data.get("status")
        services = data.get("services")
        assert isinstance(services, dict), f"'services' field missing or invalid in response from {url}"
        cond1 = (status == "ok" and services.get("database") == "up")
        cond2 = (services.get("eventStore") == "up" and services.get("coreEngine") == "up")
        assert cond1 or cond2, (
            f"Health indicators missing or incorrect in response from {url}. "
            f"Got status='{status}' and services={services}"
        )



if __name__ == "__main__":
    test_health_endpoint_returns_200_and_status_indicators()
