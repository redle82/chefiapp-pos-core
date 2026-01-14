# PRODUCTION RISK MATRIX

## Where ChefIApp OS Can Still Break

> **Status:** LIVING DOCUMENT  
> **Last Audit:** 2026-01-14T21:35:00+01:00  
> **Last E2E Test:** 2026-01-14T20:00-21:30+01:00

---

## 🟢 ACCEPTABLE RISKS (Managed)

| ID | Scenario | Impact | Mitigation |
|----|----------|--------|------------|
| R-001 | UI lag on slow devices | UX degradation | Graceful loading states |
| R-002 | Menu items load delay | Brief empty state | Skeleton loading |
| R-003 | Realtime subscription delay | Stale data (1-2s) | Manual refresh option |

---

## 🟡 MITIGABLE RISKS (Have Protection)

| ID | Scenario | Impact | Current Mitigation | Status |
|----|----------|--------|-------------------|--------|
| R-010 | Duplicate payment click | Double charge attempt | Idempotency key in PaymentEngine | ✅ Active |
| R-011 | Duplicate order creation | Double order | Idempotency key + OrderProtection | ✅ Active |
| R-012 | Concurrent order edit (2 waiters) | Data loss | Optimistic locking (version field) | ✅ Active |
| R-013 | Network loss mid-operation | Orphan state | Offline queue + reconciler | ✅ Active |
| R-014 | Supabase temporary outage | Operations blocked | Health check + degraded mode | ✅ Active |
| R-015 | Browser tab duplicate | Session conflict | Tab-isolated storage | ✅ Active |

---

## 🔴 CRITICAL RISKS (Need Attention)

| ID | Scenario | Impact | Current Mitigation | Gap |
|----|----------|--------|-------------------|-----|
| R-020 | Payment succeeds but order update fails | Paid but status wrong | `process_order_payment` RPC | ✅ **FIXED** (single atomic transaction) |
| R-021 | Split bill race (2 devices pay simultaneously) | Overpayment | `process_split_payment_atomic` RPC | ✅ **FIXED** (row-level lock) |
| R-022 | KDS shows order but TPV cancelled | Kitchen prepares cancelled food | Realtime subscription | **No cancellation push to KDS** |
| R-023 | Tenant switch with active order | Order assigned to wrong tenant | Gate before Domain | ✅ **FIXED** (AppDomainWrapper P0.2 guard) |
| R-024 | Stripe webhook duplicate delivery | Double confirmation | `gm_webhook_events` table | ✅ **FIXED** (event deduplication) |

---

## ☠️ UNACCEPTABLE RISKS (Must Fix)

| ID | Scenario | Impact | Current State | Required Fix |
|----|----------|--------|---------------|--------------|
| R-030 | Financial state inconsistent (paid ≠ delivered) | Audit failure | RPC + trigger | **Enforce in single transaction** |
| R-031 | Order total diverges from sum of items | Receipt wrong | Trigger recalc | **Already fixed (UI uses order.total)** |
| R-032 | Terminal state mutation (delivered → pending) | Illegal state | ✅ **FIXED** | DB trigger `prevent_terminal_order_mutation_trigger` |
| R-033 | Missing schema column `available` in `gm_products` | Product creation fails | ✅ **FIXED** | Migration `fix_products_available_column` |
| R-034 | Missing schema column `category_id` in `gm_products` | Product-category link broken | ✅ **FIXED** | Migration `add_category_id_to_products` |

---

## 📊 FAILURE MODE ANALYSIS

### 1. Network Failures

| Failure | Current Behavior | Risk Level |
|---------|------------------|------------|
| Complete offline | Queued in IndexedDB | 🟡 Mitigable |
| Intermittent | Retry with backoff | 🟡 Mitigable |
| Timeout mid-payment | Idempotency key | 🟡 Mitigable |
| Realtime disconnect | Manual refresh needed | 🟢 Acceptable |

### 2. Concurrency

| Failure | Current Behavior | Risk Level |
|---------|------------------|------------|
| Same order, 2 devices | Version lock → conflict error | 🟡 Mitigable |
| Same table, 2 orders | FK constraint rejects | 🟢 Acceptable |
| Split bill race | ⚠️ No atomic check | 🔴 Critical |

### 3. Session/Tenant

| Failure | Current Behavior | Risk Level |
|---------|------------------|------------|
| Session expires | Re-auth redirect | 🟢 Acceptable |
| Tenant not found | FlowGate blocks | 🟢 Acceptable |
| Tenant switch mid-order | ✅ P0.2 guard blocks | � Mitigable |

### 4. External Services

| Failure | Current Behavior | Risk Level |
|---------|------------------|------------|
| Stripe down | Payment blocked | 🟢 Acceptable (cash only) |
| Supabase down | Operations blocked | 🟡 Mitigable (offline mode) |
| Fiscal service down | Non-blocking queue | 🟢 Acceptable |

---

## 🎯 PRIORITY FIXES

### P0 (Before Launch) — ✅ ALL IMPLEMENTED

1. **R-032**: ✅ DB trigger to prevent terminal state mutation
   - Migration: `20260114194051_p0_terminal_state_block.sql`
   - Trigger: `prevent_terminal_order_mutation_trigger`
   - Function: `gm_block_terminal_order_mutation()`

2. **R-023**: ✅ Guard in AppDomainWrapper for tenant switch
   - File: `AppDomainWrapper.tsx`
   - Log: `TENANT_SWITCH_BLOCKED` when blocked
   - Checks: `activeOrderId`, `offline_queue_count`

3. **R-033**: ✅ Schema fix for `available` column
   - Migration: `20260114195816_fix_products_available_column.sql`
   - Discovered: E2E test 2026-01-14

4. **R-034**: ✅ Schema fix for `category_id` column
   - Migration: `20260114202123_add_category_id_to_products.sql`
   - Discovered: E2E test 2026-01-14
   - Added FK constraint to `gm_menu_categories`

### P1 (Week 1) — ✅ IMPLEMENTED

1. **R-021**: ✅ Atomic balance check for split bill
   - Migration: `20260114194124_p1_atomic_split_bill.sql`
   - RPC: `process_split_payment_atomic`

2. **R-022**: ⚠️ Push cancellation to KDS via realtime (OPEN)

### P2 (Week 2-4) — ✅ IMPLEMENTED

1. **R-024**: ✅ Webhook deduplication
   - Migration: `20260114194148_p2_webhook_deduplication.sql`
   - Table: `gm_webhook_events`

2. **R-020**: ✅ Ensure payment+order in single transaction
   - Already atomic via `process_order_payment` RPC

---

## ✅ EXISTING PROTECTIONS (Verified)

| Protection | Location | Status |
|------------|----------|--------|
| Idempotency keys | PaymentEngine, OrderEngine | ✅ |
| Optimistic locking | OrderEngine (version field) | ✅ |
| Offline queue | OrderEngineOffline, OfflineSync | ✅ |
| Tab isolation | TabIsolatedStorage | ✅ |
| Gate before Domain | App.tsx → AppDomainWrapper | ✅ |
| UI never calculates | INV-006 enforced | ✅ |
| State machine compliance | DOM-001 → DOM-003 | ✅ |
| Audit logging | logAuditEvent | ✅ |
