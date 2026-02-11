# A5 Implementation Guide — Core Audit Log Schema + RPC

**Status:** ✅ IMPLEMENTED
**Date:** 2026-02-11
**Files Created:**

- [docker-core/schema/migrations/20260211_core_audit_logs.sql](../../docker-core/schema/migrations/20260211_core_audit_logs.sql) — Core schema, triggers, RPCs
- [merchant-portal/src/core/services/AuditLogService.ts](../../merchant-portal/src/core/services/AuditLogService.ts) — TypeScript client service

---

## What Was Built

### 1. PostgreSQL Schema (gm_audit_logs)

**Location:** `20260211_core_audit_logs.sql`

#### Table Structure

```sql
CREATE TABLE gm_audit_logs (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,           -- 'login_success', 'order_created', 'payment_recorded', etc.
  action TEXT NOT NULL,               -- 'create', 'update', 'delete', 'authenticate'
  restaurant_id UUID NOT NULL,        -- TENANT ISOLATION (filtro obrigatório)
  actor_id UUID,                      -- Quem fez (user_id or NULL if system)
  actor_type TEXT DEFAULT 'user',     -- 'user', 'system', 'support_admin'
  resource_type TEXT,                 -- 'order', 'payment', 'user', 'config', etc.
  resource_id UUID,                   -- ID do recurso afetado
  details JSONB,                      -- Detalhes adicionais
  result TEXT DEFAULT 'success',      -- 'success', 'failure', 'partial'
  error_code TEXT,                    -- Error classification
  error_message TEXT,                 -- Error details
  metadata JSONB,                     -- Client info, IP, correlation_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW() -- IMMUTABLE, UTC
);
```

#### Key Features

- **Partitioned by date** (monthly) for efficient cleanup
- **Immutable** — INSERT only, no UPDATE/DELETE from app
- **Tenant-isolated** — ALL queries filtered by restaurant_id
- **RLS enforced** — Users see only their restaurant's logs
- **Indexed** for common queries (restaurant_id, created_at, event_type, actor_id)

### 2. RLS Policies

**Enfocamento:**

- READ: Users can view logs only for restaurants they belong to
- INSERT: DENIED at table level (only SECURITY DEFINER functions can insert)
- UPDATE/DELETE: ALWAYS DENIED (immutable audit trail)

### 3. RPC Functions (SECURITY DEFINER)

#### `log_audit_event()` — Generic event logger

**Signature:**

```sql
log_audit_event(
  p_restaurant_id UUID,
  p_event_type TEXT,
  p_action TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_type TEXT DEFAULT 'user',
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_result TEXT DEFAULT 'success',
  p_details JSONB DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
```

**Usage:**

```typescript
await invokeRpc("log_audit_event", {
  p_restaurant_id: restaurantId,
  p_event_type: "order_created",
  p_action: "create",
  p_actor_id: userId,
  p_resource_type: "order",
  p_resource_id: orderId,
  p_details: { table_id: tableId },
  p_metadata: { source: "app_layer" },
});
```

#### `record_auth_event()` — Auth-specific events

**Calls from authenticated context:**

```typescript
await invokeRpc('record_auth_event', {
  p_event_type: 'login_success',  // or 'logout'
  p_restaurant_id: restaurantId,
  p_metadata: { ip, user_agent, ... }
});
```

#### `log_login_failure()` — Anon-callable, before auth

**Calls from login page (no auth required):**

```typescript
await invokeRpc("log_login_failure", {
  p_identifier: "user@example.com",
  p_reason: "invalid_password",
  p_metadata: { ip, user_agent },
});
```

#### `get_audit_logs()` — Query with filters

**Retrieves historical logs (respects RLS):**

```typescript
await invokeRpc("get_audit_logs", {
  p_restaurant_id: restaurantId,
  p_from: "2026-02-01T00:00:00Z",
  p_to: "2026-02-28T23:59:59Z",
  p_event_type: "login_failure",
  p_limit: 100,
});
```

#### `purge_audit_logs_older_than()` — Controlled cleanup (service_role only)

**For retention policies (call from backend script):**

```typescript
await invokeRpc("purge_audit_logs_older_than", {
  p_cutoff_date: "2025-01-01T00:00:00Z",
  p_dry_run: false,
});
```

### 4. Automatic Triggers

The migration includes 3 triggers on critical tables:

- **gm_orders** — Logs order creation and payment status changes
- **gm_cash_registers** — Logs register open/close
- **gm_payments** — Logs payment creation

These run **automatically**, no app-layer code needed.

### 5. TypeScript Client Service (AuditLogService.ts)

**Location:** `merchant-portal/src/core/services/AuditLogService.ts`

**API:**

```typescript
// High-level event loggers
await AuditLogService.logOrderCreated(restaurantId, orderId, tableId, userId);
await AuditLogService.logPaymentRecorded(restaurantId, orderId, amount, method);
await AuditLogService.logConfigChanged(restaurantId, key, oldVal, newVal);
await AuditLogService.logLoginSuccess(restaurantId);
await AuditLogService.logLogout(restaurantId);
await AuditLogService.logLoginFailure(identifier, reason);

// Query logs
const { logs } = await AuditLogService.getLogs(restaurantId, {
  from: "2026-02-01T00:00:00Z",
  eventType: "login_failure",
  limit: 50,
});
```

