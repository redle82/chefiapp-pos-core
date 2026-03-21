-- =============================================================================
-- Churn Recovery System — Automated recovery from payment failures
-- =============================================================================
-- Table: gm_churn_recovery_attempts
-- Extend: gm_restaurants.billing_status to include 'paused'
-- =============================================================================

-- 1. Extend billing_status CHECK to include paused and incomplete
ALTER TABLE public.gm_restaurants
  DROP CONSTRAINT IF EXISTS gm_restaurants_billing_status_check;

ALTER TABLE public.gm_restaurants
  ADD CONSTRAINT gm_restaurants_billing_status_check
  CHECK (billing_status IN ('trial', 'active', 'past_due', 'canceled', 'paused', 'incomplete'));

COMMENT ON COLUMN public.gm_restaurants.billing_status IS 'Estado da subscrição SaaS. paused = churn escalation após 3 falhas.';

-- 2. Create churn recovery attempts table
CREATE TABLE IF NOT EXISTS public.gm_churn_recovery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  billing_status_before TEXT NOT NULL,
  failure_reason TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  recovered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_churn_recovery_restaurant_id
  ON public.gm_churn_recovery_attempts(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_churn_recovery_next_retry_at
  ON public.gm_churn_recovery_attempts(next_retry_at)
  WHERE recovered = false;

COMMENT ON TABLE public.gm_churn_recovery_attempts IS 'Churn recovery: payment failure attempts, retry schedule (Day 1, 3, 5), escalation to paused after 3.';

-- 3. RPC: Detect failed payment — create or update attempt record, set next_retry_at
CREATE OR REPLACE FUNCTION public.churn_detect_failed_payment(
  p_restaurant_id UUID,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS TABLE(attempt_id UUID, attempt_count INTEGER, next_retry_at TIMESTAMPTZ, escalated BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row RECORD;
  v_attempt_count INTEGER;
  v_next_retry TIMESTAMPTZ;
  v_escalated BOOLEAN := false;
  v_status_before TEXT;
BEGIN
  SELECT billing_status INTO v_status_before
  FROM public.gm_restaurants WHERE id = p_restaurant_id;
  IF v_status_before IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.gm_churn_recovery_attempts (
    restaurant_id, billing_status_before, failure_reason,
    attempt_count, last_attempt_at, next_retry_at, recovered, updated_at
  )
  VALUES (
    p_restaurant_id, COALESCE(v_status_before, 'active'), p_failure_reason,
    1, NOW(), NOW() + INTERVAL '1 day', false, NOW()
  )
  ON CONFLICT (restaurant_id) DO UPDATE SET
    failure_reason = COALESCE(EXCLUDED.failure_reason, gm_churn_recovery_attempts.failure_reason),
    attempt_count = gm_churn_recovery_attempts.attempt_count + 1,
    last_attempt_at = NOW(),
    updated_at = NOW(),
    next_retry_at = CASE
      WHEN gm_churn_recovery_attempts.attempt_count + 1 = 1 THEN NOW() + INTERVAL '1 day'
      WHEN gm_churn_recovery_attempts.attempt_count + 1 = 2 THEN NOW() + INTERVAL '3 days'
      WHEN gm_churn_recovery_attempts.attempt_count + 1 >= 3 THEN NOW() + INTERVAL '5 days'
      ELSE gm_churn_recovery_attempts.next_retry_at
    END
  RETURNING id, attempt_count, next_retry_at INTO v_row;

  v_attempt_count := v_row.attempt_count;
  v_next_retry := v_row.next_retry_at;

  IF v_attempt_count >= 3 THEN
    UPDATE public.gm_restaurants
    SET billing_status = 'paused', updated_at = NOW()
    WHERE id = p_restaurant_id;
    v_escalated := true;
  END IF;

  RETURN QUERY SELECT v_row.id, v_attempt_count, v_next_retry, v_escalated;
END;
$$;

-- 4. RPC: Mark recovered — reset attempt, set billing_status active
CREATE OR REPLACE FUNCTION public.churn_mark_recovered(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.gm_churn_recovery_attempts
  SET recovered = true, attempt_count = 0, next_retry_at = NULL, updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id;

  UPDATE public.gm_restaurants
  SET billing_status = 'active', updated_at = NOW()
  WHERE id = p_restaurant_id;

  RETURN FOUND;
END;
$$;

-- 5. RPC: Get due retries for worker
CREATE OR REPLACE FUNCTION public.churn_scan_due_retries()
RETURNS TABLE(
  id UUID,
  restaurant_id UUID,
  attempt_count INTEGER,
  next_retry_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.restaurant_id, a.attempt_count, a.next_retry_at
  FROM public.gm_churn_recovery_attempts a
  WHERE a.next_retry_at <= NOW()
    AND a.recovered = false
  ORDER BY a.next_retry_at ASC;
END;
$$;

-- 6. RPC: Execute retry (simulate — in prod would trigger Stripe retry)
CREATE OR REPLACE FUNCTION public.churn_execute_retry(
  p_restaurant_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_next_retry TIMESTAMPTZ;
BEGIN
  SELECT attempt_count, next_retry_at INTO v_attempt_count, v_next_retry
  FROM public.gm_churn_recovery_attempts
  WHERE restaurant_id = p_restaurant_id AND recovered = false;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No due retry found'::TEXT;
    RETURN;
  END IF;

  IF v_next_retry > NOW() THEN
    RETURN QUERY SELECT false, ('Retry not yet due: ' || v_next_retry::TEXT)::TEXT;
    RETURN;
  END IF;

  -- Update last_attempt_at (actual Stripe retry would be called by worker)
  UPDATE public.gm_churn_recovery_attempts
  SET last_attempt_at = NOW(), updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id;

  RETURN QUERY SELECT true, 'Retry executed (record updated)'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.churn_detect_failed_payment(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.churn_mark_recovered(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.churn_scan_due_retries() TO service_role;
GRANT EXECUTE ON FUNCTION public.churn_execute_retry(UUID) TO service_role;
