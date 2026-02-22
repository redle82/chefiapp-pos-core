# Webhook Architecture & Integration Guide

## System Overview

ChefIApp's webhook system enables real-time payment processing from external payment providers. Day 4 establishes the foundation for asynchronous event handling.

---

## Component Architecture

### Tier 1: Payment Provider → Integration Gateway

```
SumUp Merchant Account
  └─ Payment Processed
     └─ POST https://your-domain/api/v1/webhook/sumup
        ├─ Header: X-SumUp-Signature (HMAC-SHA256)
        ├─ Body: { id, type, data, timestamp }
        └─ Gateway receives & validates
```

**Security Layer**:

- HMAC-SHA256 signature verification
- Timing-safe string comparison
- API key rotation capability

### Tier 2: Integration Gateway → PostgreSQL

```
Integration Gateway (Node.js + Express)
  ├─ Port 4320 (or configurable)
  ├─ Endpoints:
  │  ├─ /health (monitoring)
  │  ├─ /api/v1/webhook/sumup (SumUp)
  │  ├─ /api/v1/webhook/stripe (Future)
  │  ├─ /api/v1/webhook/custom (Generic)
  │  └─ /api/v1/metrics (observability)
  │
  └─ Actions:
     ├─ Validate signature
     ├─ Extract event_id
     ├─ Call RPC: process_webhook_event()
     └─ Return 200 or error
```

### Tier 3: Event Processing

```
webhook_events Table (Idempotent Storage)
  ├─ UNIQUE(provider, event_id) → No duplicates
  ├─ Status: PENDING → PROCESSED (or FAILED)
  └─ RPC Functions:
     ├─ process_webhook_event() [Idempotent insertion]
     ├─ mark_webhook_processed() [Success]
     ├─ mark_webhook_failed() [Retry/error]
     └─ get_pending_webhooks() [Batch processing]
```

### Tier 4: Business Logic Integration

```
After webhook_events marked PROCESSED:
  ├─ Match to gm_order (via order reference)
  ├─ Create/update gm_order_payments
  ├─ Trigger gm_orders.payment_status = 'PAID'
  ├─ Auto-notify fulfillment system
  └─ (Day 5) Relay to restaurant webhooks
```

---

## Data Flow Sequence Diagram

```
SumUp Server          Integration Gateway    PostgreSQL        Business Logic
    |                      |                     |                    |
    |---HTTPS POST-------->|                     |                    |
    |   event payload       |                     |                    |
    |   + signature         |                     |                    |
    |                       |                     |                    |
    |       [Verify HMAC]   |                     |                    |
    |       [Extract data]  |                     |                    |
    |                       |                     |                    |
    |                       |---RPC Call-------->|                    |
    |                       |  process_webhook   |                    |
    |<------HTTP 200--------|  (idempotent)      |                    |
    |   { event_id, uid }   |                 [Insert/ON CONFLICT]    |
    |                       |<---Return event_id-|                    |
    |                       |                     |                    |
    |                       |                     |---Trigger-------->|
    |                       |                     |  gm_order_payments|
    |                       |                     |  gm_orders UPDATE |
    |                       |                     |                    |
    |                       |                     |  [ORDER PAID]      |
```

---

## Database Schema Details

### webhook_events

Core event table with idempotency built-in.

| Field             | Type         | Notes                                     |
| ----------------- | ------------ | ----------------------------------------- |
| id                | UUID         | Primary key                               |
| provider          | VARCHAR(50)  | 'sumup', 'stripe', etc.                   |
| event_type        | VARCHAR(100) | 'TRANSACTION_COMPLETED', etc.             |
| event_id          | VARCHAR(255) | UNIQUE per provider (prevents duplicates) |
| signature         | VARCHAR(255) | HMAC signature (for audit trail)          |
| raw_payload       | JSONB        | Full webhook payload (immutable)          |
| processed_payload | JSONB        | Normalized data after processing          |
| status            | VARCHAR(20)  | PENDING \| PROCESSED \| FAILED            |
| processing_error  | TEXT         | Error details if failed                   |
| received_at       | TIMESTAMP    | When received                             |
| verified_at       | TIMESTAMP    | When signature verified                   |
| processed_at      | TIMESTAMP    | When processed successfully               |

