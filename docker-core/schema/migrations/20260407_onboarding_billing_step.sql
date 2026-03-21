-- =============================================================================
-- Add 'billing' step to onboarding flow (between staff and payment)
-- Ref: Monetização — Billing Real + Onboarding Pago Integrado
-- =============================================================================

BEGIN;

-- 1. Alter CHECK constraint on gm_onboarding_state.current_step to include 'billing'
ALTER TABLE public.gm_onboarding_state
  DROP CONSTRAINT IF EXISTS gm_onboarding_state_current_step_check;

ALTER TABLE public.gm_onboarding_state
  ADD CONSTRAINT gm_onboarding_state_current_step_check CHECK (current_step IN (
    'welcome',
    'restaurant_setup',
    'legal_info',
    'menu',
    'staff',
    'billing',
    'payment',
    'devices',
    'verification',
    'complete'
  ));

-- 2. Update update_onboarding_step to accept 'billing' in step order
CREATE OR REPLACE FUNCTION public.update_onboarding_step(
  p_onboarding_id UUID,
  p_next_step TEXT,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(
  current_step TEXT,
  restaurant_id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_step_order TEXT[] := ARRAY[
    'welcome',
    'restaurant_setup',
    'legal_info',
    'menu',
    'staff',
    'billing',
    'payment',
    'devices',
    'verification',
    'complete'
  ];
  v_current_idx INT;
  v_next_idx INT;
  v_restaurant_id UUID;
BEGIN
  -- Verify step is valid
  v_current_idx := array_position(v_step_order, p_next_step);
  IF v_current_idx IS NULL THEN
    RAISE EXCEPTION 'Invalid step: %', p_next_step;
  END IF;

  -- Update onboarding state
  UPDATE public.gm_onboarding_state
  SET
    current_step = p_next_step,
    steps_completed = steps_completed || jsonb_build_object(
      p_next_step, jsonb_build_object(
        'completed_at', NOW(),
        'data', p_data
      )
    ),
    updated_at = NOW(),
    completed_at = CASE WHEN p_next_step = 'complete' THEN NOW() ELSE NULL END
  WHERE id = p_onboarding_id
    AND user_id = auth.uid()
  RETURNING gm_onboarding_state.restaurant_id INTO v_restaurant_id;

  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Onboarding not found or access denied';
  END IF;

  -- If onboarding complete, mark restaurant as active
  IF p_next_step = 'complete' THEN
    UPDATE public.gm_restaurants
    SET
      status = 'active',
      onboarding_completed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_restaurant_id;
  END IF;

  RETURN QUERY SELECT p_next_step, v_restaurant_id, 'success'::TEXT;
END;
$$;

-- 3. Update get_onboarding_state progress_percent to use 10 steps
CREATE OR REPLACE FUNCTION public.get_onboarding_state()
RETURNS TABLE(
  onboarding_id UUID,
  restaurant_id UUID,
  org_id UUID,
  current_step TEXT,
  restaurant_name TEXT,
  restaurant_status TEXT,
  progress_percent INT,
  is_complete BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    os.id,
    os.restaurant_id,
    os.org_id,
    os.current_step,
    os.restaurant_name,
    r.status,
    LEAST(100, ROUND(
      (SELECT COUNT(*)::numeric FROM jsonb_object_keys(os.steps_completed) AS k) / 10 * 100
    )::INT),
    os.completed_at IS NOT NULL
  FROM public.gm_onboarding_state os
  JOIN public.gm_restaurants r ON r.id = os.restaurant_id
  WHERE os.user_id = auth.uid()
    AND os.expires_at > NOW()
  ORDER BY os.started_at DESC
  LIMIT 1;
END;
$$;

COMMIT;
