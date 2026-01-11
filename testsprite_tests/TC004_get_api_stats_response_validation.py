import requests

def test_get_api_stats_response_validation():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/stats"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"
    
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    
    # Validate that the statistics fields exist and have valid types
    assert isinstance(json_data, dict), f"Response JSON is not a dict but {type(json_data)}"
    assert len(json_data) > 0, "Statistics data is empty"

    for key, value in json_data.items():
        assert key and isinstance(key, str), "Invalid key in stats"
        assert value is not None, f"Value for key '{key}' is None"


test_get_api_stats_response_validation()