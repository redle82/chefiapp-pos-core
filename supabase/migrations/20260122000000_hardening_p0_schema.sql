-- Hardening P0: Core Consistency & Security
-- Date: 2026-01-22
-- Purpose: Enforce strict schema for Event Store and Legal Seals (UUIDs, FKs, Concurrency)

-- 1. Event Store (The Immutable Truth)
-- Optimized for "Append Only" with strict concurrency control.
CREATE TABLE IF NOT EXISTS public.event_store (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Global Unique ID
    stream_type TEXT NOT NULL, -- e.g., 'order', 'payment'
    stream_id TEXT NOT NULL,   -- e.g., the UUID of the entity
    stream_version INTEGER NOT NULL, -- 1, 2, 3... (Strict Ordering)
    event_type TEXT NOT NULL, -- e.g., 'OrderCreated'
    payload JSONB NOT NULL, -- The fact data
    meta JSONB DEFAULT '{}'::jsonb, -- Metadata (actor, correlation, causation)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Concurrency Guard: Cannot have two events with same version in same stream
    CONSTRAINT uq_event_stream_version UNIQUE(stream_type, stream_id, stream_version)
);

-- Performance Indexes for Event Store
CREATE INDEX IF NOT EXISTS idx_event_store_lookup ON public.event_store(stream_type, stream_id);
CREATE INDEX IF NOT EXISTS idx_event_store_global_order ON public.event_store(created_at, event_id); -- For global replay
CREATE INDEX IF NOT EXISTS idx_event_store_type ON public.event_store(event_type); -- For projection rebuilding

-- 2. Legal Seals (The Audit Chain)
-- Stores the "Sealed" state of an entity at a point in time.
CREATE TABLE IF NOT EXISTS public.legal_seals (
    seal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Fixed: UUID v4
    entity_type TEXT NOT NULL, -- 'ORDER', 'PAYMENT', 'SESSION'
    entity_id TEXT NOT NULL, -- The ID of the sealed entity
    
    -- Link to the Event that triggered the seal (The "Why")
    -- Enforces that a seal must point to a real financial fact.
    seal_event_id UUID NOT NULL REFERENCES public.event_store(event_id),
    
    stream_hash TEXT NOT NULL, -- Crypto hash of the stream up to this point
    financial_state_snapshot JSONB NOT NULL, -- The state being sealed
    legal_state TEXT NOT NULL, -- logic state e.g., 'FISCAL_READY'
    
    sealed_at TIMESTAMPTZ DEFAULT NOW(),
    legal_sequence_id BIGSERIAL NOT NULL, -- Monotonic sequence for auditors
    
    -- Constraints
    CONSTRAINT uq_legal_seal_event UNIQUE(seal_event_id) -- One seal per event
);

-- Performance Indexes for Legal Seals
CREATE INDEX IF NOT EXISTS idx_legal_seals_entity ON public.legal_seals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_legal_seals_sequence ON public.legal_seals(legal_sequence_id);

-- 3. RLS Policies (Hardened)
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_seals ENABLE ROW LEVEL SECURITY;

-- Policy: Service Role (Backend) has full access
-- Clients (Anon/Auth) have NO ACCESS by default. 
-- Specific policies for reading own data:

CREATE POLICY "Authenticated users can read events for their restaurants (via meta)"
ON public.event_store FOR SELECT
USING (
    -- This assumes 'meta' contains 'restaurant_id' or we join.
    -- For P0, we might strictly rely on Service Role for writing events.
    -- Reading might be allowed if we extract restaurant_id to column?
    -- For now, kept minimal: Code uses Service Role or specific defined RPCs.
    false
);

-- Comments
COMMENT ON TABLE public.event_store IS 'Core immutable ledger of all system events.';
COMMENT ON COLUMN public.event_store.stream_version IS 'Strict monotonic version for concurrency control.';
COMMENT ON TABLE public.legal_seals IS 'Audit log of "Sealed" states linked to specific events.';
