# DATA RETENTION AND BACKUP POLICY

> **Classification:** INSTITUTIONAL — AUDIT SENSITIVE
> **Version:** 1.0
> **Date:** 2026-02-12
> **System Version:** 1.4.0 (`PRODUCTION_READINESS_HARDENED`)
> **Status:** DB Core Hardening v1.0 — FROZEN

---

## 1. SCOPE

This policy defines:

- What data is retained and for how long
- How backups are performed and verified
- How data exports/deletions are handled
- Jurisdictional considerations

This policy applies to all ChefIApp POS Core deployments operating in production.

---

## 2. DATA CLASSIFICATION

### 2.1 Categories

| Category          | Description              | Examples                                     |
| ----------------- | ------------------------ | -------------------------------------------- |
| **Operational**   | Core business data       | Orders, payments, stock movements            |
| **Financial**     | Monetary records         | Payment logs, shift reports, register states |
| **Legal**         | Sealed/immutable records | Legal seals, event store, audit logs         |
| **Personal**      | PII / Staff data         | User emails, names, roles                    |
| **Configuration** | System settings          | Restaurant config, menu structure            |

### 2.2 Sensitivity Levels

| Level           | Handling                       | Examples                                               |
| --------------- | ------------------------------ | ------------------------------------------------------ |
| **Critical**    | Immutable, never deletable     | `event_store`, `legal_seals`, `gm_payment_audit_logs`  |
| **Sensitive**   | Restricted access, soft-delete | `restaurant_users`, `gm_staff`, `gm_restaurant_people` |
| **Operational** | Normal access, archivable      | `gm_orders`, `gm_payments`, `gm_reservations`          |
| **Ephemeral**   | Short-lived, auto-expiring     | `gm_export_jobs` (after `expires_at`)                  |

---

## 3. RETENTION PERIODS

### 3.1 Regulatory Minimums

| Jurisdiction       | Financial Records    | Tax Records | PII (staff/customer) |
| ------------------ | -------------------- | ----------- | -------------------- |
| **Portugal (AT)**  | 10 years             | 10 years    | RGPD: as needed      |
| **Spain (AEAT)**   | 6 years (commercial) | 4-6 years   | RGPD: as needed      |
| **EU General**     | Varies               | Varies      | GDPR: minimal        |
| **Brazil (SEFAZ)** | 5 years              | 5 years     | LGPD: as needed      |
| **USA**            | 7 years (IRS)        | 7 years     | Varies by state      |

### 3.2 ChefIApp Policy (Recommended)

| Data Type                    | Minimum Retention                | Maximum Retention | Notes                          |
| ---------------------------- | -------------------------------- | ----------------- | ------------------------------ |
| `event_store`                | **Forever**                      | —                 | Immutable by design            |
| `legal_seals`                | **Forever**                      | —                 | Immutable by design            |
| `gm_payment_audit_logs`      | **10 years**                     | —                 | Append-only                    |
| `gm_orders`                  | **7 years**                      | —                 | Financial records              |
| `gm_payments`                | **7 years**                      | —                 | Financial records              |
| `gm_cash_registers`          | **7 years**                      | —                 | Shift records                  |
| `shift_logs`                 | **7 years**                      | —                 | Operational audit              |
| `gm_backup_runs`             | **3 years**                      | —                 | Ops tracking                   |
| `gm_ops_integrity_snapshots` | **3 years**                      | —                 | Ops tracking                   |
| `gm_export_jobs`             | 90 days after `expires_at`       | 1 year            | Auto-cleanup eligible          |
| `gm_fiscal_certifications`   | **10 years**                     | —                 | Regulatory compliance          |
| `restaurant_users`           | Until deletion request + 30 days | —                 | Soft-delete, then purge        |
| `gm_reservations`            | **2 years**                      | —                 | Unless legally required longer |

### 3.3 Immutable Records

The following tables **MUST NEVER** have rows deleted:

| Table                   | Reason                                   |
| ----------------------- | ---------------------------------------- |
| `event_store`           | Source of truth for all financial events |
| `legal_seals`           | Legal finality records                   |
| `gm_payment_audit_logs` | Financial audit trail                    |

**Technical enforcement:**

- No DELETE grants to application roles
- Trigger guards prevent mutation
- RLS policies restrict access

---

## 4. BACKUP POLICY

### 4.1 Backup Types

| Type              | Frequency                | Scope           | Retention       |
| ----------------- | ------------------------ | --------------- | --------------- |
| **Full**          | Daily (minimum)          | Entire database | 30 days rolling |
| **Incremental**   | Hourly (recommended)     | WAL segments    | 7 days rolling  |
| **Pre-migration** | Before any schema change | Entire database | 90 days         |
| **On-demand**     | As requested             | Configurable    | As specified    |

