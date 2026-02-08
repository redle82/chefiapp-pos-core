# ChefIApp POS CORE — Database Schema Reference

## Architecture: Event Sourcing

The ChefIApp POS CORE uses an **event-sourced** architecture with legal immutability:

- **Source of truth**: `event_store` (append-only, hash-chained)
- **Legal boundary markers**: `legal_seals` (immutable, monotonic sequence)
- **Read models**: `projection_*` tables (rebuildable from events)
- **Operational tables**: `gm_*` tables (current state for PostgREST queries)

## Core Tables

### event_store (Immutable, Append-Only)

```sql
CREATE TABLE event_store (
    event_id UUID PRIMARY KEY,
    stream_id TEXT NOT NULL,           -- e.g. "ORDER:abc-123", "SESSION:xyz"
    stream_version BIGINT NOT NULL,    -- sequential per stream
    type TEXT NOT NULL,                -- event type
    payload JSONB NOT NULL,            -- flexible event data
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    causation_id UUID,
    correlation_id UUID,
    actor_ref TEXT,
    idempotency_key TEXT,
    hash_prev TEXT,                    -- previous event hash (chain)
    hash TEXT NOT NULL,                -- tamper-evident hash
    UNIQUE (stream_id, stream_version)
);
```

**Protected by:**

- `forbid_mutation()` trigger — blocks UPDATE/DELETE
- Hash chain — each event hashes the previous for tamper detection

### legal_seals (Immutable, Monotonic)

```sql
CREATE TABLE legal_seals (
    seal_id UUID PRIMARY KEY,
    entity_type TEXT NOT NULL,    -- 'ORDER', 'PAYMENT', 'SESSION'
    entity_id TEXT NOT NULL,
    seal_event_id UUID NOT NULL REFERENCES event_store(event_id),
    stream_hash TEXT NOT NULL,
    sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sequence BIGSERIAL NOT NULL UNIQUE,  -- monotonic, gaps allowed
    financial_state TEXT NOT NULL,
    legal_state TEXT NOT NULL,    -- 'PAYMENT_SEALED', 'ORDER_DECLARED', 'ORDER_FINAL'
    UNIQUE (entity_type, entity_id, legal_state)
);
```

### projection_order_summary (Rebuildable Read Model)

```sql
CREATE TABLE projection_order_summary (
    order_id TEXT PRIMARY KEY,
    session_id TEXT,
    table_id TEXT,
    state TEXT NOT NULL,          -- 'OPEN', 'LOCKED', 'CLOSED'
    total NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL,
    locked_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    last_event_id UUID NOT NULL REFERENCES event_store(event_id),
    last_event_version BIGINT NOT NULL
);
```

## Operational Tables (PostgREST)

### gm_orders

| Column        | Type        | Description                         |
| ------------- | ----------- | ----------------------------------- |
| id            | UUID        | Primary key                         |
| restaurant_id | UUID        | Restaurant reference                |
| table_id      | TEXT        | Table identifier                    |
| state         | TEXT        | OPEN / LOCKED / CLOSED              |
| items         | JSONB       | Array of order items                |
| total_cents   | INTEGER     | Total in cents (calculated on LOCK) |
| created_at    | TIMESTAMPTZ | Creation time                       |

### gm_cash_registers (Shifts)

| Column                | Type        | Description                             |
| --------------------- | ----------- | --------------------------------------- |
| id                    | UUID        | Primary key                             |
| restaurant_id         | UUID        | Restaurant reference                    |
| name                  | TEXT        | Register name (e.g., "Caixa Principal") |
| status                | TEXT        | open / closed                           |
| opened_by             | TEXT        | Who opened                              |
| opening_balance_cents | INTEGER     | Opening float in cents                  |
| closed_at             | TIMESTAMPTZ | Closing time                            |

### gm_staff

| Column        | Type | Description                    |
| ------------- | ---- | ------------------------------ |
| id            | UUID | Primary key                    |
| restaurant_id | UUID | Restaurant reference           |
| name          | TEXT | Staff member name              |
| role          | TEXT | waiter / cook / manager / etc. |
| status        | TEXT | active / inactive              |
| user_id       | UUID | Auth user reference            |

### gm_menu_items

| Column        | Type    | Description                      |
| ------------- | ------- | -------------------------------- |
| id            | UUID    | Primary key                      |
| restaurant_id | UUID    | Restaurant reference             |
| name          | TEXT    | Item name                        |
| category      | TEXT    | Category (burgers, drinks, etc.) |
| price_cents   | INTEGER | Price in cents                   |
| available     | BOOLEAN | Currently available              |

### gm_stock

| Column        | Type    | Description          |
| ------------- | ------- | -------------------- |
| id            | UUID    | Primary key          |
| restaurant_id | UUID    | Restaurant reference |
| product_name  | TEXT    | Product name         |
| current_stock | NUMERIC | Current quantity     |
| min_stock     | NUMERIC | Minimum threshold    |
| max_stock     | NUMERIC | Maximum capacity     |
| unit          | TEXT    | Unit of measure      |
| cost_per_unit | NUMERIC | Cost per unit        |

### shift_logs

| Column        | Type        | Description            |
| ------------- | ----------- | ---------------------- |
| id            | UUID        | Primary key            |
| restaurant_id | UUID        | Restaurant reference   |
| staff_id      | UUID        | Staff member reference |
| started_at    | TIMESTAMPTZ | Shift start            |
| ended_at      | TIMESTAMPTZ | Shift end              |
| status        | TEXT        | open / closed          |

## Database Functions

### get_stream_version(stream_id)

Returns current version for optimistic concurrency.

### is_entity_sealed(entity_type, entity_id)

Returns boolean — checks if entity has a legal seal (cannot be mutated).

### open_cash_register_atomic(...)

Atomically opens a new cash register / shift. Parameters:

- `p_restaurant_id` UUID
- `p_name` TEXT
- `p_opened_by` TEXT
- `p_opening_balance_cents` INTEGER

## Immutability Rules

1. `event_store` — **NEVER** update or delete. Trigger blocks all mutations.
2. `legal_seals` — **NEVER** update or delete. Trigger blocks all mutations.
3. `gm_orders` in `LOCKED`/`CLOSED` — Application-level immutability.
4. All financial values in **cents** (integer math, no floating point).
5. Prices are **snapshots** at order time (`price_snapshot_cents`), not references.

## Schema Version

Stored in `schema_metadata`:

```sql
SELECT value FROM schema_metadata WHERE key = 'version';
-- → 'GATE3_v1.0.0'
```
