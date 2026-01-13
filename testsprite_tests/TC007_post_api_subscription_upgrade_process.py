import requests
import json

BASE_URL = "http://localhost:4320"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_post_api_subscription_upgrade_process():
    # Step 1: Retrieve current subscription to get current plan (to create realistic upgrade data)
    try:
        get_resp = requests.get(f"{BASE_URL}/api/subscription", headers=HEADERS, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200 from GET /api/subscription, got {get_resp.status_code}"
        subscription_data = get_resp.json()
        # Determine the current plan (assuming subscription_data contains 'plan' field)
        current_plan = subscription_data.get("plan")
        assert current_plan is not None, "Current subscription plan not found in response"
    except (requests.RequestException, AssertionError) as e:
        raise RuntimeError(f"Failed to get current subscription info: {str(e)}")


    # Craft upgrade payload based on current plan (example: upgrade from 'basic' to 'premium')
    # If current_plan is premium or no clear upgrade, just choose a valid upgrade plan for test
    upgrade_payload = {
        "current_plan": current_plan,
        "upgrade_to": "premium" if current_plan != "premium" else "enterprise"
    }

    # Step 2: Post upgrade request
    try:
        post_resp = requests.post(f"{BASE_URL}/api/subscription/upgrade",
                                  headers=HEADERS,
                                  data=json.dumps(upgrade_payload),
                                  timeout=TIMEOUT)
        # Validate HTTP response status
        assert post_resp.status_code == 200, f"Expected 200 from POST /api/subscription/upgrade, got {post_resp.status_code}"
        upgrade_response = post_resp.json()
        # Validate response reflects upgraded plan and updated subscription status
        upgraded_plan = upgrade_response.get("plan")
        subscription_status = upgrade_response.get("status")
        assert upgraded_plan == upgrade_payload["upgrade_to"], f"Expected plan '{upgrade_payload['upgrade_to']}', got '{upgraded_plan}'"
        assert subscription_status in ("active", "upgraded"), f"Unexpected subscription status '{subscription_status}'"
    except (requests.RequestException, AssertionError) as e:
        raise RuntimeError(f"Subscription upgrade failed: {str(e)}")

    # Step 3: Verify subscription status via GET to confirm upgrade
    try:
        confirm_resp = requests.get(f"{BASE_URL}/api/subscription", headers=HEADERS, timeout=TIMEOUT)
        assert confirm_resp.status_code == 200, f"Expected 200 from GET /api/subscription post-upgrade, got {confirm_resp.status_code}"
        confirmed_data = confirm_resp.json()
        assert confirmed_data.get("plan") == upgrade_payload["upgrade_to"], "Subscription plan not updated after upgrade"
        assert confirmed_data.get("status") in ("active", "upgraded"), "Subscription status not properly updated after upgrade"
    except (requests.RequestException, AssertionError) as e:
        raise RuntimeError(f"Failed to confirm updated subscription: {str(e)}")


if __name__ == "__main__":
    test_post_api_subscription_upgrade_process()
