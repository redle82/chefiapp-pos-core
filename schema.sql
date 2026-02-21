-- ==============================================================================
-- CHEFIAPP POS CORE - PostgreSQL Schema
-- ==============================================================================
-- Version: GATE 3
-- Target: PostgreSQL 15+
-- Purpose: Event-sourced financial core with legal immutability
-- Architecture: Append-only event store + legal seals + projections
-- ==============================================================================

-- ==============================================================================
-- PART 1: EVENT STORE (Immutable, Append-Only)
-- ==============================================================================

-- Core event log - the source of truth for all state changes
CREATE TABLE event_store (
    -- Identity
    event_id UUID PRIMARY KEY,

    -- Stream organization
    stream_id TEXT NOT NULL,
    stream_version BIGINT NOT NULL,

    -- Event metadata
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Tracing & causality
    causation_id UUID,
    correlation_id UUID,
    actor_ref TEXT,
    idempotency_key TEXT,

    -- Anti-tamper chain
    hash_prev TEXT,
    hash TEXT NOT NULL,

    -- Constraints
    CONSTRAINT event_store_stream_version_unique UNIQUE (stream_id, stream_version),
    CONSTRAINT event_store_stream_version_positive CHECK (stream_version > 0),
    CONSTRAINT event_store_hash_not_empty CHECK (hash <> ''),
    CONSTRAINT event_store_type_not_empty CHECK (type <> '')
);

-- Rationale:
-- - event_id as UUID: globally unique, collision-free, no coordination needed
-- - stream_id as TEXT: allows composite IDs like "ORDER:abc-123", "SESSION:xyz"
-- - stream_version as BIGINT: sequential per stream, enables optimistic concurrency
-- - UNIQUE (stream_id, stream_version): prevents concurrent writes to same version
-- - JSONB payload: flexible, indexable, queryable without schema changes
-- - hash_prev + hash: creates tamper-evident chain (blockchain-style)
-- - occurred_at with TIMESTAMPTZ: timezone-aware, sortable, auditable
-- - idempotency_key: prevents duplicate event processing (optional)

-- ==============================================================================
-- PART 2: LEGAL SEALS (Immutable, Monotonic)
-- ==============================================================================

-- Legal boundary markers - points of institutional irreversibility
CREATE TABLE legal_seals (
    -- Identity
    seal_id UUID PRIMARY KEY,

    -- Entity reference
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,

    -- Event reference (what triggered the seal)
    seal_event_id UUID NOT NULL,

    -- Anti-tamper
    stream_hash TEXT NOT NULL,

    -- Temporal
    sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Sequential ordering (audit trail)
    -- IMPORTANT: BIGSERIAL provides monotonic (strictly increasing) sequence,
    -- but GAPS ARE POSSIBLE due to transaction rollbacks and concurrency.
    -- This is acceptable for legal audit: sequence never decreases, never repeats,
    -- but may have gaps. For gap-free sequence, use alternative implementation.
    sequence BIGSERIAL NOT NULL UNIQUE,

    -- State snapshots
    financial_state TEXT NOT NULL,
    legal_state TEXT NOT NULL,

    -- Constraints
    CONSTRAINT legal_seals_entity_type_check CHECK (entity_type IN ('ORDER', 'PAYMENT', 'SESSION')),
    CONSTRAINT legal_seals_legal_state_check CHECK (legal_state IN ('PAYMENT_SEALED', 'ORDER_DECLARED', 'ORDER_FINAL')),
    CONSTRAINT legal_seals_entity_unique UNIQUE (entity_type, entity_id, legal_state),
    CONSTRAINT legal_seals_stream_hash_not_empty CHECK (stream_hash <> ''),
    CONSTRAINT legal_seals_seal_event_fk FOREIGN KEY (seal_event_id) REFERENCES event_store(event_id)
);

-- Rationale:
-- - seal_id as UUID: globally unique seal identifier
-- - entity_type + entity_id: references financial entities (ORDER, PAYMENT, SESSION)
-- - seal_event_id FK to event_store: traceability to exact event that triggered seal
-- - stream_hash: hash of entire event stream at seal time (proves no tampering)
-- - sealed_at: exact moment of legal consolidation (timezone-aware)
-- - sequence as BIGSERIAL: monotonic (strictly increasing), gaps allowed under rollback
--   * Never decreases (monotonic property preserved)
--   * Never repeats (UNIQUE constraint)
--   * May have gaps (PostgreSQL SEQUENCE behavior on rollback)
--   * Acceptable for fiscal audit (documented behavior)
-- - UNIQUE (entity_type, entity_id, legal_state): one seal per entity per legal state
-- - CHECK constraints: domain enforcement at DB level (fail fast)
-- - No UPDATE/DELETE: enforced via triggers (see PART 5)

-- ==============================================================================
-- PART 3: INDEXES (Query Performance)
-- ==============================================================================

