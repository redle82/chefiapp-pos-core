# A4 — Rate Limiting: Token Bucket Implementation

**Date:** 11 February 2026
**Phase:** A4 — Core Blindagem
**Status:** 🟡 IMPLEMENTATION PHASE
**Scope:** Database-enforced rate limiting with per-restaurant, per-endpoint quotas
**Risk Level:** Medium (schema + RPC integration; quota tuning required post-launch)
**Dependencies:** A1 (RLS isolation) + A2 (idempotency) must be deployed first

---

## 1. Overview

### Problem Statement

ChefIApp Core is exposed to API abuse risks:

- **DDoS attacks:** Malicious client makes 10,000 requests/second → service degradation
- **Accidental spam:** Buggy client retries aggressively → quota exhaustion
- **Competitive attack:** Rival restaurant floods with requests → unfair resource allocation

**Current state:** Spec exists (RATE_LIMITING_AND_INPUT_VALIDATION.md), but server-side enforcement missing.

- Legacy Core had IP-based rate limiting (500 req/min per IP)
- Modern PostgREST RPC layer has NO rate limiting
- Client-side OrderProtection.ts only handles tab-level spam, not restaurant-level concurrency

### Solution: Token Bucket Algorithm

**Key insight:** Each restaurant has an independent quota per endpoint. Tokens refill at a fixed rate.

```
Timeline:
MIN 0     MIN 1     MIN 2
|---------|---------|
600 tokens (max)
Refill rate: 10 tokens/sec (600 tokens = 60 sec)

T=0:    600 tokens (full)
T=1:    590 tokens (used 10)
T=11:   600 tokens (refilled back to max)
T=15:   560 tokens (used 40 in seconds 12-15)
T=75:   600 tokens (all refilled)
```

---

## 2. Architecture

### 2.1 Database Schema

#### Table: `gm_rate_limit_config`

Defines endpoint quotas (admin-configurable).

```sql
CREATE TABLE gm_rate_limit_config (
  id UUID PRIMARY KEY,
  endpoint_name TEXT NOT NULL UNIQUE,
  max_tokens_per_minute INTEGER DEFAULT 600,
  token_weight INTEGER DEFAULT 1,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Example rows:**

| endpoint_name           | max_tokens_per_minute | token_weight | meaning                                            |
| ----------------------- | --------------------- | ------------ | -------------------------------------------------- |
| `create_order`          | 600                   | 1            | 600 orders/min per restaurant = 10 orders/sec      |
| `process_order_payment` | 300                   | 2            | 150 payments/min per restaurant = 2.5 payments/sec |
| `close_shift`           | 100                   | 6            | ~16 shifts/min per restaurant                      |
| `bulk_order_items`      | 200                   | 3            | ~66 bulk ops/min per restaurant                    |
| `export_orders`         | 50                    | 10           | 5 exports/min per restaurant (heavy operation)     |
| `dsr_request`           | 100                   | 5            | 20 DSR requests/min per restaurant                 |

**token_weight interpretation:**

- If endpoint has `max_tokens=600` and `token_weight=1`, then max operations = 600/1 = 600 per minute.
- If endpoint has `max_tokens=300` and `token_weight=2`, then max operations = 300/2 = 150 per minute.
- This allows asymmetric quotas: expensive operations (export, DSR) have higher weight.

#### Table: `gm_rate_limit_buckets`

Tracks current state of tokens per restaurant per endpoint.

```sql
CREATE TABLE gm_rate_limit_buckets (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  endpoint_name TEXT NOT NULL,
  tokens_remaining INTEGER,
  last_refill_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(restaurant_id, endpoint_name),
  FOREIGN KEY (endpoint_name) REFERENCES gm_rate_limit_config(endpoint_name)
);
```

**Example state:**

For Restaurant A at T=05:30:

| restaurant_id | endpoint_name         | tokens_remaining | last_refill_at       |
| ------------- | --------------------- | ---------------- | -------------------- |
| A             | create_order          | 550              | T=05:20 (10 sec ago) |
| A             | process_order_payment | 145              | T=05:15 (15 sec ago) |
| A             | close_shift           | 80               | T=05:25 (5 sec ago)  |

### 2.2 RPC Layer

#### RPC 1: `check_and_decrement_rate_limit()`

**Purpose:** Atomic operation — check quota, decrement if allowed, return status.

**Signature:**

```sql
check_and_decrement_rate_limit(
  p_restaurant_id UUID,
  p_endpoint_name TEXT,
  p_tokens_required INTEGER DEFAULT 1,
  p_actor_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT '0.0.0.0'
) RETURNS JSONB
```

**Request-Response Flow:**

```
REQUEST:
{
  "restaurant_id": "uuid-...",
  "endpoint_name": "create_order",
  "tokens_required": 1,
  "actor_id": "user-uuid-...",
  "ip_address": "192.168.1.100"
}

