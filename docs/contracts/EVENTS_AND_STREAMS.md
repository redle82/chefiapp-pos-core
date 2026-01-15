# Events & Streams Contract
>
> **The Language of History**

This document defines the naming conventions, structure, and rules for the Event Store.

## 1. Stream Identity

**Format:** `${TenantId}:${Entity}:${EntityId}`

- **TenantId**: 4-char prefix or UUID.
- **Entity**: UPPERCASE entity type (e.g., `ORDER`).
- **EntityId**: UUID.

**Example:** `bfea:ORDER:123e4567-e89b-12d3`

## 2. Event Naming

**Format:** `ENTITY_VERB` (Past Tense)

### Valid Events

- **SESSION:** `SESSION_STARTED`, `SESSION_CLOSED`
- **ORDER:** `ORDER_CREATED`, `ORDER_LOCKED`, `ORDER_PAID`, `ORDER_CANCELED`, `ORDER_CLOSED`
- **PAYMENT:** `PAYMENT_CREATED`, `PAYMENT_CONFIRMED`, `PAYMENT_FAILED`
- **INVENTORY:** `INVENTORY_CONSUMED`, `INVENTORY_RESTOCKED`

## 3. Structure (CloudEvents Compatible)

```typescript
interface CoreEvent {
  event_id: UUID;        // Unique ID
  stream_id: string;     // See Section 1
  stream_version: number;// 1, 2, 3... (Version Control)
  type: string;          // See Section 2
  payload: JSON;         // The Data Mutation
  meta: {
    causation_id?: UUID; // What command caused this?
    correlation_id: UUID;// Trace ID
    actor_ref?: string;  // Who did this?
    idempotency_key?: string; // Deduplication Key
  };
  occurred_at: ISO8601;
}
```

## 4. Idempotency & Concurrency

- **Concurrency:** Guarded by `stream_version`. A write fails if `version != expected + 1`.
- **Idempotency:** Guarded by `idempotency_key` (Unique Index).
  - If `(stream_id, idempotency_key)` exists -> Return Success (Idempotent).
  - If payload differs -> Throw `COLLISION`.

## 5. Metadata Rules

- **Actor:** `user:UUID` or `system:scheduler`.
- **Correlation:** Must flow from API Request -> Command -> Event.
