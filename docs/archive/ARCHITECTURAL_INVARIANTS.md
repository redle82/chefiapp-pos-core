# ARCHITECTURAL INVARIANTS

## ChefIApp OS — Laws That Cannot Be Violated

> **Status:** LOCKED  
> **Last Updated:** 2026-01-14  
> **Enforcement:** CI + Static Analysis + Human Review

---

## 🏛️ PURPOSE

This document defines **invariants** — rules that must NEVER be violated.  
If any invariant is broken, the system is in an illegal state.

These are not guidelines. They are **executable laws**.

---

## ⚖️ THE FIVE AXIOMS

### AXIOM 1: CAUSAL ORDERING
>
> No layer executes before its parent is stable.

```
L0 Runtime → L1 Kernel → L2 Bootstrap → L3 Gates → L4 Domain → L5 Views
```

**Violation:** Component rendering before Gate resolves.  
**Detection:** ESLint rule, runtime assertion.

---

### AXIOM 2: SEALED CONTEXT
>
> No operation is valid without sealed operational context.

Context = `{ user, tenant, session }`

**Violation:** Domain operating with null tenantId.  
**Detection:** Runtime throw, TypeScript strict null checks.

---

### AXIOM 3: SINGLE SOURCE OF TRUTH
>
> The database is the only System of Record.

```
Database (Postgres + Triggers) = TRUTH
Domain = Operational Mirror
UI = Projection
```

**Violation:** UI making authoritative decisions.  
**Detection:** Code review, architectural audit.

---

### AXIOM 4: FINANCIAL IRREVERSIBILITY
>
> Financial states are terminal.

`PAID → (nothing)` — No mutation allowed.

**Violation:** Updating a paid order's amount.  
**Detection:** Database triggers, domain guards.

---

### AXIOM 5: DOCUMENT AS CONTRACT
>
> A document exists only if verifiable, executable, and failure-detectable.

**Violation:** Document with no enforcement.  
**Detection:** `audit:laws` CI job.

---

## 🔒 INVARIANTS (ENFORCEABLE RULES)

### INV-001: Domain Never Reads Storage Directly

```
❌ FORBIDDEN:
   getTabIsolated('chefiapp_restaurant_id') inside Domain layer

✅ REQUIRED:
   Domain receives restaurantId via props/context from Gate layer
```

**Files affected:** `OrderContext*.tsx`, `useMenuItems.ts`, `TableContext.tsx`  
**Enforcement:** ESLint rule `no-storage-in-domain`

---

### INV-002: No Hook Resolves Tenant

```
❌ FORBIDDEN:
   useTenant() called outside of components wrapped by TenantProvider

✅ REQUIRED:
   Tenant resolution happens ONLY in FlowGate
   Components receive tenant from context
```

**Enforcement:** React context boundary check

---

### INV-003: Gate Before Domain

```
❌ FORBIDDEN:
   <OrderProvider>
     <TenantProvider>  // Domain wrapping Gate
     
✅ REQUIRED:
   <TenantProvider>    // Gate first
     <AppDomainWrapper>
       <OrderProvider> // Domain inside
```

**Enforcement:** Provider hierarchy lint rule

---

### INV-004: Tenant ACTIVE Is Terminal

```
❌ FORBIDDEN:
   Re-resolving tenant when status === 'ACTIVE'

✅ REQUIRED:
   Once sealed, tenant remains until:
   - User logout
   - Explicit tenant switch
   - Session expiry
```

**Enforcement:** FlowGate sovereignty check

---

### INV-005: No Payment Without Trigger Validation

```
❌ FORBIDDEN:
   Direct INSERT into gm_payments without trigger

✅ REQUIRED:
   All payments go through process_order_payment RPC
   Database trigger validates:
   - Order exists
   - Cash register open
   - Amount matches
```

**Enforcement:** Database constraint, RPC-only policy

---

### INV-006: UI Never Decides State

```
❌ FORBIDDEN:
   UI component calculating order total
   UI component determining user permissions

✅ REQUIRED:
   UI displays what Domain provides
   UI dispatches intents, never decisions
```

**Enforcement:** Code review, separation audit

---

### INV-007: No Implicit State Transitions

```
❌ FORBIDDEN:
   Order status changing without explicit action
   Silent state mutations in effects

✅ REQUIRED:
   All state changes via explicit action
   All transitions logged and auditable
```

**Enforcement:** State machine enforcement

---

## 🔥 CI ENFORCEMENT

### `audit:architecture`

```bash
# Checks all invariants
npm run audit:architecture

# Fails if:
# - Domain imports storage directly
# - Provider hierarchy is wrong
# - Gate is bypassed
```

### ESLint Rules (Proposed)

```javascript
// .eslintrc.js
rules: {
  'chefiapp/no-storage-in-domain': 'error',
  'chefiapp/gate-before-domain': 'error',
  'chefiapp/no-tenant-reresolution': 'error',
}
```

---

## 📊 INVARIANT STATUS

| ID | Name | Status | Enforcement |
|----|------|--------|-------------|
| INV-001 | Domain Never Reads Storage | ✅ FIXED | Manual |
| INV-002 | No Hook Resolves Tenant | ✅ ACTIVE | Runtime |
| INV-003 | Gate Before Domain | ✅ FIXED | Manual |
| INV-004 | Tenant ACTIVE Terminal | ✅ ACTIVE | FlowGate |
| INV-005 | Payment Trigger Only | ✅ ACTIVE | Database |
| INV-006 | UI Never Decides | ✅ ENFORCED | CI |
| INV-007 | No Implicit Transitions | ⚠️ PARTIAL | Review |

---

## 🧭 WHEN TO UPDATE THIS DOCUMENT

1. **New invariant discovered** → Add with `PROPOSED` status
2. **Invariant enforced in CI** → Update status to `ENFORCED`
3. **Invariant violated in production** → Post-mortem, strengthen enforcement

---

## 🏁 CLOSING STATEMENT

> These invariants are not aspirational.  
> They describe **what the system already enforces**.  
> Breaking them is not a bug — it's a **system violation**.

The architecture is now self-defending.
