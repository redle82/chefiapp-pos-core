# Architecture Decision: Event Sourcing is Dormant

**Status:** ACTIVE
**Date:** 2026-02-20
**Decision maker:** System Architect

## Context

The `core-engine/` directory contains a full Event Sourcing infrastructure:

- `TenantKernel` — command dispatcher
- `EventExecutor` — event handler with effects
- `InMemoryEventStore` — in-memory event persistence
- `types.ts` — 26+ event types defined

However, **zero production write paths use this infrastructure**. All writes go
through PostgreSQL RPCs executed via PostgREST:

| Operation           | RPC                          | File                                            |
| ------------------- | ---------------------------- | ----------------------------------------------- |
| Create order        | `create_order_atomic`        | `20260219_order_state_machine_and_tax.sql`      |
| Process payment     | `process_order_payment`      | `20260128_core_payments_and_cash_registers.sql` |
| Open cash register  | `open_cash_register_atomic`  | `20260128_core_payments_and_cash_registers.sql` |
| Close cash register | `close_cash_register_atomic` | `20260219_z_report_shift_close.sql`             |

CDC triggers in `20260210_cdc_orders_event_store.sql` passively emit events
to the `event_store` table AFTER the fact — as an audit trail, not as the
source of truth.

## Decision

**Event Sourcing remains dormant.** PostgreSQL RPCs are the sole write path.

### Rationale

1. **RPCs are already atomic** — `SECURITY DEFINER` functions with row-level
   locking, FK constraints, and CHECK constraints provide transaction safety
   that the TypeScript Event Sourcing layer would need to replicate.

2. **Solo developer** — maintaining two write paths (RPCs + Event Sourcing)
   doubles the surface area for bugs without a team to support it.

3. **No production validation** — the Event Sourcing layer has never processed
   a real transaction. Activating it now introduces unvalidated complexity.

4. **CDC is sufficient** — the passive event emission via CDC triggers provides
   the audit trail benefit without the complexity of event-driven writes.

## What This Means

- `TenantKernel`, `EventExecutor` — keep in codebase but mark `@deprecated`.
- `InMemoryEventStore` — continues to be used in unit tests only.
- `PostgresEventStore` — does NOT exist and should NOT be created yet.
- CDC triggers — keep active, they provide passive audit trail.
- `CashRegister.ts`, `OrderWriter.ts` — use RPC calls only, no kernel routing.

## When To Revisit

Activate Event Sourcing when:

- 10+ restaurants are operational (enough data to validate patterns)
- A second developer joins the team
- A use case requires event replay (e.g., audit reconstruction, CQRS reads)

## Consequences

- `kernel` and `executeSafe` parameters on `CashRegisterEngine` interfaces are
  kept for backward compatibility but are ignored at runtime.
- The `event_store` table contains CDC-emitted events, not application events.
- State is reconstructed from PostgreSQL tables, not event streams.