RESPONSE (ALLOWED):
{
  "success": true,
  "allowed": true,
  "endpoint": "create_order",
  "tokens_remaining": 599,
  "tokens_cost": 1,
  "max_tokens": 600,
  "retry_after": null,
  "audit_id": "audit-uuid-..."
}

RESPONSE (DENIED):
{
  "success": false,
  "allowed": false,
  "error": "Rate limit exceeded for endpoint: create_order",
  "code": "RATE_LIMIT_EXCEEDED",
  "endpoint": "create_order",
  "tokens_available": 50,
  "tokens_required": 100,  // (25 requests × 4 token_weight)
  "max_tokens": 600,
  "retry_after": 5,        // seconds until retry
  "audit_id": "audit-uuid-..."
}
```

**Internal Algorithm:**

1. **Validate** endpoint exists and is enabled
2. **Fetch or create** bucket for restaurant+endpoint (with lock)
3. **Refill** tokens based on `(NOW() - last_refill_at) × refill_rate`
4. **Check** if `tokens_remaining >= tokens_required`
   - **YES:** Decrement atomically, return `{allowed: true, ...}`
   - **NO:** Calculate `retry_after`, log violation, return `{allowed: false, ...}`
5. **Audit log** entry (audit_id for tracing)

**Atomicity:** Database-level lock (`FOR UPDATE`) ensures concurrent requests don't double-count tokens.

#### RPC 2: `get_rate_limit_status()`

**Purpose:** Query current quota status (for monitoring, dashboard, client-side UI).

**Signature:**

```sql
get_rate_limit_status(
  p_restaurant_id UUID,
  p_endpoint_name TEXT DEFAULT NULL
) RETURNS JSONB
```

**Response:**

```json
{
  "success": true,
  "restaurant_id": "uuid-...",
  "endpoints": [
    {
      "endpoint": "create_order",
      "max_tokens_per_minute": 600,
      "tokens_remaining": 550,
      "tokens_cost_per_request": 1,
      "max_requests_per_minute": 600,
      "current_requests_available": 550,
      "last_refill_at": "2026-02-11T10:00:00Z",
      "enabled": true
    },
    {
      "endpoint": "process_order_payment",
      "max_tokens_per_minute": 300,
      "tokens_remaining": 145,
      "tokens_cost_per_request": 2,
      "max_requests_per_minute": 150,
      "current_requests_available": 72,
      "last_refill_at": "2026-02-11T10:00:15Z",
      "enabled": true
    }
  ]
}
```

#### RPC 3: `reset_rate_limit_quota()`

**Purpose:** Admin operation to manually refill quota (e.g., after false positive DDoS detection).

**Signature:**

```sql
reset_rate_limit_quota(
  p_restaurant_id UUID,
  p_endpoint_name TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
) RETURNS JSONB
```

**Usage:**

```json
-- Reset single endpoint
{
  "restaurant_id": "uuid-...",
  "endpoint_name": "create_order",
  "actor_id": "admin-uuid-..."
}

-- Reset all endpoints
{
  "restaurant_id": "uuid-...",
  "actor_id": "admin-uuid-..."
}

RESPONSE:
{
  "success": true,
  "restaurant_id": "uuid-...",
  "endpoint": "create_order (or ALL)",
  "buckets_reset": 1
}
```

#### RPC 4: `update_rate_limit_config()`

**Purpose:** Admin operation to adjust endpoint quotas without migration.

**Signature:**

```sql
update_rate_limit_config(
  p_endpoint_name TEXT,
  p_max_tokens_per_minute INTEGER DEFAULT NULL,
  p_token_weight INTEGER DEFAULT NULL,
  p_enabled BOOLEAN DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
) RETURNS JSONB
```

**Usage:**

```json
-- Increase create_order quota from 600 to 1000 (e.g., during promotion)
{
  "endpoint_name": "create_order",
  "max_tokens_per_minute": 1000,
  "actor_id": "admin-uuid-..."
}

-- Disable an endpoint temporarily (e.g., during maintenance)
{
  "endpoint_name": "export_orders",
  "enabled": false,
  "actor_id": "admin-uuid-..."
}

