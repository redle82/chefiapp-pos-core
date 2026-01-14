-- ============================================================================
-- P2.2 FIX: WEBHOOK EVENT DEDUPLICATION
-- Risk: R-024 (🔴 Critical)
-- 
-- This table stores processed webhook event IDs to prevent duplicate handling.
-- Stripe (and other providers) may retry webhooks, causing double processing.
-- ============================================================================

-- Create webhook events table for deduplication
CREATE TABLE IF NOT EXISTS gm_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,           -- Provider's event ID (e.g., evt_xxx from Stripe)
    provider TEXT NOT NULL,           -- 'stripe', 'glovo', 'ubereats', etc.
    event_type TEXT NOT NULL,         -- 'payment_intent.succeeded', etc.
    tenant_id UUID,                   -- Associated tenant (if applicable)
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB,                    -- Full event payload for debugging
    
    -- Unique constraint on provider + event_id to prevent duplicates
    CONSTRAINT unique_webhook_event UNIQUE (provider, event_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event 
ON gm_webhook_events (provider, event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant 
ON gm_webhook_events (tenant_id);

-- RLS: Only service role can access
ALTER TABLE gm_webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCTION: Check if webhook was already processed
-- Returns TRUE if event exists (already processed), FALSE otherwise
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_webhook_event_exists(
    p_provider TEXT,
    p_event_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM gm_webhook_events
        WHERE provider = p_provider
          AND event_id = p_event_id
    );
END;
$$;

-- ============================================================================
-- FUNCTION: Record processed webhook event
-- Inserts event and returns success/failure
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_record_webhook_event(
    p_provider TEXT,
    p_event_id TEXT,
    p_event_type TEXT,
    p_tenant_id UUID DEFAULT NULL,
    p_payload JSONB DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO gm_webhook_events (
        provider, event_id, event_type, tenant_id, payload
    ) VALUES (
        p_provider, p_event_id, p_event_type, p_tenant_id, p_payload
    );
    RETURN TRUE;
EXCEPTION
    WHEN unique_violation THEN
        -- Already processed, return false (not an error, just duplicate)
        RETURN FALSE;
END;
$$;

-- Grant execute to service role (webhooks use service key)
GRANT EXECUTE ON FUNCTION fn_webhook_event_exists TO service_role;
GRANT EXECUTE ON FUNCTION fn_record_webhook_event TO service_role;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gm_webhook_events') THEN
        RAISE NOTICE '✓ Table gm_webhook_events created successfully';
    ELSE
        RAISE EXCEPTION '✗ Failed to create table gm_webhook_events';
    END IF;
END $$;

COMMENT ON TABLE gm_webhook_events IS 
    'P2 Fix: Webhook event deduplication to prevent duplicate processing. ' ||
    'Risk: R-024 | Status: ENFORCED | Date: 2026-01-14';
