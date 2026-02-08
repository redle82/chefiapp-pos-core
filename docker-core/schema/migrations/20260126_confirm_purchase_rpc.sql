-- =============================================================================
-- CONFIRM PURCHASE RPC
-- =============================================================================
-- Confirma compra de ingrediente e fecha o ciclo operacional:
-- 1. Atualiza estoque (gm_stock_levels)
-- 2. Registra no ledger (gm_stock_ledger)
-- 3. Fecha tarefas de estoque crítico relacionadas
-- =============================================================================

CREATE OR REPLACE FUNCTION public.confirm_purchase(
  p_restaurant_id UUID,
  p_ingredient_id UUID,
  p_location_id UUID,
  p_qty_received NUMERIC,
  p_purchase_price_cents INTEGER DEFAULT NULL,
  p_reason TEXT DEFAULT 'PURCHASE'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_new_qty NUMERIC;
  v_tasks_closed INTEGER := 0;
BEGIN
  -- 1. Atualizar estoque (atomicamente)
  UPDATE public.gm_stock_levels
  SET qty = qty + p_qty_received,
      updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id
    AND ingredient_id = p_ingredient_id
    AND location_id = p_location_id
  RETURNING qty INTO v_new_qty;

  IF NOT FOUND THEN
    -- Criar nível de estoque se não existir (usando min_qty = 0 como default)
    INSERT INTO public.gm_stock_levels (
      restaurant_id, location_id, ingredient_id, qty, min_qty
    )
    VALUES (
      p_restaurant_id, p_location_id, p_ingredient_id, p_qty_received, 0
    )
    RETURNING qty INTO v_new_qty;
  END IF;

  -- 2. Registrar no ledger
  INSERT INTO public.gm_stock_ledger (
    restaurant_id, location_id, ingredient_id,
    action, qty, reason, created_by_role
  )
  VALUES (
    p_restaurant_id, p_location_id, p_ingredient_id,
    'IN', p_qty_received, p_reason, 'manager'
  );

  -- 3. Fechar tarefas de estoque crítico relacionadas
  -- Buscar tarefas que mencionam este ingrediente no context
  WITH tasks_to_close AS (
    SELECT id
    FROM public.gm_tasks
    WHERE restaurant_id = p_restaurant_id
      AND task_type = 'ESTOQUE_CRITICO'
      AND status = 'OPEN'
      AND (
        -- Verificar se context contém ingredient_id
        context->>'ingredient_id' = p_ingredient_id::TEXT
        OR context->>'ingredient' IN (
          SELECT name FROM public.gm_ingredients WHERE id = p_ingredient_id
        )
      )
  )
  UPDATE public.gm_tasks
  SET status = 'RESOLVED',
      resolved_at = NOW(),
      updated_at = NOW()
  WHERE id IN (SELECT id FROM tasks_to_close);

  GET DIAGNOSTICS v_tasks_closed = ROW_COUNT;

  -- 4. Retornar resultado
  SELECT jsonb_build_object(
    'success', true,
    'new_qty', v_new_qty,
    'tasks_closed', v_tasks_closed,
    'ingredient_id', p_ingredient_id,
    'location_id', p_location_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.confirm_purchase IS 
'Confirma compra de ingrediente: atualiza estoque, registra no ledger e fecha tarefas relacionadas. Fecha o ciclo operacional de compras.';
