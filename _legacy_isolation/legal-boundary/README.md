# Legal Boundary Layer

## Purpose

The Legal Boundary Layer observes Core financial events and creates **immutable legal seals** that mark points of institutional irreversibility.

**Key principle:** The Legal Boundary **observes and seals**, it does NOT validate or enforce business rules.

---

## Architecture

```
┌──────────────┐
│  CORE LOGIC  │  ← Guarantees causal correctness
└──────┬───────┘
       │ Events (already validated)
       ▼
┌──────────────────┐
│ LEGAL BOUNDARY   │  ← Observes & seals facts
└──────┬───────────┘
       │ Legal Seals (immutable)
       ▼
┌──────────────────┐
│  PERSISTENCE     │
└──────────────────┘
```

---

## Critical Assumption

**The Legal Boundary assumes that the CORE has already guaranteed causal correctness.**

This means:
- Events arrive in valid order
- Business rules have been enforced
- State transitions are legal (per CORE logic)

**The Boundary does NOT validate:**
- Whether an ORDER was paid before being closed
- Whether all items were served before payment
- Whether session is active

**Why?**
- Validation is CORE responsibility (business logic)
- Legal Boundary is observational (institutional layer)
- Mixing these layers would violate separation of concerns

---

## What Legal Boundary DOES

✅ **Observes** Core events  
✅ **Creates** legal seals for specific trigger events  
✅ **Enforces** immutability of sealed entities  
✅ **Provides** idempotent replay support  
✅ **Maintains** monotonic sequence  

---

## What Legal Boundary DOES NOT DO

❌ Validate business rules (belongs to CORE)  
❌ Enforce causal order (belongs to CORE)  
❌ Calculate taxes (belongs to fiscal module)  
❌ Generate invoices (belongs to fiscal module)  
❌ Authenticate users (belongs to auth layer)  
❌ Handle UI concerns (belongs to application layer)  

---

## Seal Trigger Rules

| Core Event         | Legal Seal Created | Meaning |
|-------------------|--------------------|---------|
| `PAYMENT_CONFIRMED` | `PAYMENT_SEALED`    | Payment is legally consolidated |
| `ORDER_PAID`        | `ORDER_DECLARED`    | Order is legally declared (paid) |
| `ORDER_CLOSED`      | `ORDER_FINAL`       | Order is legally final (immutable) |

---

## Immutability Enforcement

Once a legal seal exists:
- The entity becomes immutable
- Any attempt to mutate triggers `LEGAL_SEALED` error
- Only forward correction via new events is allowed

**Example:**
```typescript
boundary.assertNotSealed("ORDER", "order-123");
// Throws: "LEGAL_SEALED: Entity ORDER:order-123 is immutable."
```

---

## Idempotency & Replay

The Legal Boundary is **replay-safe**:
- Same event replayed → no duplicate seal
- Enforced by checking existing seals before creation
- Critical for crash recovery and event sourcing

---

## Sequence Semantics

Legal seals have a **global monotonic sequence**:
- Strictly increasing (never decreases, never repeats)
- May have gaps (on rollback/failure)
- Mirrors PostgreSQL `BIGSERIAL` behavior

**This is documented and acceptable for legal audit.**

---

## Integration Points

### With CORE
```typescript
// CORE emits event
const event = { type: "ORDER_CLOSED", payload: { order_id: "123" } };

// Legal Boundary observes
boundary.observe([event], getStreamHashFn);

// Legal seal created automatically
```

### With Persistence (GATE 4)
```sql
BEGIN TRANSACTION;
  INSERT INTO event_store (...);
  INSERT INTO legal_seals (...);  -- Atomic with event
COMMIT;
```

---

## Testing

See `tests/` directory for:
- Idempotency tests
- Replay tests
- Immutability tests
- Integration tests

---

## Future Work (GATE 4)

When implementing PostgreSQL adapter:
- `seal_event_id` will link to actual `event_store.event_id`
- `sequence` will come from database `BIGSERIAL`
- Seals will be created within same transaction as events
- Triggers will enforce immutability at DB level

---

## Warning for Developers

⚠️ **DO NOT use Legal Boundary as a validator**

If you try to use `assertNotSealed()` to validate business logic, you are violating architecture boundaries.

**Correct usage:**
```typescript
// ✅ GOOD: CORE validates, then Boundary seals
if (!order.isPaid()) throw new Error("Cannot close unpaid order");
order.close(); // Emits ORDER_CLOSED
boundary.observe([event], getHash); // Seals ORDER_FINAL
```

**Incorrect usage:**
```typescript
// ❌ BAD: Using Boundary for business validation
boundary.assertNotSealed("ORDER", orderId); // Wrong layer!
order.addItem(item); // Business logic should enforce this
```

---

## Compliance

This design meets requirements for:
- Financial audit (immutability + traceability)
- Legal defense (tamper-evident seals)
- Event sourcing (replay safety)
- Distributed systems (idempotency)

---

**Last Updated:** 2025-12-22  
**GATE Status:** ✅ GATE 2 PASSED
