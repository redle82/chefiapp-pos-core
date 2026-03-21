-- =============================================================================
-- Migration: ACTOR_REQUIRED — enforce p_actor_user_id in update_order_status
-- Date: 2026-04-04
-- Purpose: Remove bypass; require valid actor for all status transitions.
-- Prerequisite: Gateway and merchant-portal must pass actor before applying.
-- =============================================================================

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
    -- RBAC: actor is required (no bypass)
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'ACTOR_REQUIRED: p_actor_user_id is required for order status transitions';
    END IF;

    IF NOT public.gm_has_role(p_restaurant_id, p_actor_user_id, 'manager') THEN
        RAISE EXCEPTION 'UNAUTHORIZED: actor lacks required role for order status transitions';
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

COMMENT ON FUNCTION public.update_order_status IS
'Core RPC: Updates order status. ACTOR_REQUIRED: p_actor_user_id must be valid member with manager+ role.';
