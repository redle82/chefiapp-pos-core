-- Migration: 20260116000002_fiscal_event_store.sql
-- Purpose: Fiscal Event Store (GATE 5.1) - Impressão Fiscal
-- Date: 2026-01-16
-- Note: Independent from Core Schema (but references it)

-- FISCAL SCHEMA (GATE 5.1)
-- The "Eye of Sauron" approach: Fiscal Module sees everything, but touches nothing.

-- 1. Fiscal Event Store
CREATE TABLE IF NOT EXISTS public.fiscal_event_store (
    fiscal_event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fiscal_sequence_id BIGSERIAL NOT NULL,
    
    -- Global Fiscal Ordering
    -- Linkage to Truth (The Check-Mate)
    -- Note: These references are optional for MVP (can be NULL if tables don't exist yet)
    ref_seal_id VARCHAR(255), -- References legal_seals(seal_id) if exists
    ref_event_id UUID, -- References event_store(event_id) if exists
    
    -- Linkage to Orders (for MVP, we link directly to orders)
    order_id UUID REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    
    -- Fiscal Details
    doc_type VARCHAR(50) NOT NULL, -- 'TICKETBAI', 'SAF-T', 'MOCK', etc.
    gov_protocol VARCHAR(255), -- Protocol # from Government
    
    -- Payloads (Evidence)
    payload_sent JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_received JSONB,
    
    -- Status
    fiscal_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'REPORTED', 'REJECTED', 'QUEUED', 'OFFLINE_STORED'
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Idempotency: One successful fiscal document per Order (for MVP)
    -- In production, this might be per Legal Seal
    UNIQUE(order_id, doc_type)
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_restaurant ON public.fiscal_event_store(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_order ON public.fiscal_event_store(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_status ON public.fiscal_event_store(fiscal_status);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_created_at ON public.fiscal_event_store(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fiscal_event_store_seal ON public.fiscal_event_store(ref_seal_id) WHERE ref_seal_id IS NOT NULL;

-- 3. Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_fiscal_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fiscal_modtime ON public.fiscal_event_store;
CREATE TRIGGER update_fiscal_modtime
    BEFORE UPDATE ON public.fiscal_event_store
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscal_timestamp();

-- 4. RLS Policies
ALTER TABLE public.fiscal_event_store ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant members can view fiscal events for their restaurant
CREATE POLICY "Restaurant members can view fiscal events"
ON public.fiscal_event_store FOR SELECT
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can insert fiscal events
CREATE POLICY "Restaurant members can insert fiscal events"
ON public.fiscal_event_store FOR INSERT
WITH CHECK (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- Policy: Restaurant members can update fiscal events (for status updates)
CREATE POLICY "Restaurant members can update fiscal events"
ON public.fiscal_event_store FOR UPDATE
USING (
    restaurant_id IN (
        SELECT restaurant_id FROM public.restaurant_members
        WHERE user_id = auth.uid()
    )
    OR
    restaurant_id IN (
        SELECT id FROM public.gm_restaurants
        WHERE owner_id = auth.uid()
    )
);

-- 5. Comments (Documentação)
COMMENT ON TABLE public.fiscal_event_store IS 'Fiscal Event Store (GATE 5.1) - Immutable log of fiscal documents sent to government';
COMMENT ON COLUMN public.fiscal_event_store.ref_seal_id IS 'Link to legal_seals table (if exists) - The immutable legal seal';
COMMENT ON COLUMN public.fiscal_event_store.ref_event_id IS 'Link to event_store table (if exists) - The immutable financial fact';
COMMENT ON COLUMN public.fiscal_event_store.order_id IS 'Link to gm_orders - For MVP, we link directly to orders';
COMMENT ON COLUMN public.fiscal_event_store.doc_type IS 'Type of fiscal document: TICKETBAI (Spain), SAF-T (Portugal), MOCK (testing)';
COMMENT ON COLUMN public.fiscal_event_store.gov_protocol IS 'Protocol number received from government API';
COMMENT ON COLUMN public.fiscal_event_store.payload_sent IS 'Exact payload sent to government (XML/JSON) - Evidence for audit';
COMMENT ON COLUMN public.fiscal_event_store.response_received IS 'Response received from government API';
COMMENT ON COLUMN public.fiscal_event_store.fiscal_status IS 'Status: PENDING, REPORTED, REJECTED, QUEUED, OFFLINE_STORED';