**Uniqueness Guarantee**:

```sql
UNIQUE(provider, event_id)
```

- Ensures duplicate events from same provider are ignored
- Implemented via PostgreSQL UNIQUE constraint
- RPC uses ON CONFLICT DO UPDATE pattern

### webhook_deliveries

Tracks outbound delivery attempts (for retry logic in Day 5).

| Field            | Type        | Notes                          |
| ---------------- | ----------- | ------------------------------ |
| id               | UUID        | Primary key                    |
| webhook_event_id | UUID        | FK to webhook_events           |
| webhook_url      | TEXT        | Target delivery URL            |
| http_status      | INTEGER     | Response code                  |
| response_body    | TEXT        | Server response                |
| attempt_number   | INTEGER     | Current attempt (1, 2, 3)      |
| max_attempts     | INTEGER     | Default 3 retries              |
| next_retry_at    | TIMESTAMP   | Exponential backoff schedule   |
| status           | VARCHAR(20) | PENDING \| DELIVERED \| FAILED |
| created_at       | TIMESTAMP   | When created                   |
| updated_at       | TIMESTAMP   | Last update                    |

### webhook_secrets

Stores encrypted API keys per restaurant.

| Field                           | Type        | Notes                                  |
| ------------------------------- | ----------- | -------------------------------------- |
| id                              | UUID        | Primary key                            |
| provider                        | VARCHAR(50) | 'sumup', 'stripe', etc.                |
| restaurant_id                   | UUID        | FK to restaurants                      |
| secret_key                      | TEXT        | Encryption key (encrypted at rest)     |
| api_key                         | TEXT        | API key from provider (encrypted)      |
| webhook_url                     | TEXT        | Where to relay events                  |
| is_active                       | BOOLEAN     | Enable/disable webhooks                |
| created_at                      | TIMESTAMP   | When created                           |
| rotated_at                      | TIMESTAMP   | Key rotation tracking                  |
| UNIQUE(provider, restaurant_id) | Constraint  | One secret per provider per restaurant |

---

## RPC Functions Reference

### 1. process_webhook_event()

**Purpose**: Idempotent event ingestion
**Idempotency**: UNIQUE constraint + ON CONFLICT DO UPDATE

```sql
process_webhook_event(
  p_provider: VARCHAR(50),        -- 'sumup', etc.
  p_event_type: VARCHAR(100),     -- 'TRANSACTION_COMPLETED'
  p_event_id: VARCHAR(255),       -- Provider's event ID
  p_raw_payload: JSONB,           -- Full webhook
  p_signature: VARCHAR(255)       -- Verification signature
) RETURNS (event_id: UUID, status: VARCHAR(20))
```

**Example Usage**:

```sql
SELECT * FROM process_webhook_event(
  'sumup',
  'TRANSACTION_COMPLETED',
  'evt_abc123xyz',
  '{"type": "TRANSACTION_COMPLETED", ...}',
  'hmac_sha256_hash'
);
-- Returns: { event_id: "uuid-here", status: "PENDING" }
```

**Idempotency Behavior**:

- First call: INSERT new event
- Same event_id, same provider: UPDATE existing (no duplicate)
- Repeated calls with same data: Safe (returns same event_id)

### 2. mark_webhook_processed()

**Purpose**: Mark event as successfully processed

```sql
mark_webhook_processed(
  p_webhook_event_id: UUID,       -- Event to mark
  p_processed_payload: JSONB      -- Normalized data
) RETURNS (event_id: UUID, status: VARCHAR(20))
```

**Example Usage**:

```sql
SELECT * FROM mark_webhook_processed(
  'event-uuid-here',
  '{"order_id": "ord_123", "amount": 1500, "currency": "EUR"}'
);
-- Returns: { event_id: "event-uuid-here", status: "PROCESSED" }
```

### 3. mark_webhook_failed()

**Purpose**: Mark event as failed for retry

```sql
mark_webhook_failed(
  p_webhook_event_id: UUID,       -- Event to mark
  p_error_message: TEXT           -- Error details
) RETURNS (event_id: UUID, status: VARCHAR(20))
```

### 4. get_pending_webhooks()