RESPONSE:
{
  "success": true,
  "endpoint": "create_order",
  "updated": {
    "max_tokens_per_minute": 1000,
    "token_weight": 1,
    "enabled": true
  }
}
```

### 2.3 RLS Policies

Rate limit tables are protected by RLS:

- **`gm_rate_limit_buckets` SELECT:** Users can read only their restaurant's buckets
- **`gm_rate_limit_buckets` INSERT/UPDATE:** System-only (RPCs only, `WITH CHECK (false)`)
- **`gm_rate_limit_config` SELECT:** All authenticated users can read (configuration is public)
- **`gm_rate_limit_config` INSERT/UPDATE:** Admin-only (via RPC, `WITH CHECK (false)`)

---

## 3. Integration with Client & Server

### 3.1 Integration Flow

```
CLIENT REQUEST:
order = {
  restaurant_id: UUID,
  items: [...],
  idempotency_key: UUID
}

SERVER PROCESSING (in create_order RPC):

1. Check idempotency (A2)
   check_idempotency_status(restaurant_id, idempotency_key)
   → If found: return cached order (idempotent = true)
   → If not found: proceed

2. Check rate limit (A4) ← NEW
   check_and_decrement_rate_limit(restaurant_id, 'create_order', tokens_required=1)
   → If allowed: proceed
   → If denied: return 429 with retry_after header

3. Create order (main logic)
   INSERT INTO gm_orders (...)
   UPDATE gm_rate_limit_buckets SET tokens_remaining = ...

4. Log to audit (A1/A5)
   INSERT INTO gm_audit_logs (...)

5. Return response
   {success: true, order_id: UUID, idempotent: false}
```

### 3.2 Client-Side Integration (OrderProtection.ts Update)

The existing `OrderProtection.ts` does tab-level protection. A4 adds server-level enforcement.

**Current behavior:**

```typescript
// OrderProtection.ts (existing, client-only)
export class OrderProtection {
  private requestQueue: Map<string, QueuedRequest> = new Map();

  async submitOrder(order: Order): Promise<Response> {
    const key = `${order.restaurant_id}:${order.table_id}`;

    // Client-level check: is there a pending request for this table?
    if (this.requestQueue.has(key)) {
      throw new Error("Request already pending for this table");
    }

    // Submit and track
    const response = await submitOrderToCore(order);
    return response;
  }
}
```

**After A4 deployment:**

```typescript
// Server now checks rate limit and returns 429 if quota exceeded
async submitOrder(order: Order): Promise<Response> {
  const key = `${order.restaurant_id}:${order.table_id}`;

  // Step 1: Client-level check (unchanged)
  if (this.requestQueue.has(key)) {
    throw new Error("Request already pending for this table");
  }

  // Step 2: Submit to server (A4 now enforces at server level)
  try {
    const response = await submitOrderToCore(order);

    // Server performs:
    // - check_idempotency_status() ← A2
    // - check_and_decrement_rate_limit('create_order') ← A4 NEW
    // - Order creation logic
    // - Audit logging ← A1/A5

    return response;
  } catch (error) {
    if (error.status === 429) {
      // Server rate limit exceeded
      const retryAfter = parseInt(error.headers['retry-after']);
      console.warn(`Rate limit: retry after ${retryAfter}s`);

      // Exponential backoff with service advice
      await sleep(retryAfter * 1000);
      return this.submitOrder(order); // Retry
    }
    throw error;
  }
}
```

### 3.3 Response Headers (HTTP Layer)

When rate limit enforcement is integrated with HTTP layer, responses include:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 5
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-02-11T10:00:15Z

{
  "success": false,
  "allowed": false,
  "error": "Rate limit exceeded for endpoint: create_order",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 5
}
```

---

## 4. Audit & Monitoring

### 4.1 Audit Logging

Every rate limit check is logged to `gm_audit_logs`:

**ALLOWED request:**

```json
INSERT INTO gm_audit_logs (action, restaurant_id, table_name, new_values, ...)
{
  "action": "RATE_LIMIT_ALLOWED",
  "restaurant_id": "uuid-...",
  "table_name": "gm_rate_limit_buckets",
  "new_values": {
    "endpoint": "create_order",
    "tokens_cost": 1,
    "tokens_remaining_before": 600,
    "tokens_remaining_after": 599
  }
}
```

**EXCEEDED request:**

