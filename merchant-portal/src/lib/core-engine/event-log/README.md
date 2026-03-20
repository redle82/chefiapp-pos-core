# Event Log (Event Sourcing Minimum)

**DORMANT / EXPERIMENTAL** — Not used in production. All write paths use PostgreSQL RPCs. See [ARCHITECTURE_DECISION.md](../../ARCHITECTURE_DECISION.md).

---

Append-only event log as the foundation of the POS CORE.

## Philosophy

**Events are the source of truth. State is a projection.**

- Every state change generates an event
- Events are immutable (append-only)
- State can be rebuilt from events (replay)
- Events provide audit trail and crash recovery

## Architecture

```
┌─────────────────┐
│  State Machine  │ (Validates transitions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CoreExecutor   │ (Executes guards/effects)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EventExecutor  │ (Generates events)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   EventStore    │ (Append-only storage)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Projections   │ (Rebuild state from events)
└─────────────────┘
```

## Components

### EventStore

Append-only storage with:
- **Optimistic concurrency control** (stream_version)
- **Idempotency** (event_id + idempotency_key)
- **Anti-tamper chain** (hash_prev + hash)

### Projections

Deterministic replay:
- `applyEvent(state, event)` - Apply single event
- `rebuildState(events)` - Rebuild state from all events

### EventExecutor

Integrates CoreExecutor with EventStore:
- Transitions generate events
- Events are appended atomically
- State is rebuilt from events

## Event Types

### SESSION
- `SESSION_STARTED` - Session became ACTIVE
- `SESSION_CLOSED` - Session closed
- `SESSION_RESET` - Session reset to INACTIVE

### ORDER
- `ORDER_CREATED` - Order created
- `ORDER_LOCKED` - Order finalized (total calculated)
- `ORDER_PAID` - Payment confirmed
- `ORDER_CLOSED` - Operation terminated
- `ORDER_CANCELED` - Order canceled

### PAYMENT
- `PAYMENT_CREATED` - Payment initiated
- `PAYMENT_CONFIRMED` - Payment confirmed (irreversible)
- `PAYMENT_FAILED` - Payment failed
- `PAYMENT_CANCELED` - Payment canceled
- `PAYMENT_RETRIED` - Payment retried

### ORDER_ITEM
- `ORDER_ITEM_ADDED` - Item added to order

## Usage

```typescript
import { InMemoryEventStore } from "./event-log";
import { EventExecutor } from "./event-log/EventExecutor";

// Create event store
const eventStore = new InMemoryEventStore();
const executor = new EventExecutor(eventStore);

// Execute transition (generates event)
const result = await executor.transition({
  entity: "ORDER",
  entityId: "order-1",
  event: "FINALIZE",
}, {
  idempotency_key: "cmd-123", // Optional: prevents duplicates
  correlation_id: "trace-456", // Optional: for tracing
});

// Rebuild state from events
const events = await eventStore.readStream("ORDER:order-1");
const state = rebuildState(events);
```

## Guarantees

1. **Idempotency**: Same command (idempotency_key) = no-op
2. **Concurrency**: Optimistic locking prevents conflicts
3. **Immutability**: Events cannot be modified
4. **Recovery**: State can be rebuilt from events
5. **Audit**: Complete history of all changes

## Next Steps

- [ ] Persist events to database (PostgreSQL/Supabase)
- [ ] Add event snapshots (for performance)
- [ ] Add event replay API
- [ ] Add Legal Boundary Layer (which events are "legal-grade")

## Tests

Run tests:
```bash
npm test event-log.test.ts
```

Tests cover:
- Idempotency
- Concurrency
- Crash recovery
- Immutability
- Anti-tamper chain

