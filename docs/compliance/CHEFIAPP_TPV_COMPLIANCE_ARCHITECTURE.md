# CHEFIAPP TPV — COMPLIANCE ARCHITECTURE

> **Classification:** INSTITUTIONAL — AUDIT SENSITIVE
> **Version:** 1.0
> **Date:** 2026-02-12
> **System Version:** 1.4.0 (`PRODUCTION_READINESS_HARDENED`)
> **Status:** DB Core Hardening v1.0 — FROZEN

---

## 1. OVERVIEW

This document describes the technical architecture that enables ChefIApp to satisfy compliance requirements for governmental audit, data protection, and operational transparency.

ChefIApp implements a **Defense-in-Depth** compliance model:

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLIANCE LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: EXPORT & REPORTING                                   │
│           (export jobs, audit mode, reconciliation reports)    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: OPERATIONS INTEGRITY                                 │
│           (backup runs, ops health, integrity snapshots)       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: LEGAL BOUNDARY                                       │
│           (legal seals, event immutability, hash chain)        │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: ACCESS CONTROL                                       │
│           (RLS, roles, SECURITY DEFINER functions)             │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: AUTHENTICATION                                       │
│           (JWT, auth.uid(), auth.jwt(), session claims)        │
├─────────────────────────────────────────────────────────────────┤
│  Layer 0: DATABASE                                             │
│           (PostgreSQL 15, triggers, constraints)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. AUTHENTICATION LAYER

### 2.1 JWT-Based Identity

All authenticated requests carry a JWT token with claims:

```json
{
  "sub": "user-uuid",
  "role": "authenticated",
  "restaurant_id": "restaurant-uuid", // optional: direct claim
  "exp": 1707782400
}
```

### 2.2 Core Auth Functions

| Function      | Purpose                          | Location      |
| ------------- | -------------------------------- | ------------- |
| `auth.uid()`  | Returns current user UUID        | `auth` schema |
| `auth.jwt()`  | Returns full JWT claims as JSONB | `auth` schema |
| `auth.role()` | Returns current role name        | `auth` schema |

These functions are called by RLS policies and SECURITY DEFINER functions to establish identity context.

### 2.3 Tenant Resolution

```sql
-- Function: current_user_restaurants()
-- Returns all restaurant_ids the current user has access to

SELECT DISTINCT ru.restaurant_id
FROM restaurant_users ru
WHERE ru.user_id = auth.uid()
  AND ru.deleted_at IS NULL

UNION ALL

SELECT (auth.jwt() ->> 'restaurant_id')::uuid
WHERE (auth.jwt() ->> 'restaurant_id') IS NOT NULL;
```

```sql
-- Function: has_restaurant_access(p_restaurant_id UUID)
-- Returns TRUE if user can access the given restaurant

SELECT EXISTS (
  SELECT 1 FROM current_user_restaurants() ur
  WHERE ur.restaurant_id = p_restaurant_id
);
```

---

## 3. ACCESS CONTROL LAYER

### 3.1 Role Hierarchy

```
postgres (superuser)
    │
    ├── service_role  ← Server-side operations (trusted)
    │
    └── authenticator
            │
            ├── authenticated  ← Logged-in users (via JWT)
            │
            └── anon           ← Unauthenticated requests
```

### 3.2 Role Permissions

| Role            | Schema Permissions        | Table Permissions                     |
| --------------- | ------------------------- | ------------------------------------- |
| `anon`          | USAGE on `public`, `auth` | SELECT on non-sensitive tables        |
| `authenticated` | USAGE on `public`, `auth` | SELECT, INSERT, UPDATE on scoped data |
| `service_role`  | USAGE on `public`, `auth` | ALL (server-side only)                |

### 3.3 Row-Level Security (RLS)

Every sensitive table has RLS enabled with policies that enforce tenant isolation:

```sql
-- Example: gm_orders
CREATE POLICY "orders_select_tenant" ON gm_orders
FOR SELECT TO authenticated
USING (has_restaurant_access(restaurant_id));

CREATE POLICY "orders_insert_tenant" ON gm_orders
FOR INSERT TO authenticated
WITH CHECK (has_restaurant_access(restaurant_id));
```

**Current RLS Status:**

| Table                        | RLS Enabled | Policy Count |
| ---------------------------- | ----------- | ------------ |
| `restaurant_users`           | ✅          | 4            |
| `gm_backup_runs`             | ✅          | 4            |
| `gm_ops_integrity_snapshots` | ✅          | 3            |
| `gm_audit_mode`              | ✅          | 2            |
| `gm_export_jobs`             | ✅          | 2            |
| `gm_fiscal_certifications`   | ✅          | 2            |

### 3.4 Role-Gated RPCs

Sensitive operations require explicit role verification:

```sql
-- Function: require_restaurant_role(p_restaurant_id, p_roles TEXT[])
-- Raises ACCESS_DENIED if user lacks required role

SELECT require_restaurant_role(
  '00000000-...',
  ARRAY['manager', 'owner']
);
```

Example usage in `request_fiscal_certification()`:

```sql
PERFORM require_restaurant_role(p_restaurant_id, ARRAY['manager', 'owner']);
-- Continues only if user has manager/owner role for this restaurant
```

---

## 4. LEGAL BOUNDARY LAYER

### 4.1 Event Sourcing

All financial operations emit events to `event_store`:

```sql
CREATE TABLE event_store (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id     UUID NOT NULL,         -- Entity ID (order, payment, etc.)
  event_type    TEXT NOT NULL,         -- e.g., 'ORDER_PAID', 'PAYMENT_CONFIRMED'
  payload       JSONB NOT NULL,        -- Event data
  sequence      BIGSERIAL,             -- Monotonic ordering
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hash          TEXT                   -- Optional: stream hash
);
```

### 4.2 Legal Seals

When an event reaches legal finality, it is sealed:

```sql
CREATE TABLE legal_seals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,           -- 'ORDER', 'PAYMENT', 'SESSION'
  entity_id       UUID NOT NULL,           -- Reference to financial entity
  seal_event_id   UUID NOT NULL,           -- Event that triggered seal
  stream_hash     TEXT NOT NULL,           -- Hash of event stream at seal
  sealed_at       TIMESTAMPTZ NOT NULL,
  sequence        BIGSERIAL,               -- Legal sequence
  financial_state TEXT NOT NULL,
  legal_state     TEXT NOT NULL
);
```

### 4.3 Immutability Enforcement

| Mechanism               | Table                        | Purpose                         |
| ----------------------- | ---------------------------- | ------------------------------- |
| Trigger guard           | `gm_backup_runs`             | Prevents unauthorized mutations |
| Trigger guard           | `gm_audit_mode`              | Prevents unauthorized mutations |
| Trigger guard           | `gm_export_jobs`             | Prevents unauthorized mutations |
| Trigger guard           | `gm_fiscal_certifications`   | Prevents unauthorized mutations |
| No UPDATE/DELETE grants | `event_store`, `legal_seals` | Structural immutability         |
| REVOKE from `anon`      | All sensitive tables         | No anonymous writes             |

### 4.4 Hash Chain Integrity

Events form a hash chain:

```
Event 1:  hash_1 = hash(payload_1)
Event 2:  hash_2 = hash(hash_1 + payload_2)
Event 3:  hash_3 = hash(hash_2 + payload_3)
...
```

Verification function (when deployed):

```sql
-- check_hash_chain_integrity(stream_id) → JSONB
-- Returns { valid: boolean, broken_at: sequence?, events_checked: int }
```

---

## 5. OPERATIONS INTEGRITY LAYER

### 5.1 Backup Management

```sql
-- Table: gm_backup_runs
-- Records all backup operations

CREATE TABLE gm_backup_runs (
  id             UUID PRIMARY KEY,
  scope          TEXT NOT NULL,            -- 'full', 'incremental', 'restaurant'
  restaurant_id  UUID,                     -- NULL for full backups
  backup_type    TEXT NOT NULL,            -- 'scheduled', 'manual', 'pre_migration'
  status         TEXT NOT NULL,            -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
  requested_by   UUID,
  requested_via  TEXT,                     -- 'api', 'scheduler', 'admin'
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  target_uri     TEXT,
  size_bytes     BIGINT,
  checksum       TEXT,
  error_code     TEXT,
  error_message  TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL
);
```

### 5.2 Integrity Snapshots

```sql
-- Table: gm_ops_integrity_snapshots
-- Point-in-time integrity verification results

INSERT INTO gm_ops_integrity_snapshots (
  restaurant_id,
  snapshot_type,
  payload
) VALUES (
  $1,
  'shift_close',
  jsonb_build_object(
    'orders_total', 12500,
    'payments_total', 12500,
    'hash_valid', true
  )
);
```

### 5.3 Ops Health Summary

```sql
-- Function: get_ops_health_summary()
-- Returns aggregate health status

SELECT get_ops_health_summary();
-- Returns:
-- {
--   "payment_health": { ... },
--   "hash_chain": { "status": "OK" | "NOT_AVAILABLE", ... },
--   "last_backup": { ... },
--   "last_integrity_snapshot": { ... }
-- }
```

---

## 6. EXPORT & REPORTING LAYER

### 6.1 Export Jobs System

```sql
-- Table: gm_export_jobs
-- Manages data export requests

CREATE TABLE gm_export_jobs (
  id               UUID PRIMARY KEY,
  restaurant_id    UUID NOT NULL,
  job_type         TEXT NOT NULL,         -- 'orders', 'payments', 'full_audit', etc.
  status           TEXT NOT NULL,         -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
  requested_by     UUID,
  parameters       JSONB,                 -- filters, date ranges, etc.
  result_uri       TEXT,                  -- location of generated export
  result_checksum  TEXT,
  error_code       TEXT,
  error_message    TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL
);
```

### 6.2 Export Job Lifecycle

