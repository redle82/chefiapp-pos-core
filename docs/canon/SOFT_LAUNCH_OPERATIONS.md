# ChefIApp OS — Soft Launch Operations Manual

> **Status:** ACTIVE  
> **Effective Date:** 2026-01-14  
> **System State:** OPERATIONAL — SOVEREIGN / OBSERVATION MODE

---

## 🧘 PHILOSOPHY

> "During soft launch, humans are part of the system.  
> Observation is more valuable than correction."

**Mode:** Architecture frozen. System observed, not expanded.  
**Focus:** Telemetry over intuition. Silence over noise.

## 📋 DAILY CHECKLIST

### A. Opening Ritual (Before First Order)

#### 1. Database / Migrations

```bash
# Day 0 only (or when new migrations)
supabase migration push
```

Verify triggers active:

- [ ] `prevent_terminal_order_mutation_trigger`
- [ ] `process_split_payment_atomic`
- [ ] `gm_webhook_events` table exists

#### 2. CI Audit

```bash
npm run audit:all
```

- [ ] ARCHITECTURE GUARDIAN: ALL PASS
- [ ] DOMAIN GUARDIAN: ALL PASS

#### 3. Context Sanity

- [ ] Login successful
- [ ] Tenant resolves once (no loop)
- [ ] Navigate 5 /app/* routes without error

#### 4. Operation Sanity

- [ ] Open cash register
- [ ] Load menu
- [ ] Create test order
- [ ] Send to KDS
- [ ] Cancel a test order
- [ ] Process test payment (cash)

**If any fail:** FREEZE — do not open for service.

---

### B. During Service (Every 30-60 min)

- [ ] KDS receiving new orders
- [ ] TPV realtime active (not stale)
- [ ] No duplicate orders/payments

**Emergency Rules:**

| Situation | Action |
|-----------|--------|
| Realtime down | Manual refresh + log event |
| Cash register frozen | Open degraded (cash-only) + log incident |

---

### C. Closing Ritual (Post-Service)

#### 1. Data Verification

```sql
-- Check: paid ≠ delivered = 0
SELECT COUNT(*) FROM gm_orders 
WHERE payment_status = 'paid' AND status != 'delivered';
```

#### 2. Incident Review

- [ ] List warnings/errors of the day
- [ ] Tag R-IDs if applicable

#### 3. Memory Pack

| Question | Answer |
|----------|--------|
| Where it hurt | |
| Where it shined | |
| New risk observed | |

---

## 🔔 PRODUCTION ALERTS

### Alert 1: Law Violation (DB)

**Trigger:** Exception containing `TERMINAL_STATE_IMMUTABLE`  
**Action:** Block operation + log incident  
**Severity:** P0

### Alert 2: Realtime Blind (KDS/TPV)

**Trigger:** Channel disconnect > 2 minutes  
**Action:** Show "Degraded Mode" banner + refresh button  
**Severity:** P1

### Alert 3: Duplicate Detection

**Trigger:** Idempotency conflict repeated  
**Action:** Show "Already processed" in UI + log  
**Severity:** P2

### Alert 4: Context Guard

**Trigger:** Tenant switch with active state  
**Action:** Block + show reason (OperationalStateGuard)  
**Severity:** P1

---

## 🏁 STABILITY CRITERIA

### Stable v1 (Soft Launch Approved)

- [ ] 7 consecutive days operational
- [ ] 0 P0 incidents
- [ ] 0 financial inconsistencies (paid ≠ delivered)
- [ ] < 3 P1 incidents per week
- [ ] Realtime OK or controlled degradation

### Stable v2 (Ready for Scale)

- [ ] 14-21 days operational
- [ ] Split bill without anomalies
- [ ] At least 1 peak simulation
- [ ] R-022 (KDS cancel) fixed or proven mitigation

---

## 🍳 R-022 MITIGATION (Until Fix)

### Operational (Now)

- KDS does not display `canceled` orders
- KDS has visible manual refresh
- TPV on cancel shows: "Cancelado — confirme na cozinha"

### Technical Fix (Week 1)

1. Realtime event on `order_updated` where status → `canceled`
2. KDS handler:
   - Remove card
   - Play "canceled" sound
   - Log locally
