-- =============================================================================
-- Migration: gm_has_role + update_order_status RBAC (F2)
-- Date: 2026-04-03
-- Purpose:
--   1. gm_has_role(p_restaurant_id, p_user_id, p_min_role) — canonical RBAC check
--   2. update_order_status gains p_actor_user_id; validates via gm_has_role when present
-- =============================================================================

-- =============================================================================
-- 1. gm_has_role — role hierarchy check
-- =============================================================================
-- Hierarchy: waiter|staff < kitchen < manager|admin < owner
-- staff and waiter map to lowest; admin maps to manager level.
CREATE OR REPLACE FUNCTION public.gm_has_role(
  p_restaurant_id UUID,
  p_user_id UUID,
  p_min_role TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role
  FROM public.gm_restaurant_members
  WHERE restaurant_id = p_restaurant_id
    AND user_id = p_user_id
  LIMIT 1;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- Normalize: staff → waiter, admin → manager
  v_role := CASE LOWER(TRIM(v_role))
    WHEN 'staff' THEN 'waiter'
    WHEN 'admin' THEN 'manager'
    ELSE LOWER(TRIM(v_role))
  END;

  RETURN (
    CASE LOWER(TRIM(p_min_role))
      WHEN 'waiter'  THEN v_role IN ('waiter', 'kitchen', 'manager', 'owner')
      WHEN 'kitchen' THEN v_role IN ('kitchen', 'manager', 'owner')
      WHEN 'manager' THEN v_role IN ('manager', 'owner')
      WHEN 'owner'   THEN v_role IN ('owner')
      ELSE false
    END
  );
END;
$$;

COMMENT ON FUNCTION public.gm_has_role IS
'RBAC: Returns true if user has at least p_min_role in restaurant. Hierarchy: waiter < kitchen < manager < owner. staff→waiter, admin→manager.';

GRANT EXECUTE ON FUNCTION public.gm_has_role TO postgres;

-- =============================================================================
-- 2. update_order_status — add p_actor_user_id, optional RBAC
-- =============================================================================
-- When p_actor_user_id IS NOT NULL: enforce gm_has_role(..., 'manager')
-- When p_actor_user_id IS NULL: bypass RBAC (gateway/integrations, gradual rollout)
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_new_status TEXT,
    p_actor_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_id UUID;
    v_old_status TEXT;
BEGIN
    -- RBAC: when actor provided, require manager+ role
    IF p_actor_user_id IS NOT NULL THEN
        IF NOT public.gm_has_role(p_restaurant_id, p_actor_user_id, 'manager') THEN
            RAISE EXCEPTION 'UNAUTHORIZED: actor lacks required role for order status transitions';
        END IF;
    END IF;

    -- Validate status value
    IF p_new_status NOT IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Status inválido: %', p_new_status;
    END IF;

    -- Get current status for return info
    SELECT status INTO v_old_status
    FROM public.gm_orders
    WHERE id = p_order_id AND restaurant_id = p_restaurant_id;

    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;

    -- Update status (trigger will validate transition + set timestamps)
    UPDATE public.gm_orders
    SET status = p_new_status
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id
    RETURNING id INTO v_updated_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_updated_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status TO postgres;

COMMENT ON FUNCTION public.update_order_status IS
'Core RPC: Updates order status. Transition validation enforced by trg_validate_order_status trigger. RBAC via p_actor_user_id when provided.';