### 4.2 Backup Infrastructure

ChefIApp tracks all backups in `gm_backup_runs`:

```sql
-- Start a backup
SELECT start_backup_run(
  'full',                    -- scope
  NULL,                      -- restaurant_id (NULL = all)
  'scheduled',               -- backup_type
  'service_role'::uuid,      -- requested_by (system user)
  'scheduler',               -- requested_via
  jsonb_build_object('trigger', 'daily_cron')
);

-- Complete the backup
SELECT complete_backup_run(
  backup_id,
  's3://backups/2026-02-12.tar.gz',
  1234567890,                -- size_bytes
  'sha256:abc123...'         -- checksum
);
```

### 4.3 Backup Verification

Every backup must:

1. **Complete successfully** — `status = 'COMPLETED'`
2. **Have a checksum** — `checksum IS NOT NULL`
3. **Be restorable** — Periodic restore tests (quarterly recommended)
4. **Be stored securely** — Encrypted at rest, access-controlled

### 4.4 Backup Locations

| Environment | Primary                 | Secondary          |
| ----------- | ----------------------- | ------------------ |
| Production  | Encrypted cloud storage | Geographic replica |
| Staging     | Cloud storage           | —                  |
| Development | Local only              | —                  |

---

## 5. DATA EXPORT

### 5.1 Export Types

| Type            | Contents                               | Use Case          |
| --------------- | -------------------------------------- | ----------------- |
| `full_audit`    | All financial records for a restaurant | External audit    |
| `orders`        | Order history                          | Business analysis |
| `payments`      | Payment history                        | Reconciliation    |
| `gdpr_subject`  | All data for a specific user           | GDPR/RGPD request |
| `fiscal_period` | Records for tax period                 | Tax filing        |

### 5.2 Export Process

```sql
-- Request an export
SELECT request_export_job(
  'restaurant-uuid',
  'full_audit',
  jsonb_build_object(
    'start_date', '2025-01-01',
    'end_date', '2025-12-31'
  ),
  'manager-uuid',
  'api'
);

-- Worker processes the job
SELECT start_export_job(job_id);
-- ... generate export file ...
SELECT complete_export_job(job_id, 'https://storage/export.zip', 'sha256:...');
```

### 5.3 Export Security

- Exports are encrypted at rest
- Download links expire after `expires_at`
- Access logged in `gm_export_jobs`
- Only users with `has_restaurant_access()` can request

---

## 6. DATA DELETION

### 6.1 What Can Be Deleted

| Category                             | Deletable? | Method                                   |
| ------------------------------------ | ---------- | ---------------------------------------- |
| User membership (`restaurant_users`) | ✅         | Soft-delete (`deleted_at`)               |
| Reservations older than retention    | ✅         | Hard delete after 2+ years               |
| Expired export jobs                  | ✅         | Hard delete after `expires_at + 90 days` |
| Orders/Payments                      | ❌         | Never (financial records)                |
| Event store                          | ❌         | Never (immutable)                        |
| Legal seals                          | ❌         | Never (immutable)                        |

### 6.2 GDPR/RGPD Right to Erasure

When a data subject requests erasure:

1. **Verify identity** — Confirm the request is legitimate
2. **Identify data** — Query all tables for user's `user_id`
3. **Assess retention requirements** — Some data must be retained (financial records)
4. **Anonymize where possible** — Replace PII with anonymized values
5. **Delete membership** — Soft-delete `restaurant_users` entry
6. **Document action** — Log the erasure request and actions taken

**What CANNOT be deleted:**

- Orders placed by the user (financial records)
- Payments processed by the user (financial audit)
- Events in `event_store` (immutable)

**What CAN be anonymized:**

- User name → "User [DELETED]"
- Email → "[redacted]@deleted"
- Personal notes → "[REDACTED]"

### 6.3 Anonymization Function (Recommended Implementation)