```json
INSERT INTO gm_audit_logs (action, restaurant_id, table_name, new_values, ...)
{
  "action": "RATE_LIMIT_EXCEEDED",
  "restaurant_id": "uuid-...",
  "table_name": "gm_rate_limit_buckets",
  "new_values": {
    "endpoint": "create_order",
    "tokens_cost": 1,
    "tokens_available": 0,
    "tokens_deficit": 1,
    "retry_after_seconds": 6
  }
}
```

### 4.2 Monitoring & Alerting

**Metrics to track:**

```sql
-- SLO: <0.1% of requests exceed limit
SELECT
  endpoint_name,
  COUNT(*) FILTER (WHERE action = 'RATE_LIMIT_EXCEEDED') as violations,
  COUNT(*) FILTER (WHERE action = 'RATE_LIMIT_ALLOWED') as allowed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE action = 'RATE_LIMIT_EXCEEDED') /
    (COUNT(*) FILTER (WHERE action = 'RATE_LIMIT_ALLOWED') + COUNT(*) FILTER (WHERE action = 'RATE_LIMIT_EXCEEDED')),
    2
  ) as violation_rate_pct
FROM gm_audit_logs
WHERE action IN ('RATE_LIMIT_ALLOWED', 'RATE_LIMIT_EXCEEDED')
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY endpoint_name;
```

**Alerting rules:**

- **🟡 WARN:** Violation rate > 1% on any endpoint → investigate quota (too aggressive)
- **🔴 ALERT:** Violation rate > 5% on any endpoint → DDoS suspected, trigger incident response
- **🔴 ALERT:** Same restaurant >100 violations/min → investigation + possible temporary ban

---

## 5. Default Quotas & Tuning

### 5.1 Default Configuration

**Set during deployment (migration 20260214):**

| Endpoint                | Max Tokens/Min | Token Weight | Max Requests/Min | Purpose                          |
| ----------------------- | -------------- | ------------ | ---------------- | -------------------------------- |
| `create_order`          | 600            | 1            | 600              | New order creation (lightweight) |
| `process_order_payment` | 300            | 2            | 150              | Payment processing (moderate)    |
| `close_shift`           | 100            | 6            | ~16              | Shift closure (heavy operation)  |
| `bulk_order_items`      | 200            | 3            | ~66              | Bulk item modification           |
| `modify_order`          | 400            | 1            | 400              | Order modification               |
| `void_order`            | 300            | 2            | 150              | Order void                       |
| `export_orders`         | 50             | 10           | 5                | Data export (very heavy)         |
| `dsr_request`           | 100            | 5            | 20               | Data subject request             |

### 5.2 Tuning After Launch

Post-launch, use audit logs to determine if quotas are realistic:

```sql
-- Check 95th percentile of requests per restaurant per minute
SELECT
  endpoint_name,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY req_count) as p95_requests_per_min
FROM (
  SELECT
    endpoint_name,
    DATE_TRUNC('minute', created_at) as minute,
    restaurant_id,
    COUNT(*) as req_count
  FROM gm_audit_logs
  WHERE action = 'RATE_LIMIT_ALLOWED'
    AND created_at > NOW() - INTERVAL '7 days'
  GROUP BY endpoint_name, DATE_TRUNC('minute', created_at), restaurant_id
) sub
GROUP BY endpoint_name;
```

**If p95 > default quota:** Increase quota (current setting is too tight)
**If violations > 1%:** Investigate (quota may be too tight for specific restaurant types)

### 5.3 Manual Tuning (Admin RPC)

```sql
-- Example: Special event detected, increase create_order quota temporarily
SELECT update_rate_limit_config(
  p_endpoint_name := 'create_order',
  p_max_tokens_per_minute := 1000,  -- 600 → 1000
  p_actor_id := admin_user_id
);

-- Log the change (audit trail)
-- Later: revert back to 600
SELECT update_rate_limit_config(
  p_endpoint_name := 'create_order',
  p_max_tokens_per_minute := 600,
  p_actor_id := admin_user_id
);
```

---

## 6. Deployment Checklist

### Pre-Deployment

- [ ] A1 (RLS) deployed and verified green
- [ ] A2 (idempotency) deployed and verified green
- [ ] Audit logs (A5) working
- [ ] Database backup taken
- [ ] Rate limit config reviewed: quotas reasonable for restaurant types?
- [ ] Test environment: rate limit RPCs manually tested
- [ ] Load test: 600 concurrent requests to create_order, verify 601st denied

### Deployment Steps

1. **Apply migration:**

   ```bash
   psql postgresql://... < docker-core/schema/migrations/20260214_rate_limiting.sql
   ```

