-- GATE 3: Persistence Layer Schema
-- Defines the Immutable Event Store and Legal Seal Log
--
-- TARGET: PostgreSQL 14+
-- STATUS: DRAFT (Audit Grade)
-- ============================================================================
-- 0. EXTENSIONS & UTILS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Generic function to prevent updates/deletes (Immutability Enforcer)
CREATE OR REPLACE FUNCTION prevent_immutable_modification() RETURNS TRIGGER AS $$ BEGIN RAISE EXCEPTION 'IMMUTABLE_VIOLATION: Table % is append-only. Update/Delete not allowed.',
    TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- 1. EVENT STORE (The Source of Truth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_store (
    -- Global Monotonic Sequence (Critical for Replay)
    sequence_id BIGSERIAL PRIMARY KEY,
    -- Idempotency Key
    event_id UUID UNIQUE NOT NULL,
    -- Stream Identification (e.g. ORDER, ord-123)
    stream_type VARCHAR(50) NOT NULL,
    stream_id VARCHAR(100) NOT NULL,
    stream_version INTEGER NOT NULL,
    -- Event Semantics
    event_type VARCHAR(100) NOT NULL,
    -- Data (Immutable Facts)
    payload JSONB NOT NULL DEFAULT '{}',
    meta JSONB NOT NULL DEFAULT '{}',
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Optimistic Concurrency Control
    CONSTRAINT uq_event_stream_version UNIQUE (stream_type, stream_id, stream_version)
);
-- Indices for Performance
CREATE INDEX IF NOT EXISTS idx_event_stream ON event_store(stream_type, stream_id, sequence_id);
CREATE INDEX IF NOT EXISTS idx_event_type ON event_store(event_type, created_at);
-- IMMUTABILITY TRIGGER
CREATE TRIGGER trg_event_store_immutable BEFORE
UPDATE
    OR DELETE ON event_store FOR EACH ROW EXECUTE FUNCTION prevent_immutable_modification();
-- ============================================================================
-- 2. LEGAL SEALS (The Institutional Memory)
-- ============================================================================
CREATE TABLE IF NOT EXISTS legal_seals (
    -- Global Legal Sequence (Independent of Event Sequence)
    legal_sequence_id BIGSERIAL PRIMARY KEY,
    -- Human Readable Seal ID (e.g. seal_ORDER_123_FINAL_456)
    seal_id VARCHAR(255) UNIQUE NOT NULL,
    -- Target Entity
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    -- Legal State (e.g. PAYMENT_SEALED, ORDER_FINAL)
    legal_state VARCHAR(50) NOT NULL,
    -- The Causal Link (Proof of Origin)
    -- If the Event rollback, the Seal must logically disappear (via Transaction atomicity)
    -- but if committed, it is structurally linked.
    seal_event_id UUID NOT NULL REFERENCES event_store(event_id),
    -- Integrity Check
    stream_hash VARCHAR(255) NOT NULL,
    -- Fact Snapshot (Financial State at moment of sealing)
    financial_state_snapshot JSONB NOT NULL,
    -- Audit
    sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraints
    -- 1. Legal State Uniqueness (Idempotency) happens at App level, 
    --    but we enforce strict uniqueness here per entity to be safe.
    CONSTRAINT uq_legal_seal_state UNIQUE (entity_type, entity_id, legal_state)
);
-- Indices
CREATE INDEX IF NOT EXISTS idx_legal_lookup ON legal_seals(entity_type, entity_id);
-- IMMUTABILITY TRIGGER
CREATE TRIGGER trg_legal_seals_immutable BEFORE
UPDATE
    OR DELETE ON legal_seals FOR EACH ROW EXECUTE FUNCTION prevent_immutable_modification();
-- ============================================================================
-- 3. AUDIT NOTES
-- ============================================================================
-- - All sequences are GAP-ALLOWED (standard Postgres behavior on rollback).
-- - Gaps in sequence_id do NOT invalidate audit (only order matters).
-- - Transactions must wrap insert(event) + insert(seal).