**Key Notes:**

- Uses Docker Core `invokeRpc()` exclusively
- Failures logged but don't block operations
- All calls check `getBackendType() === BackendType.docker`
- Metadata automatically includes source: 'app_layer'

---

## Integration Points (Completed)

### Auth Flows

**File:** `authAudit.ts` (already existed)

The `recordLoginSuccess()`, `recordLogout()`, and `recordLoginFailure()` functions already call Docker Core. A5 provides the backend RPC implementation.

**Next step:** Verify these are called in auth flows (PhoneLoginPage, StaffProfilePage) during Phases B–C.

### Operational Flows (via Triggers)

- Order creation/payment status changes — **automatic trigger**
- Cash register open/close — **automatic trigger**
- Payments — **automatic trigger**

No additional app-layer code needed for these.

---

## How to Test

### 1. Deploy the migration

```bash
# In docker-core container
psql $DATABASE_URL < migrations/20260211_core_audit_logs.sql
```

### 2. Verify tables exist

```sql
SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'gm_audit%';
-- Should return: gm_audit_logs, gm_audit_logs_2026_02, gm_audit_logs_2026_03
```

### 3. Test RPC: log_audit_event

```sql
SELECT * FROM log_audit_event(
  p_restaurant_id := 'YOUR_RESTAURANT_ID'::uuid,
  p_event_type := 'test_event',
  p_action := 'create'
);
-- Should return { "success": true, "audit_id": "<uuid>" }
```

### 4. Test RPC: get_audit_logs

```sql
SELECT * FROM get_audit_logs(p_restaurant_id := 'YOUR_RESTAURANT_ID'::uuid);
-- Should return rows with event_type, action, created_at, etc.
```

### 5. Test from app (via invokeRpc)

```typescript
import AuditLogService from "../core/services/AuditLogService";

const result = await AuditLogService.log({
  restaurantId: "YOUR_RESTAURANT_ID",
  eventType: "test_app_layer",
  action: "create",
  details: { test: true },
});
console.log(result); // { success: true, auditId: '<uuid>' }
```

---

## Events Implemented by A5

| Category     | Event                                       | Trigger                         | Status                         |
| ------------ | ------------------------------------------- | ------------------------------- | ------------------------------ |
| **Auth**     | login_success                               | record_auth_event()             | ✅ RPC ready, app hook pending |
|              | login_failure                               | log_login_failure()             | ✅ RPC ready, app hook pending |
|              | logout                                      | record_auth_event()             | ✅ RPC ready, app hook pending |
| **Orders**   | order_created                               | Trigger on INSERT               | ✅ Automatic                   |
|              | order_payment_status_changed                | Trigger on UPDATE               | ✅ Automatic                   |
| **Payments** | payment_recorded                            | Trigger on INSERT               | ✅ Automatic                   |
| **Cash**     | cash_register_opened                        | Trigger on INSERT               | ✅ Automatic                   |
|              | cash_register_closed                        | Trigger on UPDATE               | ✅ Automatic                   |
| **Config**   | config_changed                              | App layer (via log_audit_event) | ✅ RPC ready, hook pending     |
| **User**     | user_disabled, user_reenabled, role_changed | App layer                       | ⏳ Phase B                     |
| **Admin**    | admin_access, security_incident_opened      | App layer                       | ⏳ Phase B                     |

---

## Remaining Work (Phases B–C)

### Phase B1 — Observability Integration

- Wire Trace ID propagation through invokeRpc calls
- Connect audit logs to Sentry/APM dashboards
- Real-time Dashboard to monitor audit events

### Phase C1 — Admin UI

- Create Audit Log viewer page (/admin/audit-logs or /config/audit)
- Allow filtering by event_type, date range, actor
- Export to CSV for compliance

---

## Security & Compliance

✅ **Multi-tenant isolation:** restaurant_id is required & enforced by RLS
✅ **Immutability:** No UPDATE/DELETE possible except purge() with service_role
✅ **Audit trail:** All critical operations logged with timestamp & actor
✅ **Access control:** Users see only their own restaurant's logs
✅ **Partitioning:** Ready for efficient retention policies (cleanup old partitions)

---

## References

- Spec: [AUDIT_LOG_SPEC.md](/docs/architecture/AUDIT_LOG_SPEC.md)
- Pipeline: [EVENT_PIPELINE.md](/docs/ops/EVENT_PIPELINE.md)
- Purge: [AUDIT_LOG_PURGE_RUNBOOK.md](/docs/ops/AUDIT_LOG_PURGE_RUNBOOK.md) (Phase C)
- Query guide: [AUDIT_LOG_QUERY.md](/docs/ops/AUDIT_LOG_QUERY.md) (Phase C)
