-- =============================================================================
-- enforce_max_devices — Trigger to enforce plan-based device limits
-- =============================================================================
-- Data: 2026-03-04
-- Objetivo: Prevent registering more terminals than allowed by the
--           organization's plan tier. The limit comes from billing_plans.max_devices
--           matched via gm_organizations.plan_tier.
--
-- Fallback: If no org or no plan found, allows the insert (lenient for dev/legacy).
-- =============================================================================

-- Function: check terminal count against org plan limit
CREATE OR REPLACE FUNCTION public.fn_enforce_max_devices()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id UUID;
  v_plan_tier TEXT;
  v_max_devices INT;
  v_current_count INT;
BEGIN
  -- 1. Find the org for this restaurant
  SELECT org_id INTO v_org_id
    FROM public.gm_restaurants
   WHERE id = NEW.restaurant_id;

  -- No org linked → allow (legacy / dev)
  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Get plan tier from org
  SELECT plan_tier INTO v_plan_tier
    FROM public.gm_organizations
   WHERE id = v_org_id;

  IF v_plan_tier IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3. Get max_devices from billing_plans
  SELECT max_devices INTO v_max_devices
    FROM public.billing_plans
   WHERE slug = v_plan_tier;

  -- No plan row found → allow
  IF v_max_devices IS NULL THEN
    RETURN NEW;
  END IF;

  -- 4. Count active terminals for ALL restaurants in this org
  SELECT COUNT(*) INTO v_current_count
    FROM public.gm_terminals t
    JOIN public.gm_restaurants r ON r.id = t.restaurant_id
   WHERE r.org_id = v_org_id
     AND t.status = 'active';

  -- 5. Enforce
  IF v_current_count >= v_max_devices THEN
    RAISE EXCEPTION
      'Device limit reached: plan "%" allows % devices, org already has %',
      v_plan_tier, v_max_devices, v_current_count
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: fires before INSERT on gm_terminals
DROP TRIGGER IF EXISTS trg_enforce_max_devices ON public.gm_terminals;
CREATE TRIGGER trg_enforce_max_devices
  BEFORE INSERT ON public.gm_terminals
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_max_devices();

COMMENT ON FUNCTION public.fn_enforce_max_devices()
  IS 'Enforces billing_plans.max_devices per organization. Counts active terminals across all org restaurants.';