2. **Verify tables created:**

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_name IN ('gm_rate_limit_config', 'gm_rate_limit_buckets');
   -- Expected: gm_rate_limit_buckets, gm_rate_limit_config
   ```

3. **Verify RPC functions created:**

   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_type = 'FUNCTION'
     AND routine_name LIKE 'check_and_decrement%'
     OR routine_name LIKE 'get_rate_limit%'
     OR routine_name LIKE 'reset_rate_limit%'
     OR routine_name LIKE 'update_rate_limit%';
   -- Expected: check_and_decrement_rate_limit, get_rate_limit_status, reset_rate_limit_quota, update_rate_limit_config
   ```

4. **Verify endpoint config seeded:**

   ```sql
   SELECT endpoint_name, max_tokens_per_minute, token_weight
   FROM gm_rate_limit_config
   ORDER BY endpoint_name;
   -- Expected: 8 endpoints (create_order, process_order_payment, ...)
   ```

5. **Test single RPC call:**

   ```sql
   SELECT check_and_decrement_rate_limit(
     p_restaurant_id := 'test-restaurant-uuid',
     p_endpoint_name := 'create_order',
     p_tokens_required := 1
   );
   -- Expected: {success: true, allowed: true, tokens_remaining: 599}
   ```

6. **Integrate with client:** Update merchant-portal to handle 429 responses

   - [ ] OrderProtection.ts updated
   - [ ] HTTP error handler recognizes 429
   - [ ] Retry-After header respected

7. **Verify audit logging:** Check migration entry
   ```sql
   SELECT * FROM gm_audit_logs
   WHERE action = 'SYSTEM_MIGRATION_RATE_LIMITING'
   ORDER BY created_at DESC LIMIT 1;
   ```

### Post-Deployment (First Week)

- [ ] Monitor violation rate (should be < 0.1%)
- [ ] Check audit logs daily for anomalies
- [ ] Collect quota statistics (use SLO query above)
- [ ] Communicate to restaurants: rate limits in effect (no action needed unless seeing 429 errors)
- [ ] Have reset RPC ready for emergency quota boost

---

## 7. Troubleshooting

### Issue: Getting RATE_LIMIT_EXCEEDED on normal operations

**Diagnosis:**

```sql
-- Check current quota usage
SELECT get_rate_limit_status('restaurant-uuid'::uuid, 'create_order');

-- Check recent activity
SELECT action, COUNT(*) as count, MAX(created_at) as latest
FROM gm_audit_logs
WHERE restaurant_id = 'restaurant-uuid'::uuid
  AND endpoint_name = 'create_order'
  AND created_at > NOW() - INTERVAL '5 minutes'
GROUP BY action;
```

**Solutions:**

1. **Quota too tight:** Use `update_rate_limit_config()` to increase

   ```sql
   SELECT update_rate_limit_config('create_order', 1000);
   ```

2. **Client buggy (retrying too aggressively):** Contact restaurant, ask to check app logs

3. **DDoS attack:** Investigate source, temporarily ban IP if malicious

### Issue: Rate limit not being enforced

**Diagnosis:**

1. Migration not applied:

   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'gm_rate_limit_buckets';
   -- If empty: migration not applied
   ```

2. RPC not integrated:

   - Grep for `check_and_decrement_rate_limit` in server code
   - Verify it's called before main RPC logic

3. RLS blocking RPC:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'gm_rate_limit_buckets';
   -- Verify policies don't block SECURITY DEFINER RPC
   ```

### Issue: Audit logs not appearing

**Diagnosis:**

```sql
SELECT COUNT(*) FROM gm_audit_logs
WHERE action LIKE 'RATE_LIMIT%' AND created_at > NOW() - INTERVAL '1 hour';
```

**Solutions:**

1. RPC logs disabled: Check RPC code, verify audit insert not commented
2. Audit table not accessible: Check RLS policies on gm_audit_logs
3. Log rotation: Check retention policy (should keep 6 months minimum)

---

## 8. Examples: Typical Scenarios

### Scenario 1: Black Friday Surge

**Context:** Restaurant has 100 servers taking orders simultaneously.

**Current behavior (A4 with defaults):**

- `create_order` quota: 600/min = 10 orders/sec
- 100 concurrent servers ≈ 100 orders/sec
- Result: 90% rejected (only 10 of 100 allowed per second)

**Action:**