```
┌──────────┐  request_export_job()  ┌─────────┐
│ (start)  │ ─────────────────────► │ PENDING │
└──────────┘                        └────┬────┘
                                         │
                    start_export_job()   │
                                         ▼
                                    ┌─────────┐
                                    │ RUNNING │
                                    └────┬────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
              ▼                          ▼                          ▼
      complete_export_job()      fail_export_job()         cancel_export_job()
              │                          │                          │
              ▼                          ▼                          ▼
        ┌───────────┐            ┌────────┐                 ┌───────────┐
        │ COMPLETED │            │ FAILED │                 │ CANCELLED │
        └───────────┘            └────────┘                 └───────────┘
```

### 6.3 Audit Mode

Restaurants can enable/disable audit mode:

```sql
-- Enable audit mode for a restaurant
SELECT enable_audit_mode('restaurant-uuid', 'system', 'Pre-audit preparation');

-- Check current status
SELECT get_audit_mode_status('restaurant-uuid');
-- Returns: { enabled: true, enabled_at: ..., enabled_by: ... }

-- Disable audit mode
SELECT disable_audit_mode('restaurant-uuid', 'system', 'Audit completed');
```

When audit mode is enabled:

- Certain mutations may be blocked or require additional verification
- All operations are logged with enhanced detail
- Export jobs may have extended retention

---

## 7. FISCAL CERTIFICATION LAYER

### 7.1 Certification State Machine

```sql
-- Table: gm_fiscal_certifications
-- Tracks per-restaurant, per-jurisdiction certification status

CREATE TABLE gm_fiscal_certifications (
  id             UUID PRIMARY KEY,
  restaurant_id  UUID NOT NULL,
  jurisdiction   TEXT NOT NULL,           -- 'PT', 'ES', 'BR', etc.
  status         TEXT NOT NULL,           -- 'PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'
  requested_by   UUID,
  requested_at   TIMESTAMPTZ,
  submitted_at   TIMESTAMPTZ,
  approved_at    TIMESTAMPTZ,
  rejected_at    TIMESTAMPTZ,
  checklist      JSONB,                   -- jurisdiction-specific requirements
  notes          TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL
);
```

### 7.2 Certification Functions

| Function                                                                                     | Purpose                           |
| -------------------------------------------------------------------------------------------- | --------------------------------- |
| `request_fiscal_certification(restaurant_id, jurisdiction, checklist, notes, requested_via)` | Initiate certification process    |
| `get_fiscal_certification_status(restaurant_id, jurisdiction)`                               | Query current certification state |
| `record_fiscal_signature(restaurant_id, signature_data)`                                     | Record external fiscal signature  |

### 7.3 Integration Point

When a fiscal module is deployed:

1. Module calls `get_fiscal_certification_status()` to verify restaurant is approved
2. Module observes `event_store` for billable events
3. Module generates jurisdiction-specific fiscal documents
4. Module records signatures via `record_fiscal_signature()`
5. Module reports results back to `gm_fiscal_certifications`

**ChefIApp Core never changes** — fiscal modules are additive.

---

## 8. COMPLIANCE MATRIX

| Requirement          | Layer | Implementation                     | Status               |
| -------------------- | ----- | ---------------------------------- | -------------------- |
| User authentication  | L1    | JWT + `auth.uid()`                 | ✅                   |
| Tenant isolation     | L2    | RLS + `has_restaurant_access()`    | ✅                   |
| Role-based access    | L2    | `require_restaurant_role()`        | ✅                   |
| Event immutability   | L3    | `event_store` + no UPDATE/DELETE   | ✅                   |
| Legal sealing        | L3    | `legal_seals` table                | ✅                   |
| Hash chain integrity | L3    | Stream hash on events              | ✅ (structure ready) |
| Backup tracking      | L4    | `gm_backup_runs`                   | ✅                   |
| Integrity snapshots  | L4    | `gm_ops_integrity_snapshots`       | ✅                   |
| Health monitoring    | L4    | `get_ops_health_summary()`         | ✅                   |
| Data export          | L5    | `gm_export_jobs` system            | ✅                   |
| Audit mode           | L5    | `gm_audit_mode` + toggle functions | ✅                   |
| Fiscal readiness     | L5    | `gm_fiscal_certifications`         | ✅                   |

---

## 9. AUDIT TRAIL SUMMARY

For any financial event, an auditor can:

1. **Identify the event** in `event_store` by `stream_id` (entity) and `event_type`
2. **Verify temporal ordering** via monotonic `sequence` column
3. **Check legal seal** in `legal_seals` for sealed events
4. **Verify hash chain** by replaying events and comparing hashes
5. **Trace access** via `auth.uid()` captured in event payload
6. **Export data** via `gm_export_jobs` for external analysis

---

## 10. DOCUMENT STATUS

| Attribute         | Value                               |
| ----------------- | ----------------------------------- |
| Last Updated      | 2026-02-12                          |
| Core Version      | 1.4.0                               |
| Hardening Version | DB Core Hardening v1.0 — FROZEN     |
| Review Cycle      | On architectural change or annually |
| Classification    | Institutional — Audit Sensitive     |

---

_Reference documents:_

- `:blueprint/04_LEGAL_BOUNDARY.md` — Legal Boundary Layer specification
- `docs/archive/LEGAL_EVIDENCE_DEFENSE.md` — Legal evidence protocol
- `docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md` — Legal scope declaration
- `docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md` — Data retention policy
