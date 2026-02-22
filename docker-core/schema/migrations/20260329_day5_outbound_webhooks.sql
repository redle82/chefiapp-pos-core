-- =============================================================================
-- Day 5: Outbound Webhook Delivery & Retry Logic
-- =============================================================================
-- Purpose: Send processed events to restaurant-configured webhooks
-- Implements: Exponential backoff, delivery tracking, idempotent retries
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. RPC: Schedule Webhook Delivery
-- =============================================================================
-- Called after webhook is verified/processed, schedules delivery to restaurant
-- Handles: Creating delivery record, calculating next_retry_at

CREATE OR REPLACE FUNCTION public.schedule_webhook_delivery(
  p_event_id UUID,
  p_restaurant_id UUID,
  p_webhook_url TEXT DEFAULT NULL,
  p_retries_allowed INT DEFAULT 3
)
RETURNS TABLE(
  success BOOLEAN,
  delivery_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_delivery_id UUID;
  v_webhook_url TEXT;
  v_event_exists BOOLEAN;
BEGIN
  -- 1. Verify webhook event exists
  SELECT EXISTS(SELECT 1 FROM public.webhook_events WHERE id = p_event_id)
  INTO v_event_exists;

  IF NOT v_event_exists THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Webhook event not found';
    RETURN;
  END IF;

  -- 2. Get webhook URL from config if not provided
  IF p_webhook_url IS NULL THEN
    SELECT webhook_url INTO v_webhook_url
    FROM public.webhook_secrets
    WHERE restaurant_id = p_restaurant_id
      AND provider = 'custom'
      AND is_active = TRUE
    LIMIT 1;

    IF v_webhook_url IS NULL THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, 'No webhook URL configured for restaurant';
      RETURN;
    END IF;
  ELSE
    v_webhook_url := p_webhook_url;
  END IF;

  -- 3. Create delivery record (initially pending, no retry yet)
  INSERT INTO public.webhook_deliveries (
    event_id,
    webhook_url,
    http_method,
    attempt_number,
    max_attempts,
    status,
    next_retry_at
  ) VALUES (
    p_event_id,
    v_webhook_url,
    'POST',
    0,  -- Hasn't been attempted yet
    p_retries_allowed + 1,  -- Total attempts = retries + initial
    'pending',
    NOW()  -- Attempt immediately first
  )
  RETURNING id INTO v_delivery_id;

  RETURN QUERY
  SELECT
    TRUE,
    v_delivery_id,
    'Webhook delivery scheduled for ' || v_webhook_url;
END;
$$;

-- =============================================================================
-- 2. RPC: Get Pending Deliveries (for batch processing)
-- =============================================================================
-- Called by integration-gateway worker to find webhooks to deliver

CREATE OR REPLACE FUNCTION public.get_pending_deliveries(
  p_limit INT DEFAULT 100
)
RETURNS TABLE(
  delivery_id UUID,
  event_id UUID,
  webhook_url TEXT,
  raw_payload JSONB,
  processed_payload JSONB,
  attempt_number INT,
  max_attempts INT,
  provider TEXT,
  event_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.id,
    wd.event_id,
    wd.webhook_url,
    we.raw_payload,
    we.processed_payload,
    wd.attempt_number,
    wd.max_attempts,
    we.provider,
    we.event_type
  FROM public.webhook_deliveries wd
  JOIN public.webhook_events we ON wd.event_id = we.id
  WHERE wd.status = 'pending'
    AND wd.next_retry_at <= NOW()
  ORDER BY wd.created_at ASC
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- 3. RPC: Mark Delivery as Sent
-- =============================================================================
-- Call after successfully delivering webhook (HTTP 2xx response)

CREATE OR REPLACE FUNCTION public.mark_delivery_sent(
  p_delivery_id UUID,
  p_http_status_code INT,
  p_response_body TEXT DEFAULT NULL
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
  UPDATE public.webhook_deliveries
  SET
    status = CASE
      WHEN p_http_status_code >= 200 AND p_http_status_code < 300 THEN 'delivered'
      WHEN p_http_status_code >= 400 AND p_http_status_code < 500 THEN 'permanent_error'
      ELSE 'failed'
    END,
    http_status_code = p_http_status_code,
    response_body = p_response_body,
    sent_at = NOW(),
    updated_at = NOW()
  WHERE id = p_delivery_id;

  RETURN QUERY SELECT TRUE, 'Delivery marked as sent';
END;
$$;

-- =============================================================================
-- 4. RPC: Schedule Retry with Exponential Backoff
-- =============================================================================
-- Call after failed delivery attempt
-- Backoff: 5s, 25s, 125s, 625s (5^n), capped at 1 hour
-- Formula: next_delay = min(5 * (5 ^ attempt), 3600)

CREATE OR REPLACE FUNCTION public.mark_delivery_retry(
  p_delivery_id UUID,
  p_http_status_code INT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  will_retry BOOLEAN,
  next_retry_at TIMESTAMPTZ,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_attempt INT;
  v_max_attempts INT;
  v_backoff_seconds INT;
  v_next_retry_time TIMESTAMPTZ;
  v_will_retry BOOLEAN;
BEGIN
  -- 1. Get current attempt count and max
  SELECT attempt_number, max_attempts INTO v_next_attempt, v_max_attempts
  FROM public.webhook_deliveries
  WHERE id = p_delivery_id;

  -- 2. Increment attempt counter
  v_next_attempt := v_next_attempt + 1;

  -- 3. Calculate exponential backoff: 5 * (5^attempt), capped at 3600s (1 hour)
  -- Attempt 1: 5 * 5^1 = 25 seconds
  -- Attempt 2: 5 * 5^2 = 125 seconds
  -- Attempt 3: 5 * 5^3 = 625 seconds (~10 min)
  -- Attempt 4: 5 * 5^4 = 3125 seconds (~52 min, capped at 1 hour)
  v_backoff_seconds := LEAST(5 * POWER(5, v_next_attempt)::INT, 3600);

  -- 4. Determine if we should retry
  v_will_retry := v_next_attempt < v_max_attempts
    AND p_http_status_code NOT BETWEEN 400 AND 499;

  -- 5. Update delivery record
  v_next_retry_time := CASE
    WHEN v_will_retry THEN NOW() + (v_backoff_seconds || ' seconds')::INTERVAL
    ELSE NULL
  END;

  UPDATE public.webhook_deliveries
  SET
    status = CASE
      WHEN v_will_retry THEN 'pending'
      ELSE 'max_retries_exceeded'
    END,
    attempt_number = v_next_attempt,
    http_status_code = p_http_status_code,
    next_retry_at = v_next_retry_time,
    updated_at = NOW()
  WHERE id = p_delivery_id;

  RETURN QUERY
  SELECT
    TRUE,
    v_will_retry,
    v_next_retry_time,
    CASE
      WHEN v_will_retry THEN 'Retry scheduled in ' || v_backoff_seconds || 's (attempt ' || v_next_attempt || '/' || v_max_attempts || ')'
      ELSE 'Max retries exceeded after ' || v_next_attempt || ' attempts'
    END;
END;
$$;

-- =============================================================================
-- 5. RPC: Get Delivery Status (for monitoring)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_delivery_status(
  p_delivery_id UUID
)
RETURNS TABLE(
  status TEXT,
  attempt_number INT,
  max_attempts INT,
  next_retry_at TIMESTAMPTZ,
  http_status_code INT,
  webhook_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.status,
    wd.attempt_number,
    wd.max_attempts,
    wd.next_retry_at,
    wd.http_status_code,
    wd.webhook_url
  FROM public.webhook_deliveries wd
  WHERE wd.id = p_delivery_id;
END;
$$;

-- =============================================================================
-- 6. RPC: Trigger Outbound Webhooks (after SumUp payment received)
-- =============================================================================
-- Called when payment webhook is processed and verified
-- Schedules delivery to:
--   1. Restaurant's webhook URL
--   2. Integration partners' webhooks

CREATE OR REPLACE FUNCTION public.trigger_outbound_webhooks_after_payment(
  p_event_id UUID,
  p_restaurant_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  deliveries_scheduled INT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_delivery_count INT := 0;
  v_webhook_config RECORD;
BEGIN
  -- 1. Find all active webhooks for this restaurant
  FOR v_webhook_config IN
    SELECT id, webhook_url, provider
    FROM public.webhook_secrets
    WHERE restaurant_id = p_restaurant_id
      AND is_active = TRUE
  LOOP
    -- 2. Schedule delivery for each webhook
    PERFORM schedule_webhook_delivery(
      p_event_id,
      p_restaurant_id,
      v_webhook_config.webhook_url,
      3  -- Allow 3 retries
    );
    v_delivery_count := v_delivery_count + 1;
  END LOOP;

  RETURN QUERY
  SELECT
    TRUE,
    v_delivery_count,
    'Scheduled ' || v_delivery_count || ' outbound webhook deliveries';
END;
$$;

-- =============================================================================
-- 7. Permissions & Security
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.schedule_webhook_delivery TO service_role;
GRANT EXECUTE ON FUNCTION public.get_pending_deliveries TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_delivery_sent TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_delivery_retry TO service_role;
GRANT EXECUTE ON FUNCTION public.get_delivery_status TO service_role;
GRANT EXECUTE ON FUNCTION public.trigger_outbound_webhooks_after_payment TO service_role;

-- Only service_role can update delivery status
REVOKE ALL ON public.webhook_deliveries FROM anon, authenticated;
GRANT SELECT ON public.webhook_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.webhook_deliveries TO service_role;

COMMIT;
