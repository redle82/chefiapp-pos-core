# Backup & Restore Runbook

> Operational guide for Supabase Postgres backup, restore, and disaster recovery.

---

## 1. Backup Strategy Overview

| Layer | Method | Frequency | Retention | Owner |
|-------|--------|-----------|-----------|-------|
| Supabase Automatic | Point-in-time recovery (PITR) | Continuous (WAL archiving) | 7 days (Pro), 28 days (Team) | Supabase |
| Supabase Daily | Full snapshot | Daily at ~02:00 UTC | 7 days | Supabase |
| Manual Pre-Migration | pg_dump via CLI | Before every migration | 90 days (stored in S3/GCS) | Engineering |
| Manual Ad-Hoc | pg_dump via CLI | On-demand | 30 days | Engineering |

### What is backed up

- All tables in the `public` schema
- RLS policies, indexes, constraints, triggers
- Functions and RPCs
- Sequences
- Stored procedures

### What is NOT backed up automatically

- Storage bucket files (images, logos) -- backed up separately via Supabase Storage policies
- Edge Functions code -- versioned in git
- Environment variables / secrets -- stored in 1Password / Vercel env

---

## 2. Pre-Migration Backup (MANDATORY)

**Before running any migration, always create a manual backup.**

### Step 1: Create backup

```bash
# Set your Supabase connection string
export SUPABASE_DB_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Create timestamped backup
pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Step 2: Verify backup integrity

```bash
# List contents without restoring
pg_restore --list "backup_20260320_143000.dump" | head -50

# Verify table count
pg_restore --list "backup_20260320_143000.dump" | grep "TABLE" | wc -l
```

### Step 3: Upload to secure storage

```bash
# Upload to S3 (or GCS)
aws s3 cp "backup_20260320_143000.dump" \
  "s3://chefiapp-backups/manual/backup_20260320_143000.dump" \
  --storage-class STANDARD_IA
```

---

## 3. Manual Backup (Schema Only)

For lightweight backups that capture schema without data:

```bash
pg_dump "$SUPABASE_DB_URL" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --file="schema_$(date +%Y%m%d_%H%M%S).sql"
```

---

## 4. Restore from Backup

### 4.1 Full Restore (to a new/clean database)

```bash
# Restore to target database
pg_restore \
  --dbname="$TARGET_DB_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  "backup_20260320_143000.dump"
```

### 4.2 Restore Specific Tables

```bash
# Restore only specific tables
pg_restore \
  --dbname="$TARGET_DB_URL" \
  --no-owner \
  --no-privileges \
  --table=gm_orders \
  --table=gm_order_items \
  --table=gm_payments \
  "backup_20260320_143000.dump"
```

### 4.3 Restore to a Staging Environment

```bash
# 1. Create staging project in Supabase (or use existing)
# 2. Get staging connection string
export STAGING_DB_URL="postgresql://postgres.[staging-ref]:[password]@..."

# 3. Restore
pg_restore \
  --dbname="$STAGING_DB_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  "backup_20260320_143000.dump"

# 4. Verify
psql "$STAGING_DB_URL" -c "SELECT count(*) FROM gm_orders;"
```

---

## 5. Point-in-Time Recovery (PITR)

Supabase Pro/Team plans include PITR. This allows restoring to any second within the retention window.

### When to use PITR

- Accidental data deletion (DROP TABLE, DELETE without WHERE)
- Corrupted data from a bad migration
- Need to recover to a state before a specific event

### How to trigger PITR

1. Go to **Supabase Dashboard** > **Project Settings** > **Database** > **Backups**
2. Select **Point-in-time Recovery**
3. Choose the target timestamp (UTC)
4. Supabase will create a **new project** with the restored data
5. Verify the restored data
6. If correct, swap connection strings or migrate data back

### Important PITR notes

- PITR creates a **new project** -- it does not overwrite the existing one
- You will get a new connection string
- Update environment variables in Vercel/app after swapping
- PITR is available only on Pro ($25/mo) and Team plans

---

## 6. Testing Backup Integrity

### Monthly backup verification checklist

```bash
# 1. Download the latest backup
aws s3 cp "s3://chefiapp-backups/manual/latest.dump" /tmp/verify.dump

