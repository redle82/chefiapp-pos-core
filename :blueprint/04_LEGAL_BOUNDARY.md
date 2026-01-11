# LEGAL BOUNDARY LAYER

Defines the point of institutional irreversibility for financial events.

This layer observes the CORE, seals events, and creates legal truth without modifying financial logic.

---

## PURPOSE

The Legal Boundary Layer answers:

**"At what moment does a financial event become legally immutable?"**

It transforms:
- Financial correctness → Legal truth
- Operational state → Institutional record
- Reversible events → Irreversible seals

---

## CORE PRINCIPLE

**The CORE remains pure. The Legal Layer observes, seals, and references.**

The Legal Boundary Layer:
- ✅ Observes events from the CORE
- ✅ Creates legal seals (immutable)
- ✅ References financial events
- ❌ Does NOT modify financial logic
- ❌ Does NOT contain fiscal rules
- ❌ Does NOT depend on country/jurisdiction

---

## FINANCIAL vs LEGAL EVENTS

### Financial Events (CORE)
These are operational and can be reversed (within CORE constraints):

- `PAYMENT_CONFIRMED` - Payment processed (can be disputed, refunded)
- `ORDER_PAID` - Payment received (can be refunded)
- `ORDER_CLOSED` - Operation terminated (can be reopened for corrections)

### Legal Events (LEGAL BOUNDARY)
These are institutional and **never reversible**:

- `PAYMENT_SEALED` - Payment legally consolidated
- `ORDER_DECLARED` - Order legally declared
- `ORDER_FINAL` - Order legally final (no modifications allowed)

---

## LEGAL STATE DERIVATION

Legal states derive from financial states, but are separate:

| Financial State | Legal State | When Sealed |
|----------------|-------------|-------------|
| `PAYMENT_CONFIRMED` | `PAYMENT_SEALED` | After legal consolidation period |
| `ORDER_PAID` | `ORDER_DECLARED` | After payment is sealed |
| `ORDER_CLOSED` | `ORDER_FINAL` | After all legal requirements met |

**Important**: Financial states can exist without legal states, but legal states require financial states.

---

## LEGAL SEAL STRUCTURE

A legal seal is an immutable record that marks an event as legally final:

```typescript
interface LegalSeal {
  seal_id: string;              // Unique seal identifier
  entity_type: "ORDER" | "PAYMENT" | "SESSION";
  entity_id: string;            // Reference to financial entity
  seal_event_id: string;        // Event that triggered the seal
  stream_hash: string;          // Hash of event stream at seal time
  sealed_at: Date;              // Timestamp of legal consolidation
  sequence: number;              // Sequential number (for audit)
  financial_state: string;       // Financial state at seal time
  legal_state: string;          // Legal state after seal
}
```

---

## IRREVERSIBILITY RULES

### Rule 1: Sealed Events Cannot Be Modified
Once an event is sealed:
- ❌ Cannot be reversed
- ❌ Cannot be modified
- ❌ Cannot be deleted
- ✅ Can be referenced
- ✅ Can be audited

### Rule 2: Financial Events After Seal Are Rejected
If a financial event attempts to modify a sealed entity:
- The operation is rejected
- An audit log entry is created
- The seal remains intact

### Rule 3: Replay Preserves Seals
When rebuilding state from events:
- Seals are preserved
- Legal states are restored
- No seal can be lost or modified

---

## SEALING CONDITIONS

### PAYMENT_SEALED
A payment can be sealed when:
- `PAYMENT_CONFIRMED` exists
- No disputes pending (if applicable)
- Legal consolidation period passed (if applicable)

**Note**: The exact conditions are jurisdiction-specific, but the seal mechanism is universal.

### ORDER_DECLARED
An order can be declared when:
- `ORDER_PAID` exists
- All payments are `PAYMENT_SEALED`
- No pending corrections

### ORDER_FINAL
An order becomes final when:
- `ORDER_DECLARED` exists
- All legal requirements met
- No further modifications allowed

---

## STREAM HASH (Anti-Tamper)

The stream hash ensures integrity:

```
stream_hash = hash(
  event_1.hash +
  event_2.hash +
  ... +
  seal_event.hash
)
```

This creates an immutable chain that proves:
- Events were not modified
- Sequence is correct
- Seal is authentic

---

## WHAT IS NOT HERE

The Legal Boundary Layer does NOT include:

- ❌ Tax calculations (IVA, VAT, ICMS, etc.)
- ❌ Country-specific rules
- ❌ Fiscal document generation
- ❌ Government integrations
- ❌ Reporting formats
- ❌ UI/UX
- ❌ Business rules

These are **modules** that plug into the Legal Boundary Layer, not part of it.

---

## AUDITABILITY

Every legal seal must be:
- **Traceable**: Can be traced back to financial events
- **Reproducible**: Can be verified via replay
- **Immutable**: Cannot be modified or deleted
- **Timestamped**: Has exact moment of consolidation
- **Sequential**: Has sequence number for ordering

---

## INTEGRATION WITH CORE

The Legal Boundary Layer:

1. **Listens** to events from the CORE
2. **Evaluates** if sealing conditions are met
3. **Creates** legal seal events
4. **Stores** seals separately from financial events
5. **Enforces** irreversibility

**The CORE does not know about legal seals.**
**The Legal Layer does not modify the CORE.**

---

## GATE 2 AUDIT CRITERIA

The GATE 2 audit validates:

1. ✅ Sealed events cannot be modified
2. ✅ Replay preserves seals
3. ✅ No financial mutations occur after seal
4. ✅ CORE remains pure (no fiscal logic)
5. ✅ Legal states derive from financial states
6. ✅ Stream hash integrity is maintained

If all criteria pass, GATE 2 is approved.

---

## NEXT STEPS

After GATE 2:
- GATE 3: Persistence (PostgreSQL event store)
- GATE 4: Scale (distributed locks, multi-instance)
- GATE 5: Offline-first (optional)

The Legal Boundary Layer provides the foundation for:
- Fiscal compliance (by jurisdiction)
- Audit trails
- Legal disputes
- Chargeback handling
- International operations

