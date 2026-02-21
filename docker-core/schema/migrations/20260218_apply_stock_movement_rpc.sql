-- =============================================================================
-- APPLY STOCK MOVEMENT RPC
-- =============================================================================
-- Registra movimentos de estoque e atualiza gm_stock_levels atomica e auditavel.
-- Acoes: IN, OUT, ADJUST, TRANSFER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.apply_stock_movement(
  p_restaurant_id UUID,
  p_action TEXT,
  p_ingredient_id UUID,
  p_location_id UUID,
  p_qty NUMERIC,
  p_reason TEXT DEFAULT NULL,
  p_target_location_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_qty NUMERIC;
  v_target_qty NUMERIC;
  v_current_qty NUMERIC;
  v_delta NUMERIC;
  v_reason TEXT;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'p_qty must be greater than zero';
  END IF;

  IF p_action NOT IN ('IN', 'OUT', 'ADJUST', 'TRANSFER') THEN
    RAISE EXCEPTION 'invalid action: %', p_action;
  END IF;

  IF p_action = 'TRANSFER' AND p_target_location_id IS NULL THEN
    RAISE EXCEPTION 'p_target_location_id required for TRANSFER';
  END IF;

  IF p_action = 'IN' THEN
    UPDATE public.gm_stock_levels
    SET qty = qty + p_qty,
        updated_at = NOW()
    WHERE restaurant_id = p_restaurant_id
      AND ingredient_id = p_ingredient_id
      AND location_id = p_location_id
    RETURNING qty INTO v_new_qty;

    IF NOT FOUND THEN
      INSERT INTO public.gm_stock_levels (
        restaurant_id, location_id, ingredient_id, qty, min_qty
      )
      VALUES (
        p_restaurant_id, p_location_id, p_ingredient_id, p_qty, 0
      )
      RETURNING qty INTO v_new_qty;
    END IF;

    INSERT INTO public.gm_stock_ledger (
      restaurant_id, location_id, ingredient_id,
      action, qty, reason, created_by_role
    )
    VALUES (
      p_restaurant_id, p_location_id, p_ingredient_id,
      'IN', p_qty, COALESCE(p_reason, 'MOVEMENT_IN'), 'manager'
    );
  ELSIF p_action = 'OUT' THEN
    SELECT qty
    INTO v_current_qty
    FROM public.gm_stock_levels
    WHERE restaurant_id = p_restaurant_id
      AND ingredient_id = p_ingredient_id
      AND location_id = p_location_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'stock level not found';
    END IF;

    IF v_current_qty < p_qty THEN
      RAISE EXCEPTION 'insufficient stock';
    END IF;

    UPDATE public.gm_stock_levels
    SET qty = qty - p_qty,
        updated_at = NOW()
    WHERE restaurant_id = p_restaurant_id
      AND ingredient_id = p_ingredient_id
      AND location_id = p_location_id
    RETURNING qty INTO v_new_qty;

    INSERT INTO public.gm_stock_ledger (
      restaurant_id, location_id, ingredient_id,
      action, qty, reason, created_by_role
    )
    VALUES (
      p_restaurant_id, p_location_id, p_ingredient_id,
      'OUT', p_qty, COALESCE(p_reason, 'MOVEMENT_OUT'), 'manager'
    );
  ELSIF p_action = 'ADJUST' THEN
    SELECT qty
    INTO v_current_qty
    FROM public.gm_stock_levels
    WHERE restaurant_id = p_restaurant_id
      AND ingredient_id = p_ingredient_id
      AND location_id = p_location_id
    FOR UPDATE;

    IF NOT FOUND THEN
      v_current_qty := 0;
      INSERT INTO public.gm_stock_levels (
        restaurant_id, location_id, ingredient_id, qty, min_qty
      )
      VALUES (
        p_restaurant_id, p_location_id, p_ingredient_id, p_qty, 0
      )
      RETURNING qty INTO v_new_qty;
    ELSE
      UPDATE public.gm_stock_levels
      SET qty = p_qty,
          updated_at = NOW()
      WHERE restaurant_id = p_restaurant_id
        AND ingredient_id = p_ingredient_id
        AND location_id = p_location_id
      RETURNING qty INTO v_new_qty;
    END IF;

    v_delta := v_new_qty - v_current_qty;
    IF v_delta <> 0 THEN
      INSERT INTO public.gm_stock_ledger (
        restaurant_id, location_id, ingredient_id,
        action, qty, reason, created_by_role
      )
      VALUES (
        p_restaurant_id, p_location_id, p_ingredient_id,
        'ADJUST', ABS(v_delta), COALESCE(p_reason, 'MOVEMENT_ADJUST'), 'manager'
      );
    END IF;
  ELSIF p_action = 'TRANSFER' THEN
    SELECT qty
    INTO v_current_qty
    FROM public.gm_stock_levels
    WHERE restaurant_id = p_restaurant_id
      AND ingredient_id = p_ingredient_id
      AND location_id = p_location_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'stock level not found';
    END IF;

    IF v_current_qty < p_qty THEN
      RAISE EXCEPTION 'insufficient stock';
    END IF;

    UPDATE public.gm_stock_levels
    SET qty = qty - p_qty,
        updated_at = NOW()
    WHERE restaurant_id = p_restaurant_id
      AND ingredient_id = p_ingredient_id
      AND location_id = p_location_id
    RETURNING qty INTO v_new_qty;

    UPDATE public.gm_stock_levels
    SET qty = qty + p_qty,
        updated_at = NOW()
    WHERE restaurant_id = p_restaurant_id
      AND ingredient_id = p_ingredient_id
      AND location_id = p_target_location_id
    RETURNING qty INTO v_target_qty;

    IF NOT FOUND THEN
      INSERT INTO public.gm_stock_levels (
        restaurant_id, location_id, ingredient_id, qty, min_qty
      )
      VALUES (
        p_restaurant_id, p_target_location_id, p_ingredient_id, p_qty, 0
      )
      RETURNING qty INTO v_target_qty;
    END IF;

    v_reason := COALESCE(p_reason, 'MOVEMENT_TRANSFER');

    INSERT INTO public.gm_stock_ledger (
      restaurant_id, location_id, ingredient_id,
      action, qty, reason, created_by_role
    )
    VALUES (
      p_restaurant_id, p_location_id, p_ingredient_id,
      'OUT', p_qty, v_reason, 'manager'
    );

    INSERT INTO public.gm_stock_ledger (
      restaurant_id, location_id, ingredient_id,
      action, qty, reason, created_by_role
    )
    VALUES (
      p_restaurant_id, p_target_location_id, p_ingredient_id,
      'IN', p_qty, v_reason, 'manager'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'new_qty', v_new_qty,
    'target_qty', v_target_qty
  );
END;
$$;

COMMENT ON FUNCTION public.apply_stock_movement IS
'Registra um movimento de estoque (IN/OUT/ADJUST/TRANSFER), atualiza gm_stock_levels e grava no ledger.';
