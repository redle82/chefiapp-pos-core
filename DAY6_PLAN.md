# Day 6: Testing & Monitoring Setup - Implementation Plan

**Date**: February 21, 2026
**Objective**: Advanced monitoring, payment integration, and load testing infrastructure
**Estimated Effort**: 4 hours
**Status**: 🚀 In Progress

---

## Phase 1: Monitoring Infrastructure (60 min)

### 1.1 Delivery Monitoring RPC Functions

**Database Migration**: `20260330_day6_monitoring_functions.sql`

```sql
-- Function 1: get_webhook_delivery_metrics(p_restaurant_id, p_hours DEFAULT 24)
-- Returns: delivery_count, success_rate, avg_delivery_time_ms, failure_count, retry_count
-- Purpose: Quick health dashboard for restaurant webhooks

-- Function 2: get_failed_deliveries_alert(p_max_age_hours DEFAULT 1)
-- Returns: delivery_id, restaurant_id, webhook_url, failure_reason, attempts_remaining, next_retry_at
-- Purpose: Alerting system for failed deliveries needing intervention

-- Function 3: get_webhook_performance_metrics()
-- Returns: total_deliveries, success_rate, p50_latency, p95_latency, p99_latency, hourly_throughput
-- Purpose: System-wide performance monitoring

-- Function 4: get_payment_to_delivery_latency(p_hours DEFAULT 24)
-- Returns: avg_latency_ms, min_latency_ms, max_latency_ms, hourly_breakdown
-- Purpose: Track time from payment received to restaurant notification
```

### 1.2 Monitoring Endpoints in Gateway

**New Endpoints** in `integration-gateway/src/index.ts`:

- `GET /api/v1/metrics/restaurant/:restaurant_id` - Per-restaurant webhook metrics
- `GET /api/v1/metrics/alerts` - Active delivery failures requiring action
- `GET /api/v1/metrics/performance` - System-wide performance dashboard
- `GET /api/v1/metrics/latency` - Payment-to-delivery latency tracking

---

## Phase 2: Payment Integration (90 min)

### 2.1 Restaurant ID Mapping

**Database Enhancement**: Add merchant code mapping table

```sql
CREATE TABLE IF NOT EXISTS webhook_merchant_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  payment_provider TEXT NOT NULL, -- 'sumup', 'stripe', etc.
  merchant_code TEXT NOT NULL,    -- SumUp merchant code, Stripe account ID, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, payment_provider, merchant_code)
);

-- RPC Function: resolve_restaurant_from_merchant_code(p_provider, p_merchant_code)
-- Returns: restaurant_id, organization_id, or NULL if not found
```

### 2.2 Order Status Update RPC

**New RPC Function**: `process_payment_completion(p_event_id, p_restaurant_id)`

```
- Lookup payment event from webhook_events table
- Extract amount, currency, transaction_id from processed_payload
- Find order by mapped restaurant_id and recent timestamp (within 15 min)
- Update order.payment_status = 'completed'
- Update order.payment_transaction_id
- Broadcast order fulfilled event (if applicable)
- Return: (success, order_id, message)
```

### 2.3 Integration Gateway Enhancement

**Update WebhookEventHandler**:

- Call `resolve_restaurant_from_merchant_code()` for SumUp/Stripe merchants
- On payment success, trigger `process_payment_completion()` RPC
- Return early if order not found (retry candidate)

---

## Phase 3: Load Testing (45 min)

### 3.1 Load Test Script

**File**: `scripts/day6_load_test.sh`

```bash
#!/bin/bash
# Simulate 100+ webhooks/minute for 5 minutes
# Verify exponential backoff under load
# Monitor database performance
# Track delivery success rate during high load

# Step 1: Create 50 test webhook events (simulating payment processor)
# Step 2: Trigger outbound delivery to mock endpoints
# Step 3: Verify exponential backoff scheduling happens correctly
# Step 4: Monitor database query performance (latency, throughput)
# Step 5: Check delivery success rate (should maintain 95%+)
# Step 6: Verify no connection pool exhaustion
# Step 7: Report performance summary
```

### 3.2 Mock Webhook Endpoint

**Service**: `integration-gateway/src/services/mock-receiver.ts`

- Listens on dedicated port (e.g., 4321)
- Accepts webhook deliveries from outbound service
- Simulates success (200), temporary failure (502), and permanent failure (410)
- Tracks delivery reception time for latency measurement
- Reports statistics: received_count, failed_count, avg_latency_ms

---

## Phase 4: Security Hardening (30 min)

### 4.1 Webhook Secret Encryption

**Database Enhancement**:

```sql
-- Encrypt stored secrets at rest using pgcrypto extension
ALTER TABLE webhook_secrets ADD COLUMN secret_encrypted BYTEA;

-- RPC: store_webhook_secret_encrypted(p_webhook_id, p_secret_plain)
-- Uses pgcrypto.encrypt() with master key from ENV: WEBHOOK_SECRET_KEY
-- Returns: secret_hash (for HMAC verification, not encrypted)

-- RPC: verify_webhook_signature_encrypted(p_webhook_id, p_payload, p_signature)
-- Retrieves encrypted secret, decrypts it, verifies HMAC signature
-- Returns: (is_valid, error_message)
```

### 4.2 Rate Limiting

**Gateway Enhancement**:

```typescript
// Per-restaurant rate limiting: max 50 deliveries/minute
// Per-IP rate limiting: max 1000 requests/hour
// Uses Redis-backed rate limiter (in-memory fallback if Redis unavailable)

const rateLimiter = new RateLimiter({
  restaurantLimit: 50, // per minute
  ipLimit: 1000, // per hour
  windowMs: 60000,
});

app.use(rateLimiter.middleware());
```

---

## Implementation Order

1. **[15 min]** Create Day 6 monitoring RPC migration
2. **[20 min]** Apply migration, verify 4 functions deployed
3. **[25 min]** Add monitoring endpoints to gateway
4. **[5 min]** Test monitoring endpoints
5. **[30 min]** Create merchant code mapping table + RPC
6. **[20 min]** Integrate payment completion into WebhookEventHandler
7. **[20 min]** Create load test script
8. **[15 min]** Run load test, collect metrics
9. **[15 min]** Add webhook secret encryption RPC
10. **[20 min]** Implement rate limiting in gateway
11. **[20 min]** Document Day 6 results
12. **[15 min]** Create todo summary for Day 7

**Total Estimated**: 215 minutes (~3.5 hours) - 50% faster than 4h plan

---

## Deliverables

✅ 4 new monitoring RPC functions
✅ 4 new monitoring endpoints in gateway
✅ Merchant code mapping infrastructure
✅ Payment order status integration
✅ Load test script (100+ webhooks/min for 5 min)
✅ Mock webhook receiver service
✅ Webhook secret encryption RPC
✅ Rate limiting middleware
✅ Comprehensive performance metrics
✅ Full documentation + test results

---

## Success Criteria

- ✅ All 4 monitoring functions deployed
- ✅ Load test maintains 95%+ delivery success under 100+ webhooks/min
- ✅ Exponential backoff scheduling verified during load test
- ✅ Database performance acceptable (p99 latency < 200ms)
- ✅ Payment → order status integration working end-to-end
- ✅ Rate limiting active on gateway
- ✅ No connection pool exhaustion during load test
- ✅ 7+ new load/monitoring tests passing

---

## Next: Day 7

**Focus**: Comprehensive validation, edge case testing, production readiness checklist

---

**Updated**: 2026-02-21 | **Status**: ✅ Plan Ready
