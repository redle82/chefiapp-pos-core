-- =============================================================================
-- STOCK BRAIN ENGINE — Phase 1: Cost-Aware Stock Movement
-- =============================================================================
-- Date: 2026-02-19
-- Purpose:
--   Replace apply_stock_movement with a cost-aware version.
--   On IN actions: stores unit_cost in ledger and recalculates weighted
--   average cost on gm_ingredients.cost_per_unit.
--   On OUT/CONSUME: uses current cost_per_unit for traceability.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.apply_stock_movement(
  p_restaurant_id UUID,
  p_action TEXT,
  p_ingredient_id UUID,
  p_location_id UUID,
  p_qty NUMERIC,
  p_reason TEXT DEFAULT NULL,
  p_target_location_id UUID DEFAULT NULL,
  p_unit_cost NUMERIC DEFAULT NULL
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
  v_old_cost NUMERIC;
  v_old_total_qty NUMERIC;
  v_new_avg_cost NUMERIC;
  v_ledger_unit_cost NUMERIC;
  v_ledger_total_cost NUMERIC;
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

  -- ─── Get current cost from ingredient for OUT/CONSUME ledger entries ───
  SELECT cost_per_unit INTO v_old_cost
  FROM public.gm_ingredients
  WHERE id = p_ingredient_id;

  IF v_old_cost IS NULL THEN
    v_old_cost := 0;
  END IF;

  IF p_action = 'IN' THEN
    -- ─── ENTRADA ───
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

    -- Cost tracking: weighted average cost
    v_ledger_unit_cost := COALESCE(p_unit_cost, 0);
    v_ledger_total_cost := p_qty * v_ledger_unit_cost;

    IF p_unit_cost IS NOT NULL AND p_unit_cost > 0 THEN
      -- Calculate total stock across ALL locations for this ingredient
      SELECT COALESCE(SUM(qty), 0) INTO v_old_total_qty
      FROM public.gm_stock_levels
      WHERE restaurant_id = p_restaurant_id
        AND ingredient_id = p_ingredient_id;

      -- v_old_total_qty already includes the p_qty we just added,
      -- so the "old" total is v_old_total_qty - p_qty
      IF (v_old_total_qty - p_qty) > 0 AND v_old_cost > 0 THEN
        -- Weighted average: (old_qty * old_cost + new_qty * new_cost) / total_qty
        v_new_avg_cost := (
          ((v_old_total_qty - p_qty) * v_old_cost) + (p_qty * p_unit_cost)
        ) / v_old_total_qty;
      ELSE
        -- First entry or no previous cost → new cost becomes the average
        v_new_avg_cost := p_unit_cost;
      END IF;

      UPDATE public.gm_ingredients
      SET cost_per_unit = v_new_avg_cost,
          updated_at = NOW()
      WHERE id = p_ingredient_id;
    END IF;

    INSERT INTO public.gm_stock_ledger (
      restaurant_id, location_id, ingredient_id,
      action, qty, reason, created_by_role,
      unit_cost, total_cost
    )
    VALUES (
      p_restaurant_id, p_location_id, p_ingredient_id,
      'IN', p_qty, COALESCE(p_reason, 'MOVEMENT_IN'), 'manager',
      v_ledger_unit_cost, v_ledger_total_cost
    );

  ELSIF p_action = 'OUT' THEN
    -- ─── SAÍDA ───
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

    v_ledger_unit_cost := v_old_cost;
    v_ledger_total_cost := p_qty * v_old_cost;

    INSERT INTO public.gm_stock_ledger (
      restaurant_id, location_id, ingredient_id,
      action, qty, reason, created_by_role,
      unit_cost, total_cost
    )
    VALUES (
      p_restaurant_id, p_location_id, p_ingredient_id,
      'OUT', p_qty, COALESCE(p_reason, 'MOVEMENT_OUT'), 'manager',
      v_ledger_unit_cost, v_ledger_total_cost
    );

  ELSIF p_action = 'ADJUST' THEN
    -- ─── AJUSTE ───
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
        action, qty, reason, created_by_role,
        unit_cost, total_cost
      )
      VALUES (
        p_restaurant_id, p_location_id, p_ingredient_id,
        'ADJUST', ABS(v_delta), COALESCE(p_reason, 'MOVEMENT_ADJUST'), 'manager',
        v_old_cost, ABS(v_delta) * v_old_cost
      );
    END IF;

  ELSIF p_action = 'TRANSFER' THEN
    -- ─── TRANSFERÊNCIA ───
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
      action, qty, reason, created_by_role,
      unit_cost, total_cost
    )
    VALUES (
      p_restaurant_id, p_location_id, p_ingredient_id,
      'OUT', p_qty, v_reason, 'manager',
      v_old_cost, p_qty * v_old_cost
    );

    INSERT INTO public.gm_stock_ledger (
      restaurant_id, location_id, ingredient_id,
      action, qty, reason, created_by_role,
      unit_cost, total_cost
    )
    VALUES (
      p_restaurant_id, p_target_location_id, p_ingredient_id,
      'IN', p_qty, v_reason, 'manager',
      v_old_cost, p_qty * v_old_cost
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'new_qty', v_new_qty,
    'target_qty', v_target_qty,
    'unit_cost', v_ledger_unit_cost,
    'cost_per_unit', v_old_cost
  );
END;
$$;

COMMENT ON FUNCTION public.apply_stock_movement IS
'Registra um movimento de estoque (IN/OUT/ADJUST/TRANSFER) com tracking de custo. Para IN com p_unit_cost, recalcula weighted average cost no ingrediente.';
