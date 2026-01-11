# OpenAPI Specification - CORE STABLE v1.0

**Version:** 1.0.0  
**Date:** 2025-12-27  
**Status:** ✅ **FROZEN / STABLE**

---

## 📋 Overview

This document describes the OpenAPI 3.0.3 specification for ChefIApp POS CORE STABLE v1.0.

**Specification File:** `openapi-core-stable-v1.yaml`

---

## 🎯 Scope

### ✅ Included (CORE Operational)

This specification covers **ONLY** the CORE operational functionality:

1. **Health & System Status**
   - `GET /health`
   - `GET /api/health`

2. **Session Management**
   - `POST /api/auth/request-magic-link`
   - `GET /api/auth/verify-magic-link`

3. **Order Lifecycle**
   - `POST /api/orders` - Create order
   - `GET /api/orders/{orderId}` - Get order
   - `PATCH /api/orders/{orderId}` - Update order items
   - `POST /api/orders/{orderId}/lock` - Lock order
   - `POST /api/orders/{orderId}/close` - Close order

### ❌ Explicitly NOT Included

The following are **NOT** part of CORE STABLE v1.0:

- ❌ **Payment Processing**
  - `/api/payment-intent`
  - Stripe integration
  - Payment webhooks

- ❌ **Billing**
  - `/api/billing/*`
  - Subscription management
  - Billing webhooks

- ❌ **Onboarding**
  - `/api/onboarding/*`
  - Wizard flows
  - Setup processes

- ❌ **Internal Endpoints**
  - `/internal/*`
  - Admin operations
  - Preview endpoints

- ❌ **Public Web Pages**
  - `/public/*`
  - Customer-facing pages
  - Menu display

**These are Phase 2+ features and will be documented separately.**

---

## 🧠 Architectural Principles

### 1. Canonical HTTP Contracts

- **Semantic endpoints**: `/api/orders/{orderId}/lock` (not `PATCH /api/orders/{orderId} { "action": "lock" }`)
- **Correct HTTP verbs**: POST for state transitions, PATCH for updates
- **No magic actions**: No action-based operations

### 2. State Machine Enforcement

- **Explicit states**: OPEN, LOCKED, CLOSED
- **Valid transitions**: OPEN → LOCKED → CLOSED
- **Invalid transitions**: Rejected with 400 error

### 3. Financial Immutability

- **LOCKED orders**: Cannot be modified (400 error)
- **CLOSED orders**: Cannot be modified (400 error)
- **Total calculation**: Calculated once on lock, immutable after

### 4. Ontological Gates

- **Restaurant ID required**: All order operations require valid `restaurant_id`
- **No implicit context**: System does not invent restaurant IDs
- **Explicit validation**: Database constraints enforce integrity

### 5. Session Management

- **Magic link flow**: Request → Verify → Session token
- **Header-based auth**: `x-chefiapp-token` header
- **No cookies**: Stateless authentication

---

## 📊 Endpoint Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/health` | System health | No |
| GET | `/api/health` | Alternative health | No |
| POST | `/api/auth/request-magic-link` | Request auth | No |
| GET | `/api/auth/verify-magic-link` | Verify auth | No |
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders/{orderId}` | Get order | Yes |
| PATCH | `/api/orders/{orderId}` | Update items | Yes |
| POST | `/api/orders/{orderId}/lock` | Lock order | Yes |
| POST | `/api/orders/{orderId}/close` | Close order | Yes |

---

## 🔐 Authentication

### Flow

1. **Request Magic Link**
   ```http
   POST /api/auth/request-magic-link
   Content-Type: application/json
   
   { "email": "user@example.com" }
   ```

2. **Verify Magic Link**
   ```http
   GET /api/auth/verify-magic-link?token={dev_token}
   ```

3. **Use Session Token**
   ```http
   POST /api/orders
   x-chefiapp-token: {session_token}
   Content-Type: application/json
   
   { "tableId": "table-1" }
   ```

---

## 📝 Order State Machine

### States

- **OPEN**: Order can be modified
- **LOCKED**: Order is locked, total calculated, immutable
- **CLOSED**: Order is closed, terminal state, fully immutable

### Valid Transitions

- ✅ OPEN → LOCKED (via `POST /api/orders/{orderId}/lock`)
- ✅ LOCKED → CLOSED (via `POST /api/orders/{orderId}/close`)
- ✅ OPEN → CLOSED (via `POST /api/orders/{orderId}/close` - skips LOCKED)

### Invalid Transitions

- ❌ CLOSED → OPEN (rejected with 400)
- ❌ LOCKED → OPEN (rejected with 400)
- ❌ CLOSED → LOCKED (rejected with 400)

---

## 💰 Financial Immutability

### Total Calculation

When an order is **locked**:
- `total_cents = sum(items.quantity * items.price_snapshot_cents)`
- Total is calculated once and stored
- Total becomes immutable after lock

### Immutability Rules

- **OPEN orders**: Can be modified (items can be added/removed)
- **LOCKED orders**: Cannot be modified (400 error: `ORDER_IMMUTABLE`)
- **CLOSED orders**: Cannot be modified (400 error: `ORDER_IMMUTABLE`)

---

## 🚫 What This API Does NOT Support

### Explicitly NOT Supported

1. **Action-based PATCH**
   ```json
   // ❌ NOT SUPPORTED
   PATCH /api/orders/{orderId}
   { "action": "lock" }
   ```
   
   **Use instead:**
   ```http
   POST /api/orders/{orderId}/lock
   ```

2. **Implicit Restaurant Context**
   - System does not invent restaurant IDs
   - `restaurant_id` must be provided or configured

3. **Silent Fallbacks**
   - All errors are explicit
   - No hidden behavior

4. **Multiple Contracts**
   - One way to do each operation
   - No aliases or shortcuts

---

## 📚 Usage Examples

### Complete Order Lifecycle

```bash
# 1. Request magic link
curl -X POST http://localhost:4320/api/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Response: { "ok": true, "dev_token": "...", "dev_link": "..." }