**Purpose**: Retrieve unprocessed events (for batch jobs)

```sql
get_pending_webhooks(
  p_provider: VARCHAR(50) = NULL, -- Filter by provider (optional)
  p_limit: INTEGER = 100          -- Max results
) RETURNS TABLE (
  id: UUID,
  provider: VARCHAR(50),
  event_type: VARCHAR(100),
  event_id: VARCHAR(255),
  raw_payload: JSONB,
  received_at: TIMESTAMP
)
```

**Example Usage**:

```sql
-- Get all pending SumUp webhooks
SELECT * FROM get_pending_webhooks('sumup', 50);
-- Returns: 50 rows (or fewer if < 50 pending)
```

---

## Integration Gateway API

### 1. Health Check

```http
GET /health

Response 200:
{
  "status": "ok",
  "service": "integration-gateway",
  "version": "1.0.0",
  "timestamp": "2025-12-06T10:30:00Z"
}
```

### 2. SumUp Webhook Receiver

```http
POST /api/v1/webhook/sumup

Headers:
  Content-Type: application/json
  X-SumUp-Signature: <hmac-sha256>

Body:
{
  "id": "evt_abc123xyz",
  "type": "TRANSACTION_COMPLETED",
  "data": {
    "transaction_id": "txn_123",
    "amount": 1500,
    "currency": "EUR",
    "merchant_code": "MERCHANT_01",
    "timestamp": "2025-12-06T10:25:00Z"
  }
}

Response 200:
{
  "event_id": "uuid-from-db",
  "status": "received",
  "message": "Webhook processed successfully"
}

Response 401:
{ "error": "Invalid or missing signature" }

Response 400:
{ "error": "Missing required field: event_id" }
```

**Validation Process**:

1. Extract X-SumUp-Signature header
2. Compute: HMAC-SHA256(body, SUMUP_API_KEY)
3. Compare with header signature (timing-safe)
4. If match: Call RPC, return 200
5. If mismatch: Return 401

### 3. Generic Webhook Receiver

```http
POST /api/v1/webhook/custom

Headers:
  Content-Type: application/json

Body: Any JSON (no signature required)

Response 200:
{ "event_id": "uuid", "status": "received" }
```

### 4. Stripe Webhook Receiver (Future)

```http
POST /api/v1/webhook/stripe

Headers:
  Stripe-Signature: t=<timestamp>,v1=<signature>

Response:
(Implementation follows Stripe SDK pattern - different from SumUp)
```

### 5. Metrics Endpoint

```http
GET /api/v1/metrics

Response 200:
{
  "total_events": 1234,
  "pending_events": 12,
  "processed_events": 1200,
  "failed_events": 22,
  "events_by_provider": {
    "sumup": 1000,
    "custom": 234
  },
  "events_by_status": {
    "pending": 12,
    "processed": 1200,
    "failed": 22
  },
  "uptime_seconds": 3600
}
```

---

## Security Best Practices

### Signature Verification

**Algorithm**: HMAC-SHA256
**Format**: Hex-encoded digest
**Comparison**: Timing-safe (prevents timing attacks)

```typescript
// Do NOT do this (vulnerable to timing attacks):
if (header_sig === computed_sig) { ... }

// Do this instead (timing-safe):
const crypto = require('crypto');
const match = crypto.timingSafeEqual(
  Buffer.from(header_sig, 'hex'),
  Buffer.from(computed_sig, 'hex')
);
```

### API Key Management

**Storage**: `webhook_secrets` table (encrypted at rest)
**Access**: service_role only (anon revoked)
**Rotation**: Update `rotated_at` timestamp

```sql
-- Rotate key
UPDATE webhook_secrets
SET api_key = 'new-key', rotated_at = NOW()
WHERE provider = 'sumup' AND restaurant_id = 'uuid';
```

### Rate Limiting (Production)

```typescript
// Example: Max 100 webhooks per minute per provider
app.use(
  "/api/v1/webhook/:provider",
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.params.provider,
  }),
);
```

---

## Environment Configuration

### Local (.env)

