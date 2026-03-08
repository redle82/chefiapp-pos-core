# Session Infrastructure for Backend Testing

**Purpose:** Enable backend tests (TC003-TC010) to create orders without touching the Core directly. All operations go through the API layer.

---

## 🔐 Session Flow

### Step 1: Request Magic Link
```http
POST /api/auth/request-magic-link
Content-Type: application/json

{
  "email": "test@chefiapp.test"
}
```

**Response:**
```json
{
  "ok": true,
  "dev_token": "magic-link-token-here",
  "dev_link": "http://localhost:4320/api/auth/verify-magic-link?token=..."
}
```

### Step 2: Verify Magic Link
```http
GET /api/auth/verify-magic-link?token={dev_token}
```

**Response:**
```json
{
  "ok": true,
  "email": "test@chefiapp.test",
  "restaurant_id": "rest-id-if-available",
  "session_token": "session-token-to-use"
}
```

### Step 3: Use Session Token
```http
POST /api/orders
x-chefiapp-token: {session_token}
Content-Type: application/json

{
  "tableId": "test-table-1",
  "items": [...],
  "restaurantId": "test-rest-1"
}
```

---

## 📋 Test Setup Pattern

Each test that requires session (TC003-TC010) follows this pattern:

```json
{
  "setup": [
    {
      "step": "create_test_session",
      "description": "Create a test session by requesting magic link and verifying token",
      "endpoint": "POST /api/auth/request-magic-link",
      "body": { "email": "test@chefiapp.test" },
      "extract": "dev_token",
      "then": {
        "endpoint": "GET /api/auth/verify-magic-link?token={dev_token}",
        "extract": "session_token",
        "store_as": "SESSION_TOKEN"
      }
    }
  ],
  "headers": {
    "x-chefiapp-token": "{SESSION_TOKEN}"
  }
}
```

---

## 🎯 Key Points

1. **No Core Direct Access**
   - All operations go through API endpoints
   - Session is created via API
   - Orders are created via API
   - State transitions via API

2. **Session Token Storage**
   - Token is stored as `SESSION_TOKEN` variable
   - Used in `x-chefiapp-token` header for all authenticated requests
   - Valid for the duration of the test

3. **Test Isolation**
   - Each test creates its own session
   - No shared state between tests
   - Clean teardown (optional, not implemented yet)

---

## 🔄 Test Execution Flow

```
Test Start
  ↓
Setup: Create Session
  ├─ POST /api/auth/request-magic-link
  ├─ Extract dev_token
  ├─ GET /api/auth/verify-magic-link?token={dev_token}
  └─ Store session_token as SESSION_TOKEN
  ↓
Test Execution
  ├─ Use SESSION_TOKEN in x-chefiapp-token header
  ├─ Execute test steps (create order, lock, close, etc.)
  └─ Validate responses
  ↓
Test Complete
  └─ (Optional) Teardown: Clean up test data
```

---

## ✅ Benefits

1. **API-Only Testing**
   - Tests validate the full API stack
   - No direct Core access
   - Realistic test scenarios

2. **Session Validation**
   - Tests verify session management works
   - Validates authentication flow
   - Ensures security is enforced

3. **Complete Order Lifecycle**
   - Can now test full order lifecycle
   - TC003-TC010 are now executable
   - Validates state machine transitions

---

## 📝 Test Coverage

With session infrastructure, we can now test:

- ✅ TC003: Create order (with session)
- ✅ TC004: Update order items (with session)
- ✅ TC005: Lock order (with session)
- ✅ TC006: Reject modification of locked order
- ✅ TC007: Close order (with session)
- ✅ TC008: Reject modification of closed order
- ✅ TC009: Order total calculation immutability
- ✅ TC010: Order state machine transitions

---

## 🚀 Next Steps

1. **Execute Tests**
   - Run TestSprite with updated plan
   - Verify all TC003-TC010 pass with session

2. **Optional: Teardown**
   - Add cleanup steps to remove test orders
   - Clean up test sessions (if needed)

3. **Documentation**
   - Update README_TESTING.md with session flow
   - Add examples for manual testing

---

**Created:** 2025-12-27  
**Status:** ✅ Ready for Test Execution