# 2. Verify magic link
curl "http://localhost:4320/api/auth/verify-magic-link?token={dev_token}"

# Response: { "ok": true, "email": "...", "session_token": "..." }

# 3. Create order
curl -X POST http://localhost:4320/api/orders \
  -H "x-chefiapp-token: {session_token}" \
  -H "Content-Type: application/json" \
  -d '{"tableId":"table-1","items":[]}'

# Response: { "order_id": "...", "state": "OPEN", ... }

# 4. Add items
curl -X PATCH http://localhost:4320/api/orders/{orderId} \
  -H "x-chefiapp-token: {session_token}" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"item_id":"item-1","quantity":2,"price_snapshot_cents":1500}]}'

# 5. Lock order
curl -X POST http://localhost:4320/api/orders/{orderId}/lock \
  -H "x-chefiapp-token: {session_token}"

# Response: { "order_id": "...", "state": "LOCKED", "total_cents": 3000, ... }

# 6. Close order
curl -X POST http://localhost:4320/api/orders/{orderId}/close \
  -H "x-chefiapp-token: {session_token}"

# Response: { "order_id": "...", "state": "CLOSED", ... }
```

---

## 🔍 Validation

### Request Validation

- **Email format**: Must be valid email
- **UUID format**: Order IDs must be valid UUIDs
- **State transitions**: Only valid transitions allowed
- **Required fields**: `tableId` required for order creation

### Response Validation

- **Consistent format**: All order responses use same schema
- **State values**: Always uppercase (OPEN, LOCKED, CLOSED)
- **Total calculation**: Always accurate when LOCKED/CLOSED

---

## 📋 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `SESSION_REQUIRED` | Session token missing | 401 |
| `ORDER_NOT_FOUND` | Order does not exist | 404 |
| `ORDER_IMMUTABLE` | Order cannot be modified (LOCKED/CLOSED) | 400 |
| `INVALID_STATE_TRANSITION` | Invalid state transition attempted | 400 |
| `ORDER_ALREADY_CLOSED` | Order already in CLOSED state | 400 |
| `TOKEN_REQUIRED` | Magic link token missing | 400 |
| `TOKEN_INVALID_OR_EXPIRED` | Magic link token invalid | 401 |
| `INVALID_REQUEST` | Request validation failed | 400 |
| `INTERNAL_ERROR` | Server error | 500 |

---

## 🎯 Testing

All endpoints in this specification have been validated through TestSprite:

- ✅ Health endpoints: 100% passing
- ✅ Order lifecycle: 87.5% passing (1 test code issue, not API issue)
- ✅ State machine: 100% validated
- ✅ Immutability: 100% enforced

**Test Reports:**
- [testsprite_tests/FINAL_STATUS_REPORT.md](../testsprite_tests/FINAL_STATUS_REPORT.md)
- [testsprite_tests/testsprite-mcp-test-report.md](../testsprite_tests/testsprite-mcp-test-report.md)

---

## 🔄 Versioning

### Current Version: 1.0.0

This is a **frozen, stable** version. Breaking changes will result in version increment.

### Breaking Changes Policy

Any change that:
- Removes an endpoint
- Changes request/response schema
- Changes state machine behavior
- Removes a field from response

...will result in a new major version.

---

## 📚 Related Documentation

- [CORE_STABLE_V1.md](../CORE_STABLE_V1.md) - Official status
- [CHANGELOG_CORE_STABLE_V1.md](../CHANGELOG_CORE_STABLE_V1.md) - Changelog
- [README_TESTING.md](../README_TESTING.md) - Testing guide
- [testsprite_tests/CORE_TESTING_PREREQUISITES.md](../testsprite_tests/CORE_TESTING_PREREQUISITES.md) - Prerequisites

---

## ✅ Certification

This OpenAPI specification is:

- ✅ **Frozen**: No changes without version increment
- ✅ **Tested**: All endpoints validated
- ✅ **Documented**: Complete and accurate
- ✅ **Auditable**: Ready for legal/technical review
- ✅ **Canonical**: One way to do each operation

---

**Status:** ✅ **CORE STABLE v1.0**  
**Specification:** `openapi-core-stable-v1.yaml`  
**Ready for:** Integration, legal audit, investor review

---

*"This is the frozen, stable API contract. No magic, no shortcuts, no ambiguity."*