```sql
-- anonymize_user_data(user_id UUID, reason TEXT)
-- Anonymizes PII while preserving financial record integrity

CREATE OR REPLACE FUNCTION anonymize_user_data(
  p_user_id UUID,
  p_reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_tables JSONB := '[]'::jsonb;
BEGIN
  -- Soft-delete from restaurant_users
  UPDATE restaurant_users
  SET deleted_at = NOW()
  WHERE user_id = p_user_id AND deleted_at IS NULL;

  -- Anonymize in gm_staff if exists
  UPDATE gm_staff
  SET
    name = '[DELETED USER]',
    email = p_user_id::text || '@deleted.local',
    phone = NULL,
    notes = '[REDACTED]'
  WHERE user_id = p_user_id;

  -- Log the action
  INSERT INTO event_store (stream_id, event_type, payload)
  VALUES (
    p_user_id,
    'USER_ANONYMIZED',
    jsonb_build_object('reason', p_reason, 'at', NOW())
  );

  RETURN jsonb_build_object(
    'status', 'COMPLETED',
    'user_id', p_user_id,
    'reason', p_reason,
    'at', NOW()
  );
END;
$$;
```

---

## 7. DISASTER RECOVERY

### 7.1 Recovery Point Objective (RPO)

| Environment | RPO        | Meaning                 |
| ----------- | ---------- | ----------------------- |
| Production  | **1 hour** | Max 1 hour of data loss |
| Staging     | 24 hours   | Max 1 day of data loss  |

### 7.2 Recovery Time Objective (RTO)

| Environment | RTO         | Meaning                        |
| ----------- | ----------- | ------------------------------ |
| Production  | **4 hours** | System restored within 4 hours |
| Staging     | 24 hours    | System restored within 1 day   |

### 7.3 Recovery Procedure

1. **Identify failure** — Ops alert or manual detection
2. **Assess scope** — Full loss vs. partial corruption
3. **Select backup** — Most recent valid backup before incident
4. **Restore database** — From backup file
5. **Apply WAL** — For point-in-time recovery (if available)
6. **Verify integrity** — Run `get_ops_health_summary()`
7. **Resume operations** — Notify stakeholders

### 7.4 Recovery Testing

- **Monthly:** Restore to test environment, verify data integrity
- **Quarterly:** Full disaster simulation with RTO measurement
- **Annually:** Third-party audit of backup/recovery process

---

## 8. INTEGRITY VERIFICATION

### 8.1 Continuous Monitoring

```sql
-- Check system health
SELECT get_ops_health_summary();

-- Check payment system health
SELECT get_payment_health();

-- Record integrity snapshot
SELECT record_ops_integrity_snapshot(
  'restaurant-uuid',
  'daily_check',
  jsonb_build_object(
    'orders_count', 150,
    'payments_total', 1234500,
    'hash_valid', true
  )
);
```

### 8.2 Hash Chain Verification

For critical audit periods:

```sql
-- Verify event stream integrity
SELECT check_hash_chain_integrity('order-stream-uuid');
-- Returns: { valid: true, events_checked: 47, broken_at: null }
```

If broken:

```json
{
  "valid": false,
  "events_checked": 47,
  "broken_at": 23,
  "expected": "abc...",
  "found": "xyz..."
}
```

### 8.3 Reconciliation Reports

```sql
-- Generate shift reconciliation
SELECT reconcile_shift_v2(
  'cash-register-uuid',
  'fiscal-snapshot-uuid',  -- optional
  'manager-uuid',
  'End of day reconciliation'
);
```

---

## 9. COMPLIANCE CHECKLIST

### 9.1 Daily Operations

- [ ] Automated backups running (`gm_backup_runs` has today's entry)
- [ ] No failed backups in last 24h (`status != 'FAILED'`)
- [ ] Payment health OK (`get_payment_health()` returns valid)

### 9.2 Weekly Operations

- [ ] Review export job status (`gm_export_jobs`)
- [ ] Check integrity snapshots (`gm_ops_integrity_snapshots`)
- [ ] Verify backup checksums

### 9.3 Monthly Operations

- [ ] Test backup restoration
- [ ] Review and purge expired exports
- [ ] Check for pending GDPR requests

### 9.4 Quarterly Operations

- [ ] Full disaster recovery test
- [ ] Review retention policy compliance
- [ ] Audit access logs

### 9.5 Annual Operations

- [ ] External audit (if required)
- [ ] Policy document review
- [ ] Retention period expiration processing

---

## 10. DOCUMENT CONTROL

| Attribute         | Value                           |
| ----------------- | ------------------------------- |
| Last Updated      | 2026-02-12                      |
| Core Version      | 1.4.0                           |
| Hardening Version | DB Core Hardening v1.0 — FROZEN |
| Review Cycle      | Annually or on major change     |
| Owner             | ChefIApp Engineering            |
| Classification    | Institutional — Audit Sensitive |

---

_Related documents:_

- `docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md`
- `docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md`
- `:blueprint/04_LEGAL_BOUNDARY.md`
- `SECURITY.md`