```env
PORT=4320
NODE_ENV=development
SUPABASE_URL=http://localhost:3000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZGF3bmFrMHcyYXh1bWhrbnVrZXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMzI4ODAwMCwiZXhwIjoxNzM0ODI0MDAwfQ.signature
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZGF3bmFrMHcyYXh1bWhrbnVrZXQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzAzMjg4MDAwLCJleHAiOjE3MzQ4MjQwMDB9.signature
SUMUP_API_KEY=your-sumup-secret-key
STRIPE_API_KEY=sk_test_your_key_here
LOG_LEVEL=debug
```

### Production (Render/Environment Variables)

```env
PORT=80 (Render assigns)
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUMUP_API_KEY=<production-sumup-key>
STRIPE_API_KEY=sk_live_your_key_here
LOG_LEVEL=info
```

---

## Deployment Checklist

### Local Testing

- [ ] Core (Docker) running on port 3001
- [ ] PostgreSQL running on port 54320
- [ ] `npm install` in integration-gateway/
- [ ] `.env` file created with local credentials
- [ ] `npm run dev` starts without errors
- [ ] `curl http://localhost:4320/health` returns 200
- [ ] `bash scripts/day4_e2e_test.sh` passes all 8 checks
- [ ] `node scripts/webhook-test.js` passes all 7 tests

### Production Deployment

- [ ] Render service created
- [ ] Build command: `cd integration-gateway && npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Environment variables set in Render dashboard
- [ ] Health check: `curl https://your-render-url/health`
- [ ] SumUp webhook URL configured: `https://your-render-url/api/v1/webhook/sumup`
- [ ] Monitoring/logs enabled
- [ ] Database backups configured

---

## Monitoring & Observability

### Logs to Monitor

```
[WEBHOOK_RECEIVED] provider=sumup event_id=evt_123 timestamp=...
[SIGNATURE_VERIFIED] hmac_match=true
[RPC_CALLED] function=process_webhook_event duration_ms=45
[EVENT_PROCESSED] event_id=uuid status=PENDING
[METRICS_ENDPOINT] total=1234 pending=12 processed=1200 failed=22
```

### Alerts

- Signature verification failures > 5/min
- RPC errors (database failures)
- Gateway health check failures
- Webhook processing latency > 1 second

### Metrics to Track

- Webhooks received per minute (by provider)
- Processing latency (p50, p95, p99)
- Success rate (%)
- Error rate (by type)
- Retry rate

---

## Troubleshooting

### Gateway Won't Start

```bash
# Check port conflict
lsof -i :4320

# Check environment variables
env | grep SUPABASE

# Check database connection
PGPASSWORD=postgres psql -h localhost -p 54320 -c "SELECT 1;"
```

### Webhooks Not Processing

```sql
-- Check if events are being stored
SELECT COUNT(*) FROM webhook_events;

-- Check for errors
SELECT * FROM webhook_events WHERE status = 'FAILED' LIMIT 5;

-- Check RPC permissions
SELECT * FROM pg_catalog.pg_proc WHERE proname = 'process_webhook_event';
```

### HMAC Verification Failing

```bash
# Test simple HMAC
echo -n '{"test":"payload"}' | openssl dgst -sha256 -hmac 'key' -hex

# Compare with header signature
# Headers should show: X-SumUp-Signature: <same-as-above>
```

---

## Next Steps (Day 5)

**Webhooks Outbound**: Implement event relay

- Create `gm_webhook_deliveries` table
- Implement retry logic with exponential backoff
- Add webhook URL configuration per restaurant
- Trigger outbound webhooks after payment processing

**Example Day 5 flow**:

```
SumUp Payment → webhook_events (INSERT)
              → process_webhook_event() RPC
              → mark_webhook_processed()
              → gm_order_payments (INSERT)
              → gm_orders (UPDATE status=PAID)
              → Trigger: Send outbound webhook to restaurant
              → gm_webhook_deliveries (INSERT delivery attempt)
              → Retry queue processes failed deliveries
```

---

## References

- [HMAC-SHA256 Algorithm](https://tools.ietf.org/html/rfc2104)
- [SumUp API Docs](https://sumup.com/developers)
- [PostgreSQL UNIQUE Constraint](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)
- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)

---

**Last Updated**: 2025-12-06
**Version**: 1.0.0 (Day 4 Implementation)
