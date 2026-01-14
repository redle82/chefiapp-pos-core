# ChefIApp OS

## Technical Whitepaper v1.0

> **A Restaurant Operating System with Banking-Grade Reliability**

---

## Executive Summary

ChefIApp OS is not a point-of-sale application. It is a **restaurant operating system** built on the architectural principles of critical infrastructure: deterministic boot sequences, enforced invariants, formalized state machines, and database-as-judge authority.

This document describes the technical architecture that enables ChefIApp to provide guarantees typically reserved for financial systems:

- **No illegal state transitions** — mathematically impossible by design
- **No data loss under concurrency** — atomic operations with pessimistic locking
- **No duplicate processing** — idempotency at every boundary
- **No silent failures** — audit logging with CI enforcement

---

## 1. Layered Deterministic Architecture

ChefIApp follows a strict boot order where each layer depends on the previous:

```
┌─────────────────────────────────────────────────────────────┐
│                     L5: VIEWS (Projection)                   │
│              TPV • KDS • AppStaff • Web                      │
│                  UI = f(DomainState)                         │
├─────────────────────────────────────────────────────────────┤
│                     L4: DOMAIN (Brain)                       │
│         OrderEngine • PaymentEngine • State Machines         │
│              Explicit transitions only                       │
├─────────────────────────────────────────────────────────────┤
│                     L3: GATES (Sovereignty)                  │
│      FlowGate • TenantProvider • OperationalStateGuard       │
│              Context resolution & blocking                   │
├─────────────────────────────────────────────────────────────┤
│                     L2: BOOTSTRAP                            │
│              App.tsx • Provider hierarchy                    │
├─────────────────────────────────────────────────────────────┤
│                     L1: KERNEL                               │
│              Logger • Types • Configuration                  │
└─────────────────────────────────────────────────────────────┘
```

### Design Principle

> Nothing executes before its dependencies resolve.
> If L3 fails, L4 and L5 never mount.

This eliminates entire categories of bugs:

- Race conditions during initialization
- Undefined context access
- Partial state renders

---

## 2. Enforced Invariants

Invariants are not guidelines — they are **executable laws** verified by CI, runtime guards, and database constraints.

| Code | Invariant | Enforcement Mechanism |
|------|-----------|----------------------|
| INV-001 | Domain never reads storage directly | `audit-architecture.cjs` |
| INV-003 | Gate resolves before Domain mounts | Provider hierarchy |
| INV-006 | UI never calculates financial values | `audit-architecture.cjs` |
| INV-007 | No implicit state transitions | State machine enforcement |
| DOM-001 | No direct status assignment | `audit-domain.cjs` |
| DOM-002 | No setState with status field | `audit-domain.cjs` |
| DOM-003 | No useEffect status mutations | `audit-domain.cjs` |

### Violation Response

```
Invariant Violated → CI Fails → Merge Blocked → Developer Fix Required
```

There is no path to production for code that violates architectural laws.

---

## 3. Formalized State Machines

Every entity with lifecycle follows a canonical state machine with:

- **Explicit states** — no ambiguity
- **Explicit transitions** — no hidden paths
- **Terminal state immutability** — database-enforced

### Order State Machine

```
         ┌──────────────────────────────────────────┐
         │                                          │
         ▼                                          │
    ┌─────────┐     ┌───────────┐     ┌───────┐     │
    │ pending │────▶│ preparing │────▶│ ready │─────┤
    └────┬────┘     └───────────┘     └───┬───┘     │
         │                                │         │
         │                                ▼         │
         │                          ┌───────────┐   │
         └─────────────────────────▶│ delivered │◀──┘
                                    └───────────┘
                                         ▲
         ┌───────────┐                   │
         │ canceled  │◀──────────────────┘
         └───────────┘
              
Terminal States: delivered, canceled (IMMUTABLE)
```

### Payment State Machine

```
    ┌─────────┐     ┌────────────────┐     ┌──────┐
    │ PENDING │────▶│ PARTIALLY_PAID │────▶│ PAID │
    └────┬────┘     └────────────────┘     └──────┘
         │                                      
         ▼                                      
    ┌────────┐                                  
    │ FAILED │                                  
    └────────┘                                  

Terminal State: PAID (IMMUTABLE)
```

### Database Enforcement

```sql
CREATE TRIGGER prevent_terminal_order_mutation_trigger
BEFORE UPDATE ON gm_orders
FOR EACH ROW
WHEN (OLD.status IN ('delivered', 'canceled'))
EXECUTE FUNCTION gm_block_terminal_order_mutation();
```