```sql
-- Admin increases quota for Black Friday
SELECT update_rate_limit_config(
  p_endpoint_name := 'create_order',
  p_max_tokens_per_minute := 3000,  -- 5x increase
  p_actor_id := admin_id
);

-- Restaurant now: 3000/min = 50 orders/sec → sufficient for 100 servers
```

**After event:**

```sql
-- Revert to default
SELECT update_rate_limit_config(
  p_endpoint_name := 'create_order',
  p_max_tokens_per_minute := 600,
  p_actor_id := admin_id
);
```

### Scenario 2: DDoS Attack Detected

**Context:** Audit logs show 50 violations/minute on `process_order_payment` + many from same IP.

**Diagnosis:**

```sql
SELECT ip_address, COUNT(*) as violations
FROM gm_audit_logs
WHERE action = 'RATE_LIMIT_EXCEEDED'
  AND endpoint_name = 'process_order_payment'
  AND created_at > NOW() - INTERVAL '10 minutes'
GROUP BY ip_address
ORDER BY violations DESC;
-- Result: 192.168.1.123 shows 450 violations

SELECT restaurant_id, COUNT(*) as violations
FROM gm_audit_logs
WHERE action = 'RATE_LIMIT_EXCEEDED'
  AND ip_address = '192.168.1.123'
  AND created_at > NOW() - INTERVAL '10 minutes'
GROUP BY restaurant_id;
-- Result: 10 different restaurants hit → coordinated attack
```

**Action:**

1. Block IP at firewall/nginx level (outside scope of rate limiting)
2. Monitor if legitimate traffic resumes
3. Reset quotas for affected restaurants (if needed):
   ```sql
   SELECT reset_rate_limit_quota(restaurant_uuid, NULL, admin_id);
   ```

### Scenario 3: Client Retry Loop Bug

**Context:** Client has bug causing exponential backoff retries when order fails for unrelated reason.

**Symptom:** Single restaurant hitting RATE_LIMIT_EXCEEDED on every endpoint simultaneously.

**Diagnosis:**

```sql
SELECT endpoint_name, COUNT(*) as violations, MAX(created_at) as latest
FROM gm_audit_logs
WHERE restaurant_id = 'problem-restaurant-uuid'
  AND action = 'RATE_LIMIT_EXCEEDED'
  AND created_at > NOW() - INTERVAL '10 minutes'
GROUP BY endpoint_name;
-- Result: all 8 endpoints showing violations
```

**Action:**

1. Contact restaurant: "Your terminal is retrying too aggressively due to backend error. Please restart."
2. Reset their quotas to clear the spam:
   ```sql
   SELECT reset_rate_limit_quota('problem-restaurant-uuid', NULL, admin_id);
   ```
3. Investigate root cause (A2 idempotency should prevent duplicates; A5 audit logs should show original error)

---

## 9. Future Enhancements

### Phase B: Advanced Rate Limiting

- [ ] Per-user quota (separate rates for different roles: waiter, manager, etc.)
- [ ] Time-based quotas (different limits during peak hours 12:00-14:00 vs off-peak)
- [ ] Adaptive throttling (increase delays as quota depletes, gradual degradation)
- [ ] Webhook notifications (alert restaurant when approaching limit)
- [ ] Per-IP reputation scoring (trusted IPs get higher quotas)

### Phase C: Observability Integration

- [ ] Trace ID linking: tie rate limit checks to order IDs in observability system
- [ ] Dashboard: real-time quota usage per restaurant
- [ ] Anomaly detection: ML model to detect traffic pattern shifts
- [ ] Self-healing: automatic quota adjustment based on predictive model

---

## 10. References

- [RATE_LIMITING_AND_INPUT_VALIDATION.md](../architecture/RATE_LIMITING_AND_INPUT_VALIDATION.md) — Spec overview
- [THREAT_MODEL.md](../architecture/THREAT_MODEL.md) — DDoS threat analysis
- [A1_TENANT_ISOLATION_ENFORCEMENT.md](./A1_TENANT_ISOLATION_ENFORCEMENT.md) — RLS foundation
- [A2_SERVER_SIDE_IDEMPOTENCY.md](./A2_SERVER_SIDE_IDEMPOTENCY.md) — Idempotency integration
- Migration: `docker-core/schema/migrations/20260214_rate_limiting.sql`
- Tests: `tests/integration/rate_limiting.test.ts`

---

**Document Status:** 🟡 DRAFT (Implementation phase)
**Last Updated:** 11 February 2026
**Next Review:** After first restaurant deployment (Feb 20)
