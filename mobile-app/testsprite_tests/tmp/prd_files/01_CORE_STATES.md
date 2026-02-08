# CORE STATES — OPERATIONAL

Operational states and transitions for a restaurant point of sale system.

## SESSION

A session represents an active operational context.

**States:**
- `INACTIVE` - System not operational
- `ACTIVE` - System operational, accepting orders
- `CLOSED` - Session terminated

**Transitions:**
- `INACTIVE` → `ACTIVE` - Start session
- `ACTIVE` → `CLOSED` - Close session

**Terminal States:**
- `CLOSED` - Cannot transition from this state (terminal)

---

## ORDER

An order groups consumption items for a table or customer.

**States:**
- `OPEN` - Order created, accepting items
- `LOCKED` - Order finalized, total calculated (immutable)
- `PAID` - Payment confirmed
- `CLOSED` - Operation terminated
- `CANCELED` - Order canceled before payment

**Transitions:**
- `OPEN` → `LOCKED` - Finalize order (calculate totals, no more items)
- `LOCKED` → `PAID` - Payment confirmed
- `PAID` → `CLOSED` - Operation terminated
- `LOCKED` → `CANCELED` - Cancel order
- `OPEN` → `CANCELED` - Cancel order before finalization

**Terminal States:**
- `CLOSED` - Cannot transition from this state
- `CANCELED` - Cannot transition from this state

---

## PAYMENT

A payment is a financial transaction against an order.

**States:**
- `PENDING` - Payment initiated, awaiting confirmation
- `CONFIRMED` - Payment successfully processed
- `FAILED` - Payment processing failed
- `CANCELED` - Payment canceled before confirmation

**Transitions:**
- `PENDING` → `CONFIRMED` - Payment processed successfully
- `PENDING` → `FAILED` - Payment processing failed
- `PENDING` → `CANCELED` - Payment canceled
- `FAILED` → `PENDING` - Retry payment
- `CANCELED` → `PENDING` - Retry payment

**Terminal States:**
- `CONFIRMED` - Cannot transition from this state

---

## TABLE

A table represents a physical or logical grouping of orders.

**States:**
- `AVAILABLE` - Table ready for customers
- `OCCUPIED` - Table has active order(s)
- `RESERVED` - Table reserved (if applicable)

**Transitions:**
- `AVAILABLE` → `OCCUPIED` - First order created for table
- `OCCUPIED` → `AVAILABLE` - All orders for table are `PAID` or `CANCELED`
- `AVAILABLE` → `RESERVED` - Table reserved (if applicable)
- `RESERVED` → `OCCUPIED` - Reservation activated

**Terminal States:**
- None (derived state, always transitions based on orders)

---

## STATE FLOW DIAGRAM

```
SESSION: INACTIVE
    ↓
SESSION: ACTIVE
    ↓
TABLE: AVAILABLE → OCCUPIED
    ↓
ORDER: OPEN
    ↓
ORDER: LOCKED
    ↓
PAYMENT: PENDING → CONFIRMED
    ↓
ORDER: PAID
    ↓
ORDER: CLOSED
    ↓
TABLE: OCCUPIED → AVAILABLE
    ↓
SESSION: ACTIVE → CLOSED
```
