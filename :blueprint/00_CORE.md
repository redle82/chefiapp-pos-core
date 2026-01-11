# CHEFIAPP POS — CORE DEFINITION

This project is a Point of Sale (TPV).

The CORE is financial and operational.

## CORE responsibilities
- Register consumption
- Group consumption by order or table
- Calculate totals
- Process payments
- Close operations with financial consistency

## NON-CORE (explicitly excluded)
- UI / UX
- Integrations
- Roles and permissions
- Kitchen workflow
- Tasks
- Analytics
- AI
- Notifications

These are MODULES, not CORE.

## CORE principles
- Financial states are irreversible
- Closed operations are immutable
- No payment without a finalized order
- No order without an active session
- No hidden state transitions

If a feature violates these principles, it is NOT allowed in the CORE.

