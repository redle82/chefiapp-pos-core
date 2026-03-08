# TC009 Fix Notes

**Issue:** Test uses incorrect HTTP method to lock order  
**Status:** Test code issue (not CORE issue)  
**Priority:** LOW (API works correctly, proven by TC005)

---

## Problem

TC009 test code uses:
```python
# ❌ WRONG
lock_payload = {"action": "lock"}
lock_resp = requests.patch(
    f"{BASE_URL}/api/orders/{order_id}",
    json=lock_payload,
    headers=headers,
    timeout=TIMEOUT
)
```

## Correct Implementation

The API correctly implements:
```python
# ✅ CORRECT
lock_resp = requests.post(
    f"{BASE_URL}/api/orders/{order_id}/lock",
    headers=headers,
    timeout=TIMEOUT
)
```

## Evidence

- ✅ TC005 passes using `POST /api/orders/{orderId}/lock`
- ✅ Lock endpoint exists and works correctly
- ✅ Total calculation works correctly
- ✅ State transition OPEN → LOCKED works correctly

## Fix Required

Update TC009 test code to use:
```python
# Lock order (POST /api/orders/{orderId}/lock)
lock_resp = requests.post(
    f"{BASE_URL}/api/orders/{order_id}/lock",
    headers=headers,
    timeout=TIMEOUT
)
lock_resp.raise_for_status()
locked_order = lock_resp.json()
assert locked_order.get("state") == "LOCKED"
```

## Rationale

- API contract is explicit and correct
- Lock endpoint already exists and is validated (TC005)
- This is a test code issue, not a CORE issue
- **Do NOT** add hack to support `{"action": "lock"}` via PATCH

## Expected Result

After fix: TC009 should pass, achieving 100% test pass rate (10/10).

---

**Note:** This fix should be applied in the test plan JSON or in the next TestSprite generation, not in the CORE API code.

