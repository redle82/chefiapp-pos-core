# CORE DATA MODEL

Logical data model for the point of sale system.

---

## SESSION

Represents an active operational context (shift/turn).

**Fields:**
- `id` - Unique identifier
- `state` - Current state (INACTIVE, ACTIVE, CLOSED)
- `opened_at` - Timestamp when session became ACTIVE
- `closed_at` - Timestamp when session became CLOSED

**Data Constraints:**
- `id` is unique and immutable
- `state` must be one of: INACTIVE, ACTIVE, CLOSED
- `opened_at` is set when state becomes ACTIVE
- `closed_at` is set when state becomes CLOSED

---

## TABLE

Represents a physical or logical grouping of orders.

**Fields:**
- `id` - Unique identifier
- `state` - Current state (AVAILABLE, OCCUPIED, RESERVED)
- `current_session_id` - Reference to active session

**Data Constraints:**
- `id` is unique and immutable
- `state` must be one of: AVAILABLE, OCCUPIED, RESERVED
- `current_session_id` references SESSION.id

---

## ORDER

Groups consumption items for a table or customer.

**Fields:**
- `id` - Unique identifier
- `table_id` - Reference to table (nullable for takeout)
- `session_id` - Reference to session when created
- `state` - Current state (OPEN, LOCKED, PAID, CLOSED, CANCELED)
- `total` - Calculated total (set when LOCKED, immutable)

**Data Constraints:**
- `id` is unique and immutable
- `table_id` references TABLE.id (nullable)
- `session_id` references SESSION.id
- `state` must be one of: OPEN, LOCKED, PAID, CLOSED, CANCELED
- `total` is set when state becomes LOCKED, then immutable

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

**Data Constraints:**
- `id` is unique and immutable
- `order_id` references ORDER.id
- `product_id` is external reference (not core entity)
- `quantity` must be > 0
- `price_snapshot` is immutable after creation
- `subtotal` = quantity × price_snapshot

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

**Data Constraints:**
- `id` is unique and immutable
- `order_id` references ORDER.id
- `session_id` references SESSION.id
- `method` is external enum (not core)
- `amount` must be > 0
- `state` must be one of: PENDING, CONFIRMED, FAILED, CANCELED

---

## ENTITY RELATIONSHIPS

```
SESSION (1) ──→ (N) ORDER
SESSION (1) ──→ (N) PAYMENT
TABLE (1) ──→ (N) ORDER
ORDER (1) ──→ (N) ORDER_ITEM
ORDER (1) ──→ (N) PAYMENT
```
