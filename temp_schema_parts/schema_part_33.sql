-- MIGRATION: Create Integration Secrets Vault
-- Date: 2026-01-28
-- Purpose: Store extensive integration credentials (Glovo, Uber, Deliveroo) securely.
-- Security Model: "Air Gap" - Frontend CANNOT read this table. Only Edge Functions (Service Role) can.

CREATE TABLE IF NOT EXISTS public.gm_integration_secrets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'glovo', 'uber', 'deliveroo'
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store client_id, client_secret, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uq_restaurant_provider UNIQUE (restaurant_id, provider)
);

-- Indexes
CREATE INDEX idx_integration_secrets_restaurant ON public.gm_integration_secrets(restaurant_id);

-- Enable RLS
ALTER TABLE public.gm_integration_secrets ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- 1. Service Role (Full Access) - For Edge Functions
CREATE POLICY "Service Role Full Access"
ON public.gm_integration_secrets
FOR ALL
USING (auth.role() = 'service_role');

-- 2. NO ACCESS for anyone else (Authenticated, Anon)
-- Validating: Does Supabase default to Deny All if no policy matches? YES.
-- So we strictly define ONLY the service role policy.

-- Comments
COMMENT ON TABLE public.gm_integration_secrets IS 'Secure Vault for Integration Secrets. Not accessible by Frontend.';
;
-- Enable Realtime for integration_orders
-- Date: 2026-01-28

-- Add table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_orders;

-- Comment
COMMENT ON TABLE public.integration_orders IS 'Realtime enabled for Delivery Integration monitoring';
;
-- Migration: Add Idempotency and Sequence ID to event_store
-- Date: 2026-01-29 (Planned)

-- 1. Add Sequence ID (Global Ordering)
ALTER TABLE public.event_store
ADD COLUMN IF NOT EXISTS sequence_id BIGSERIAL; -- Implicitly unique index? No, purely generator.
-- Note: BIGSERIAL creates a sequence.

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_sequence ON public.event_store(sequence_id);

-- 2. Add Idempotency Key (Risk 3 Solved)
-- We need to extract idempotency_key from JSONB meta if it exists or add a column.
-- The audit recommended checking (stream_id, idempotency_key).
-- We'll add a generated column or functional unique index?
-- Easier: Add explicit optional column for indexability and constraint.

ALTER TABLE public.event_store
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Populate it from meta for existing records?
UPDATE public.event_store
SET idempotency_key = meta->>'idempotency_key'
WHERE idempotency_key IS NULL AND meta->>'idempotency_key' IS NOT NULL;

-- 3. Constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_idempotency 
ON public.event_store(stream_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 4. Comments
COMMENT ON COLUMN public.event_store.sequence_id IS 'Global monotonic cursor for replay/subscription.';
COMMENT ON COLUMN public.event_store.idempotency_key IS 'Deduplication key. Unique per stream.';
;