# 2. Restore to a local or staging database
createdb chefiapp_backup_test
pg_restore --dbname=chefiapp_backup_test --no-owner /tmp/verify.dump

# 3. Run verification queries
psql chefiapp_backup_test <<EOF
  -- Table count
  SELECT count(*) as table_count
  FROM information_schema.tables
  WHERE table_schema = 'public';

  -- Row counts for critical tables
  SELECT 'gm_restaurants' as t, count(*) FROM gm_restaurants
  UNION ALL
  SELECT 'gm_orders', count(*) FROM gm_orders
  UNION ALL
  SELECT 'gm_payments', count(*) FROM gm_payments
  UNION ALL
  SELECT 'event_store', count(*) FROM event_store
  UNION ALL
  SELECT 'legal_seals', count(*) FROM legal_seals;

  -- Verify RLS policies exist
  SELECT schemaname, tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename;

  -- Verify indexes exist
  SELECT indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY indexname;
EOF

# 4. Clean up
dropdb chefiapp_backup_test
```

---

## 7. Disaster Recovery Plan

### Severity Levels

| Level | Description | RTO | RPO |
|-------|-------------|-----|-----|
| S1 | Complete data loss | 4 hours | 24 hours (daily backup) |
| S2 | Corrupted data (bad migration) | 1 hour | Minutes (PITR) |
| S3 | Accidental deletion (single table) | 30 min | Minutes (PITR) |
| S4 | Performance degradation | 15 min | N/A (no data loss) |

### S1: Complete Data Loss

1. **Notify stakeholders** via incident channel
2. **Assess**: Is Supabase infrastructure down or is it our data?
3. **If Supabase is down**: Wait for Supabase status updates at status.supabase.com
4. **If our data is gone**:
   a. Use PITR to restore to last known good state
   b. If PITR unavailable, restore from latest manual backup
   c. Verify restored data integrity
   d. Update connection strings
   e. Deploy and verify app functionality

### S2: Bad Migration

1. **Stop all traffic** to the affected endpoints
2. **Identify the exact migration** that caused the issue
3. **Write a rollback migration** (reverse the changes)
4. **Test rollback** on staging first
5. **Apply rollback** to production
6. **If rollback is not possible**: Use PITR to restore to pre-migration state
7. **Verify** data integrity
8. **Resume traffic**

### S3: Accidental Deletion

1. **Identify** what was deleted and when (check audit logs in `gm_audit_logs`)
2. **Use PITR** to create a restored copy
3. **Extract** only the deleted data from the restored copy
4. **Insert** the recovered data back into production
5. **Verify** referential integrity

### S4: Performance Degradation

1. **Check** Supabase dashboard for resource usage
2. **Run** `EXPLAIN ANALYZE` on slow queries
3. **Add missing indexes** (see `20260320_performance_indexes.sql`)
4. **Check** for long-running transactions: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
5. **Vacuum**: `VACUUM ANALYZE;` for tables with heavy write activity

---

## 8. Backup Automation Script

Save as `scripts/backup-production.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/tmp/chefiapp-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="chefiapp_backup_${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Backup created: ${FILENAME}"
echo "[$(date)] Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"

# Verify
TABLE_COUNT=$(pg_restore --list "${BACKUP_DIR}/${FILENAME}" | grep "TABLE DATA" | wc -l)
echo "[$(date)] Tables backed up: ${TABLE_COUNT}"

if [ "$TABLE_COUNT" -lt 20 ]; then
  echo "[$(date)] WARNING: Fewer tables than expected. Investigate!"
  exit 1
fi

echo "[$(date)] Backup verified successfully."
```

---

## 9. Key Contacts

| Role | Contact | When |
|------|---------|------|
| Engineering Lead | Internal | All incidents |
| Supabase Support | support@supabase.io | Infrastructure issues |
| Data Owner | Product Lead | Data integrity decisions |

---

## 10. Checklist Summary

- [ ] PITR enabled on Supabase project (Pro plan minimum)
- [ ] Manual backup before every migration
- [ ] Monthly backup integrity test
- [ ] Disaster recovery plan reviewed quarterly
- [ ] Connection strings documented securely
- [ ] Backup retention policy enforced (90 days manual, 7+ days PITR)
