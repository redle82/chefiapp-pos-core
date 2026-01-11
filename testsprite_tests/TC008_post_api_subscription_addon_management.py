import requests
import uuid

BASE_URL = "http://localhost:4320"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_post_api_subscription_addon_management():
    # Use a dummy subscription id to test addon endpoint (assuming test environment)
    subscription_id = str(uuid.uuid4())

    addon_payload = {
        "subscription_id": subscription_id,
        "addon": {
            "name": "extra_storage",
            "quantity": 5
        }
    }
    
    resp_addon = requests.post(f"{BASE_URL}/api/subscription/addon", json=addon_payload, headers=HEADERS, timeout=TIMEOUT)
    assert resp_addon.status_code == 200, f"Failed to add addon: {resp_addon.text}"
    data_addon = resp_addon.json()
    # Validate that addon was added and subscription features updated
    assert "addons" in data_addon, "Response missing addons information"
    assert any(addon.get("name") == "extra_storage" and addon.get("quantity") == 5 for addon in data_addon["addons"]), "Addon not found or quantity mismatch"
    assert "features" in data_addon, "Response missing features information"


test_post_api_subscription_addon_management()
