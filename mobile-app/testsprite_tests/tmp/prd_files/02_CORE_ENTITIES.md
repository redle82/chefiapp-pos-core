# CORE ENTITIES

Minimum entities required for the point of sale system.

No roles. No users. No permissions. No company. No integrations.

Only the financial and operational core.

---

## SESSION

Represents an active operational context (shift/turn).

**Fields:**
- `id` - Unique identifier
- `state` - Current state (INACTIVE, ACTIVE, CLOSED)
- `opened_at` - Timestamp when session became ACTIVE
- `closed_at` - Timestamp when session became CLOSED

**Constraints:**
- Only one ACTIVE session at a time
- Cannot close session with open orders

---

## TABLE

Represents a physical or logical grouping of orders.

**Fields:**
- `id` - Unique identifier
- `state` - Current state (AVAILABLE, OCCUPIED, RESERVED)
- `current_session_id` - Reference to active session

**Constraints:**
- State derived from order states
- Multiple orders can reference same table

---

## ORDER

Groups consumption items for a table or customer.

**Fields:**
- `id` - Unique identifier
- `table_id` - Reference to table (nullable for takeout)
- `session_id` - Reference to session when created
- `state` - Current state (OPEN, LOCKED, PAID, CLOSED, CANCELED)
- `total` - Calculated total (set when LOCKED, immutable)

**Constraints:**
- Must belong to ACTIVE session
- Total calculated only when transitioning to LOCKED
- Cannot modify after LOCKED (except state transitions)

---

## ORDER_ITEM

Individual item within an order.

**Fields:**
- `id` - Unique identifier
- `order_id` - Reference to order
- `product_id` - Reference to product (external, not core)
- `quantity` - Item quantity
- `price_snapshot` - Price at time of addition (immutable)
- `subtotal` - Calculated: quantity × price_snapshot

**Constraints:**
- Can only be added when order is OPEN
- Cannot be modified after order is LOCKED
- Price snapshot preserves historical pricing

---

## PAYMENT

Financial transaction against an order.

**Fields:**
- `id` - Unique identifier
- `order_id` - Reference to order
- `session_id` - Reference to session when created
- `method` - Payment method (CASH, CARD, etc. - external enum)
- `amount` - Payment amount
- `state` - Current state (PENDING, CONFIRMED, FAILED, CANCELED)

**Constraints:**
- Can only be created for LOCKED orders
- Only CONFIRMED payments affect order state
- Multiple payments allowed per order (split bill, partial payment)
- Sum of CONFIRMED payments can exceed order total (tip/overpayment)

---

## ENTITY RELATIONSHIPS

```
SESSION (1) ──→ (N) ORDER
SESSION (1) ──→ (N) PAYMENT
TABLE (1) ──→ (N) ORDER
ORDER (1) ──→ (N) ORDER_ITEM
ORDER (1) ──→ (N) PAYMENT
```

---

## DATA INTEGRITY RULES

1. **Session Dependency**: All orders and payments must reference ACTIVE session
2. **Order State**: Cannot create payment for non-LOCKED order
3. **Payment State**: Only CONFIRMED payments transition order to PAID
4. **Table State**: Derived from order states (no direct manipulation)
5. **Price Immutability**: ORDER_ITEM.price_snapshot and ORDER.total are immutable after LOCKED
6. **Session Closure**: Cannot close session with orders in OPEN or LOCKED state

---

## WHAT IS NOT HERE

- Users / Staff / Roles
- Permissions / Authorization
- Company / Business / Location
- Products / Menu (external reference only)
- Kitchen / Fulfillment states
- Delivery / Takeout logistics
- Integrations / External services
- Tasks / Workflows
- AI / Automation

These are operational concerns, not core financial entities.

