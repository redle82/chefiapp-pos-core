# CORE STATES — TABLE

A table groups one or more orders.

States:
- FREE        → no active orders
- OCCUPIED   → has OPEN or SENT orders
- PAYMENT    → all orders SERVED, waiting payment
- CLOSED     → no active financial context

Rules:
- A table becomes OCCUPIED when first order opens
- A table enters PAYMENT when all orders are SERVED
- A table becomes FREE only after all orders are CLOSED