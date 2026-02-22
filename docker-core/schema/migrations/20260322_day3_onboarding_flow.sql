-- =============================================================================
-- Day 3: Onboarding Flow & State Machine
-- =============================================================================
-- Purpose: Enable user onboarding flow with state tracking
-- Implements: 9-screen onboarding process for new restaurants
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Onboarding State Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.gm_organizations(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- State: welcome, restaurant_setup, legal_info, menu, staff, payment, devices, verification, complete
  current_step TEXT NOT NULL DEFAULT 'welcome' CHECK (current_step IN (
    'welcome',
    'restaurant_setup',
    'legal_info',
    'menu',
    'staff',
    'payment',
    'devices',
    'verification',
    'complete'
  )),

  -- Step completion tracking
  steps_completed JSONB NOT NULL DEFAULT '{}',

  -- Restaurant setup data (captured from screens)
  restaurant_name TEXT,
  restaurant_slug TEXT,
  restaurant_phone TEXT,
  restaurant_email TEXT,
  restaurant_address TEXT,
  restaurant_city TEXT,
  restaurant_postal_code TEXT,
  restaurant_country TEXT,

  -- Legal/Compliance data
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  business_registration_number TEXT,
  tax_id TEXT,

  -- Menu data (product count, categories, etc.)
  menu_products_count INT DEFAULT 0,
  menu_categories TEXT[] DEFAULT '{}',

  -- Staff data
  staff_members_count INT DEFAULT 0,

  -- Payment data
  payment_method TEXT,
  billing_email TEXT,

  -- Device data
  devices_count INT DEFAULT 0,

  -- Verification results
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'passed', 'failed')),
  verification_errors JSONB DEFAULT '{}',

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_gm_onboarding_state_user_id
  ON public.gm_onboarding_state(user_id);

CREATE INDEX IF NOT EXISTS idx_gm_onboarding_state_restaurant_id
  ON public.gm_onboarding_state(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_onboarding_state_org_id
  ON public.gm_onboarding_state(org_id);

-- =============================================================================
-- 2. RPC: Create Onboarding Context
-- =============================================================================
-- Triggered when user clicks "Create Restaurant" on welcome screen
-- Creates org → restaurant → onboarding record atomically

CREATE OR REPLACE FUNCTION public.create_onboarding_context(
  p_restaurant_name TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  org_id UUID,
  restaurant_id UUID,
  onboarding_id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id UUID;
  v_restaurant_id UUID;
  v_onboarding_id UUID;
  v_user_id UUID;
BEGIN
  -- Use provided user_id or auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 1. Create organization (if user doesn't have one)
  INSERT INTO public.gm_organizations (
    owner_id,
    slug,
    plan_tier,
    created_at
  ) VALUES (
    v_user_id,
    gen_random_uuid()::text,
    'trial',
    NOW()
  )
  RETURNING id INTO v_org_id;

  -- 2. Create restaurant
  INSERT INTO public.gm_restaurants (
    org_id,
    name,
    slug,
    status,
    onboarding_completed_at,
    created_at
  ) VALUES (
    v_org_id,
    p_restaurant_name,
    lower(replace(p_restaurant_name, ' ', '-')),
    'setup',
    NULL,
    NOW()
  )
  RETURNING id INTO v_restaurant_id;

  -- 3. Create onboarding state
  INSERT INTO public.gm_onboarding_state (
    org_id,
    restaurant_id,
    user_id,
    current_step,
    restaurant_name,
    restaurant_slug,
    started_at
  ) VALUES (
    v_org_id,
    v_restaurant_id,
    v_user_id,
    'welcome',
    p_restaurant_name,
    lower(replace(p_restaurant_name, ' ', '-')),
    NOW()
  )
  RETURNING id INTO v_onboarding_id;

  -- 4. Add user as restaurant member (owner)
  INSERT INTO public.gm_restaurant_members (
    restaurant_id,
    user_id,
    role,
    created_at
  ) VALUES (
    v_restaurant_id,
    v_user_id,
    'owner',
    NOW()
  );

  -- 5. Add user as org member (owner)
  INSERT INTO public.gm_org_members (
    org_id,
    user_id,
    role,
    created_at
  ) VALUES (
    v_org_id,
    v_user_id,
    'owner',
    NOW()
  );

  RETURN QUERY
  SELECT v_org_id, v_restaurant_id, v_onboarding_id, 'created'::TEXT;
END;
$$;

-- =============================================================================
-- 3. RPC: Update Onboarding Step
-- =============================================================================
-- Called after user completes each screen

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
    'payment',
    'devices',
    'verification',
    'complete'
  ];
  v_current_idx INT;
  v_next_idx INT;
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
    -- If last step, mark as complete
    completed_at = CASE WHEN p_next_step = 'complete' THEN NOW() ELSE NULL END
  WHERE id = p_onboarding_id
    AND user_id = auth.uid()
  RETURNING current_step, restaurant_id
  INTO p_next_step, p_data::UUID;

  -- If onboarding complete, mark restaurant as active
  IF p_next_step = 'complete' THEN
    UPDATE public.gm_restaurants
    SET
      status = 'active',
      onboarding_completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_data::UUID;
  END IF;

  RETURN QUERY
  SELECT p_next_step, p_data::UUID, 'success'::TEXT;
END;
$$;

-- =============================================================================
-- 4. RPC: Get Current Onboarding State
-- =============================================================================
-- Frontend calls this to determine which screen to show

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
    ROUND(
      (jsonb_object_keys(os.steps_completed)::TEXT[] @> ARRAY[]::TEXT[])::numeric / 9 * 100
    )::INT,
    os.completed_at IS NOT NULL
  FROM public.gm_onboarding_state os
  JOIN public.gm_restaurants r ON r.id = os.restaurant_id
  WHERE os.user_id = auth.uid()
    AND os.expires_at > NOW()
  ORDER BY os.started_at DESC
  LIMIT 1;
END;
$$;

-- =============================================================================
-- 5. RLS Policies for Onboarding State
-- =============================================================================

ALTER TABLE public.gm_onboarding_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "onboarding_select_own" ON public.gm_onboarding_state;
CREATE POLICY "onboarding_select_own"
  ON public.gm_onboarding_state
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "onboarding_insert_own" ON public.gm_onboarding_state;
CREATE POLICY "onboarding_insert_own"
  ON public.gm_onboarding_state
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "onboarding_update_own" ON public.gm_onboarding_state;
CREATE POLICY "onboarding_update_own"
  ON public.gm_onboarding_state
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "onboarding_service_all" ON public.gm_onboarding_state;
CREATE POLICY "onboarding_service_all"
  ON public.gm_onboarding_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 6. Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.gm_onboarding_state TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.gm_onboarding_state TO service_role;
REVOKE ALL ON public.gm_onboarding_state FROM anon;

-- Grant execute on RPC functions
GRANT EXECUTE ON FUNCTION public.create_onboarding_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_onboarding_step TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_state TO authenticated;

-- =============================================================================
-- 7. Trigger: Update gm_restaurants.onboarding_completed_at
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_update_onboarding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_step = 'complete' AND OLD.current_step != 'complete' THEN
    UPDATE public.gm_restaurants
    SET onboarding_completed_at = NOW(), status = 'active'
    WHERE id = NEW.restaurant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_onboarding_complete ON public.gm_onboarding_state;
CREATE TRIGGER trigger_onboarding_complete
  AFTER UPDATE ON public.gm_onboarding_state
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_onboarding_timestamp();

COMMIT;