Any attempt to modify a terminal order raises an exception at the database level.

---

## 4. Security Model

ChefIApp implements a three-tier authority model:

```
┌─────────────────────────────────────────────────────────────┐
│                    GATE (Police)                            │
│                                                             │
│  • Resolves identity and tenant                             │
│  • Blocks invalid access                                    │
│  • Guards operational state transitions                     │
│                                                             │
│  If Gate fails → Nothing below mounts                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   DOMAIN (Brain)                            │
│                                                             │
│  • Manages business logic                                   │
│  • Executes state transitions                               │
│  • Never reads storage directly                             │
│                                                             │
│  Domain proposes → Database decides                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (Judge)                           │
│                                                             │
│  • Final authority on all state                             │
│  • Triggers enforce immutability                            │
│  • Constraints prevent illegal data                         │
│                                                             │
│  Code cannot override database decisions                    │
└─────────────────────────────────────────────────────────────┘
```

### Core Principle

> The database is the final arbiter of truth.
> No amount of client-side code can override database constraints.

---

## 5. Production Guarantees

### Concurrency Safety

| Scenario | Protection |
|----------|------------|
| Two devices edit same order | Optimistic locking (version field) |
| Two devices pay same order | `SELECT ... FOR UPDATE` lock |
| Split bill race condition | Atomic balance check in transaction |
| Webhook retry | Event deduplication table |

### Financial Integrity

| Guarantee | Implementation |
|-----------|----------------|
| No double payments | Idempotency keys + DB unique constraint |
| No overpayment | Atomic remaining balance check |
| No orphan payments | Payment + Order in single transaction |
| Audit trail | All mutations logged with operator ID |

### Operational Safety

| Guarantee | Implementation |
|-----------|----------------|
| No tenant bleed | Gate resolves tenant before Domain |
| No context switch during operation | OperationalStateGuard blocks |
| No offline data loss | IndexedDB queue + reconciliation |
| No silent webhook failures | Event table with payload storage |

---

## 6. Risk Management Framework

ChefIApp maintains a living PRODUCTION_RISK_MATRIX with:

- **Risk classification** (Acceptable → Mitigable → Critical → Unacceptable)
- **Gap analysis** per risk
- **Priority fixes** with implementation tracking
- **Evidence of closure** (trigger names, code references)

### Current Status

| Level | Count | Status |
|-------|-------|--------|
| 🟢 Acceptable | 3 | Managed |
| 🟡 Mitigable | 6 | Protected |
| 🔴 Critical | 0 | All Fixed |
| ☠️ Unacceptable | 0 | All Fixed |

---

## 7. Technical Differentiators

### vs. Traditional POS Systems

| Aspect | Traditional POS | ChefIApp OS |
|--------|-----------------|-------------|
| State management | Implicit, scattered | Formalized machines |
| Error handling | Try-catch | Invariant enforcement |
| Concurrency | Hope for the best | Pessimistic + optimistic locks |
| Audit | Optional logging | Mandatory, CI-enforced |
| Architecture | MVC/MVVM | Layered deterministic |

### vs. Modern Web Apps

| Aspect | Typical SPA | ChefIApp OS |
|--------|-------------|-------------|
| Boot order | Async chaos | Deterministic layers |
| Context | React context | Sovereign gates |
| State | useState everywhere | Domain-owned machines |
| Validation | Client-side | Database triggers |
| Testing | Unit tests | Architectural audits |

---

## 8. Conclusion

ChefIApp OS represents a paradigm shift in restaurant technology: treating point-of-sale as **critical infrastructure** rather than a consumer application.

The architecture described in this document provides:

1. **Mathematical guarantees** — not best practices
2. **Executable contracts** — not documentation
3. **Database authority** — not client trust
4. **Audit enforcement** — not code review

This enables ChefIApp to operate in environments where:

- Financial accuracy is non-negotiable
- Multi-device concurrency is the norm
- Network reliability cannot be assumed
- Regulatory compliance is required

---

## Appendix: Key Documents

| Document | Purpose |
|----------|---------|
| `ARCHITECTURAL_INVARIANTS.md` | System laws |
| `DOMAIN_STATE_MACHINE.md` | Entity lifecycles |
| `UI_CONTRACT.md` | View limitations |
| `PRODUCTION_RISK_MATRIX.md` | Risk tracking |
| `audit-architecture.cjs` | CI enforcement |
| `audit-domain.cjs` | State machine verification |

---

**ChefIApp OS**  
*Technical Whitepaper v1.0*  
*January 2026*