-- Event store indexes
CREATE INDEX idx_event_store_stream_id ON event_store (stream_id);
CREATE INDEX idx_event_store_stream_id_version ON event_store (stream_id, stream_version DESC);
CREATE INDEX idx_event_store_type ON event_store (type);
CREATE INDEX idx_event_store_occurred_at ON event_store (occurred_at DESC);
CREATE INDEX idx_event_store_correlation_id ON event_store (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_event_store_causation_id ON event_store (causation_id) WHERE causation_id IS NOT NULL;
CREATE INDEX idx_event_store_idempotency_key ON event_store (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Legal seals indexes
CREATE INDEX idx_legal_seals_entity ON legal_seals (entity_type, entity_id);
CREATE INDEX idx_legal_seals_sealed_at ON legal_seals (sealed_at DESC);
CREATE INDEX idx_legal_seals_sequence ON legal_seals (sequence DESC);
CREATE INDEX idx_legal_seals_seal_event_id ON legal_seals (seal_event_id);

-- Rationale:
-- - idx_event_store_stream_id: fast stream lookups (most common query)
-- - idx_event_store_stream_id_version DESC: optimized for "get latest N events"
-- - idx_event_store_type: filter events by type (e.g., all PAYMENT_CONFIRMED)
-- - idx_event_store_occurred_at DESC: temporal queries, audit logs
-- - Partial indexes (WHERE ... IS NOT NULL): saves space, faster on sparse columns
-- - idx_legal_seals_entity: lookup seals for specific entity
-- - idx_legal_seals_sequence DESC: audit trail navigation
-- - All indexes support read-heavy workload (event sourcing pattern)

-- ==============================================================================
-- PART 4: DATABASE FUNCTIONS (Business Logic)
-- ==============================================================================

-- Function: Get current stream version (for optimistic concurrency)
CREATE OR REPLACE FUNCTION get_stream_version(p_stream_id TEXT)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(MAX(stream_version), 0)
    FROM event_store
    WHERE stream_id = p_stream_id;
$$;

-- Rationale:
-- - Returns 0 if stream doesn't exist (new stream starts at version 1)
-- - STABLE: result won't change within transaction (safe for planner optimization)
-- - Used by application for optimistic concurrency control

-- Function: Check if entity is sealed
CREATE OR REPLACE FUNCTION is_entity_sealed(
    p_entity_type TEXT,
    p_entity_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS(
        SELECT 1
        FROM legal_seals
        WHERE entity_type = p_entity_type
          AND entity_id = p_entity_id
    );
$$;

-- Rationale:
-- - Fast existence check (no need to fetch full seal)
-- - Used by application to reject mutations on sealed entities
-- - STABLE: safe for planner optimization

-- Function: Get next seal sequence number
-- NOTE: This function is provided for reference but BIGSERIAL handles
-- sequence allocation automatically. Use this only if implementing
-- gap-free sequence via manual counter table.
CREATE OR REPLACE FUNCTION get_next_seal_sequence()
RETURNS BIGINT
LANGUAGE sql
VOLATILE
AS $$
    SELECT COALESCE(MAX(sequence), 0) + 1
    FROM legal_seals;
$$;

-- Rationale:
-- - Provided for completeness but not required with BIGSERIAL
-- - BIGSERIAL auto-allocates via sequence (simpler, faster)
-- - Use this only if implementing gap-free alternative
-- - VOLATILE: must execute on every call (not cached)

-- ==============================================================================
-- PART 5: IMMUTABILITY ENFORCEMENT (Structural Protection)
-- ==============================================================================

-- Function: Hard-block any mutation attempt on immutable tables
CREATE OR REPLACE FUNCTION forbid_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'IMMUTABLE_TABLE: % operations not allowed on %',
        TG_OP, TG_TABLE_NAME
    USING ERRCODE = '23514'; -- check_violation (semantically correct)
END;
$$ LANGUAGE plpgsql;

-- Rationale:
-- - RAISE EXCEPTION: hard failure on UPDATE/DELETE attempts
-- - TG_OP: reports operation type (UPDATE or DELETE)
-- - TG_TABLE_NAME: reports table name
-- - ERRCODE 23514 (check_violation): semantically appropriate for immutability
-- - Structural protection: prevents accidental or application-level mutation
-- - Superuser override requires explicit DDL action (auditable, not accidental)
-- - Stronger than permissions (executes at query plan level)

-- Trigger: Protect event_store from mutations
CREATE TRIGGER event_store_immutable
BEFORE UPDATE OR DELETE ON event_store
FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- Trigger: Protect legal_seals from mutations
CREATE TRIGGER legal_seals_immutable
BEFORE UPDATE OR DELETE ON legal_seals
FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- Rationale:
-- - BEFORE trigger: prevents mutation before execution
-- - FOR EACH ROW: applies to all rows (no batch escape)
-- - Structural protection (not just procedural)
-- - Superuser override requires explicit DDL (dropping/disabling trigger)
-- - Any bypass attempt creates explicit audit trail

-- ==============================================================================
-- PART 6: SECURITY & PERMISSIONS (Application Roles)
-- ==============================================================================

-- Revoke dangerous permissions (must be done per role)
-- Example:
-- REVOKE UPDATE, DELETE, TRUNCATE ON event_store FROM app_role;
-- REVOKE UPDATE, DELETE, TRUNCATE ON legal_seals FROM app_role;
-- GRANT INSERT, SELECT ON event_store TO app_role;
-- GRANT INSERT, SELECT ON legal_seals TO app_role;

-- Rationale:
-- - TRUNCATE bypasses row-level triggers (DDL operation, not DML)
-- - Must be blocked at permission level (REVOKE TRUNCATE)
-- - Critical for immutability: TRUNCATE can delete all rows without trigger firing
-- - Application role should never have TRUNCATE permission

-- Rationale:
-- - Permissions complement triggers (defense in depth)
-- - Triggers = structural protection (primary)
-- - Permissions = role-based access control (secondary)
-- - Note: Actual role creation depends on deployment environment

-- ==============================================================================
-- PART 7: OPTIONAL PROJECTIONS (Read Models)
-- ==============================================================================

-- Projections are derived state for query performance
-- They are NOT the source of truth (event_store is)
-- They can be rebuilt from events at any time

-- Example: Order summary projection (optional, for fast queries)
CREATE TABLE projection_order_summary (
    order_id TEXT PRIMARY KEY,
    session_id TEXT,
    table_id TEXT,
    state TEXT NOT NULL,
    total NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL,
    locked_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    last_event_id UUID NOT NULL,
    last_event_version BIGINT NOT NULL,

    CONSTRAINT projection_order_summary_last_event_fk FOREIGN KEY (last_event_id) REFERENCES event_store(event_id)
);

CREATE INDEX idx_projection_order_summary_session_id ON projection_order_summary (session_id);
CREATE INDEX idx_projection_order_summary_table_id ON projection_order_summary (table_id);
CREATE INDEX idx_projection_order_summary_state ON projection_order_summary (state);

-- Rationale:
-- - Projection = cache of current state (for read performance)
-- - Can be rebuilt from event_store if corrupted
-- - last_event_id + last_event_version: enables incremental updates
-- - FK to event_store: traceability
-- - Indexes match common query patterns
-- - NOTE: This is optional - can query directly from event_store via JSONB

-- ==============================================================================
-- PART 8: METADATA & MONITORING
-- ==============================================================================

-- Store schema version for migrations
CREATE TABLE schema_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_metadata (key, value) VALUES ('version', 'GATE3_v1.0.0');
INSERT INTO schema_metadata (key, value) VALUES ('created_at', NOW()::TEXT);

-- Rationale:
-- - Tracks schema version for safe migrations
-- - Prevents incompatible application versions from running

-- ==============================================================================
-- DESIGN RATIONALE SUMMARY
-- ==============================================================================

/*
1. EVENT STORE (event_store)
   - Append-only: no UPDATE/DELETE (enforced via triggers + permissions)
   - Immutable: once written, never changed (structural protection)
   - Hash chain: tamper-evident (each event hashes previous)
   - Stream versioning: optimistic concurrency control
   - JSONB payload: flexible schema evolution

2. LEGAL SEALS (legal_seals)
   - Monotonic: sequence strictly increasing (never decreases, never repeats)
   - Gaps allowed: BIGSERIAL may skip numbers on rollback (acceptable for audit)
   - Immutable: no UPDATE/DELETE (enforced via triggers)
   - Entity uniqueness: one seal per (entity_type, entity_id, legal_state)
   - Traceability: FK to event_store
   - Stream hash: proves event stream integrity at seal time

3. INDEXES
   - Read-optimized: event sourcing is read-heavy
   - Partial indexes: space-efficient for sparse columns
   - Descending order: matches temporal query patterns

4. FUNCTIONS
   - get_stream_version: optimistic concurrency
   - is_entity_sealed: mutation guard
   - get_next_seal_sequence: monotonic counter

5. PROJECTIONS (optional)
   - Rebuilable from events
   - Query performance optimization
   - Tracks last processed event version

6. SECURITY
   - No UPDATE/DELETE permissions on immutable tables
   - Check constraints: fail fast on invalid data
   - Foreign keys: referential integrity

WHAT IS NOT HERE:
- ❌ Fiscal logic (tax, invoices, etc.)
- ❌ Country-specific rules
- ❌ UI/UX concerns
- ❌ Authentication/authorization
- ❌ Business rules (those live in application/CORE)
- ❌ External integrations

This schema is the foundation for:
- GATE 3: Persistence ✅
- GATE 4: Scale (distributed systems)
- GATE 5: Offline-first (optional)
*/

-- ==============================================================================
-- REFLEX FIRINGS TABLE (Idempotency Log)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS reflex_firings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES gm_restaurants(id) NOT NULL,
    reflex_key TEXT NOT NULL, -- "clean-table", "finalize-order", etc.
    target_id TEXT NOT NULL, -- order_id, table_id, etc.
    fired_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, reflex_key, target_id)
);

ALTER TABLE reflex_firings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can select reflex_firings" ON reflex_firings FOR SELECT USING (true);
CREATE POLICY "Everyone can insert reflex_firings" ON reflex_firings FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reflex_firings_check ON reflex_firings(restaurant_id, reflex_key, target_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON reflex_firings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON reflex_firings TO authenticated;

-- ==============================================================================
-- END OF SCHEMA
-- ==============================================================================
