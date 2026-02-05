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
