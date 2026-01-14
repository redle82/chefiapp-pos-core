# Day 0 Activation Protocol

> **Duration:** 15 minutes  
> **Prerequisite:** Migrations deployed

---

## ⏱️ MINUTE 0-3: Database Seal

```bash
cd chefiapp-pos-core

# Deploy all pending migrations
supabase migration push

# Verify (should show 0 pending)
supabase migration list
```

**Expected:** 3 migrations applied:

- `20260114190000_p0_terminal_state_block.sql`
- `20260114191000_p1_atomic_split_bill.sql`
- `20260114192000_p2_webhook_deduplication.sql`

---

## ⏱️ MINUTE 3-5: Audit Verification

```bash
cd merchant-portal
npm run audit:all
```

**Expected:**

```
🏛️ ARCHITECTURE GUARDIAN   ✓ ALL PASS
🔄 DOMAIN GUARDIAN         ✓ ALL PASS
```

**If FAIL:** Stop. Fix violations first.

---

## ⏱️ MINUTE 5-7: Application Start

```bash
npm run dev
```

Open: <http://localhost:5173>

---

## ⏱️ MINUTE 7-10: Context Verification

1. [ ] Login with owner account
2. [ ] Confirm tenant resolves (no redirect loop)
3. [ ] Navigate to `/app/dashboard`
4. [ ] Navigate to `/app/tpv`
5. [ ] Navigate to `/app/kds`

**If any route fails:** Check console for Gate errors.

---

## ⏱️ MINUTE 10-15: Operation Sanity

### Cash Register

1. [ ] Open cash register (TPV)
2. [ ] Confirm status: OPEN

### Order Flow

1. [ ] Create order with 2 items
2. [ ] Send to kitchen (status → preparing)
3. [ ] Check KDS shows order
4. [ ] Mark ready (status → ready)
5. [ ] Pay order (cash)
6. [ ] Confirm status → delivered

### Guard Tests

1. [ ] Create new order
2. [ ] Try to close browser tab
3. [ ] Confirm: OperationalStateGuard should warn

### Terminal State Test

1. [ ] Find the delivered order
2. [ ] Try to cancel it (should fail)
3. [ ] Confirm: DB trigger blocks mutation

---

## ✅ ACTIVATION COMPLETE

If all checks pass:

```
🟢 SYSTEM ACTIVATED
   Date: ___________
   Operator: ___________
   Status: LIVE (Soft Launch)
```

### Activation Snapshot (Forensic Record)

```
git commit: _______________
migrations head: _______________
tenant_id: _______________
```

### Audit Log Verification

```sql
-- Confirm system is logging events
SELECT * FROM gm_audit_logs
WHERE event_type LIKE '%ORDER%'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** Recent entries showing order operations.

---

## 🚨 ROLLBACK (If Needed)

```bash
# Return to safe state
supabase migration down 3

# Or simply:
# Stop the dev server and investigate
```

---

**Next:** Follow SOFT_LAUNCH_OPERATIONS.md for daily checklist.
