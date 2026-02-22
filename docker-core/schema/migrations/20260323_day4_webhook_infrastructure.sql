-- =============================================================================
-- Day 4: Webhook Infrastructure & SumUp Payment Integration
-- =============================================================================
-- Purpose: Receive and persist webhook events from payment processors
-- Implements: Idempotent webhook handling, signature verification, delivery logs
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Webhook Event Log Table
-- =============================================================================
-- Records ALL inbound webhook events for audit trail & replay capability

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event metadata
  provider TEXT NOT NULL CHECK (provider IN ('sumup', 'stripe', 'custom')),
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE, -- Provider's event ID (prevents duplicates)

  -- Authentication
  signature TEXT,
  signature_algorithm TEXT DEFAULT 'hmac-sha256',
  signature_verified BOOLEAN DEFAULT FALSE,

  -- Payload
  raw_payload JSONB NOT NULL,
  processed_payload JSONB,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received',
    'verified',
    'processed',
    'failed',
    'duplicate',
    'invalid_signature'
  )),

  processing_error TEXT,

  -- Tracking
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status
  ON public.webhook_events(provider, status);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
  ON public.webhook_events(event_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON public.webhook_events(received_at DESC);

-- =============================================================================
-- 2. Webhook Delivery Log Table
-- =============================================================================
-- Tracks outbound webhook deliveries & retries (for outbound webhooks)

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What & where
  event_id UUID NOT NULL REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,

  -- Delivery details
  http_method TEXT DEFAULT 'POST',
  http_status_code INT,
  response_body TEXT,

  -- Retry logic
  attempt_number INT DEFAULT 1,
  max_attempts INT DEFAULT 4,
  next_retry_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'delivered',
    'failed',
    'max_retries_exceeded',
    'permanent_error'
  )),

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for retry logic
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry
  ON public.webhook_deliveries(next_retry_at)
  WHERE next_retry_at IS NOT NULL AND status = 'pending';

-- =============================================================================
-- 3. Webhook Configuration Table
-- =============================================================================
-- Stores API keys and secrets for webhook signature verification

CREATE TABLE IF NOT EXISTS public.webhook_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider configuration
  provider TEXT NOT NULL CHECK (provider IN ('sumup', 'stripe', 'custom')),
  restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,

  -- Secret storage (encrypted in production)
  secret_key TEXT NOT NULL, -- MUST be encrypted in production
  api_key TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  webhook_url TEXT NOT NULL,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_secrets_provider
  ON public.webhook_secrets(provider, is_active);

-- =============================================================================
-- 4. RPC: Process Webhook Event (Idempotent)
-- =============================================================================
-- Handles incoming webhook event atomically
-- Returns: { success, event_id, message }

CREATE OR REPLACE FUNCTION public.process_webhook_event(
  p_provider TEXT,
  p_event_type TEXT,
  p_event_id TEXT,
  p_payload JSONB,
  p_signature TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  event_id TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_webhook_event_id UUID;
  v_existing_event_id TEXT;
  v_status TEXT;
BEGIN
  -- 1. Check for duplicate (idempotency)
  SELECT event_id INTO v_existing_event_id
  FROM public.webhook_events
  WHERE provider = p_provider AND event_id = p_event_id
  LIMIT 1;

  IF v_existing_event_id IS NOT NULL THEN
    -- Event already processed or in progress
    RETURN QUERY
    SELECT TRUE, v_existing_event_id, 'Duplicate event ignored (idempotent)';
    RETURN;
  END IF;

  -- 2. Insert webhook event record
  INSERT INTO public.webhook_events (
    provider,
    event_type,
    event_id,
    signature,
    raw_payload,
    status
  ) VALUES (
    p_provider,
    p_event_type,
    p_event_id,
    p_signature,
    p_payload,
    CASE
      WHEN p_signature IS NULL THEN 'received'
      ELSE 'received'
    END
  )
  RETURNING id INTO v_webhook_event_id;

  -- 3. TODO: Verify signature (will call external service)
  -- For now, mark as received and let integration-gateway verify

  RETURN QUERY
  SELECT
    TRUE,
    p_event_id,
    'Webhook event recorded and queued for processing';
END;
$$;

-- =============================================================================
-- 5. RPC: Mark Event as Processed
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mark_webhook_processed(
  p_webhook_event_id UUID,
  p_processed_payload JSONB DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.webhook_events
  SET
    status = 'processed',
    processed_payload = COALESCE(p_processed_payload, processed_payload),
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_webhook_event_id;

  RETURN QUERY
  SELECT TRUE, 'Webhook marked as processed';
END;
$$;

-- =============================================================================
-- 6. RPC: Mark Event as Failed
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mark_webhook_failed(
  p_webhook_event_id UUID,
  p_error_message TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.webhook_events
  SET
    status = 'failed',
    processing_error = p_error_message,
    updated_at = NOW()
  WHERE id = p_webhook_event_id;

  RETURN QUERY
  SELECT TRUE, 'Webhook marked as failed';
END;
$$;

-- =============================================================================
-- 7. RPC: Get Pending Webhooks
-- =============================================================================
-- For integration-gateway to find unprocessed events

CREATE OR REPLACE FUNCTION public.get_pending_webhooks()
RETURNS TABLE(
  event_id UUID,
  provider TEXT,
  event_type TEXT,
  raw_payload JSONB,
  received_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    provider,
    event_type,
    raw_payload,
    received_at
  FROM public.webhook_events
  WHERE status IN ('received', 'verified')
  ORDER BY received_at ASC;
END;
$$;

-- =============================================================================
-- 8. Permissions & Security
-- =============================================================================

GRANT SELECT, INSERT ON public.webhook_events TO service_role;
GRANT SELECT, INSERT ON public.webhook_deliveries TO service_role;
GRANT SELECT ON public.webhook_secrets TO service_role;

GRANT EXECUTE ON FUNCTION public.process_webhook_event TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_webhook_processed TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_webhook_failed TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_webhooks TO service_role;

REVOKE ALL ON public.webhook_events FROM anon;
REVOKE ALL ON public.webhook_deliveries FROM anon;
REVOKE ALL ON public.webhook_secrets FROM anon;

COMMIT;
