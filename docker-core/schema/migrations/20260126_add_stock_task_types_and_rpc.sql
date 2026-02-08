-- =============================================================================
-- STOCK TASK TYPES + RPC SIMULATE
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Adicionar tipos de tarefa de estoque e RPC de simulação
-- =============================================================================

-- =============================================================================
-- 1. ATUALIZAR TIPOS DE TAREFA (gm_tasks.task_type)
-- =============================================================================
-- Remover constraint antiga e criar nova com tipos de estoque
ALTER TABLE public.gm_tasks 
  DROP CONSTRAINT IF EXISTS gm_tasks_task_type_check;

ALTER TABLE public.gm_tasks
  ADD CONSTRAINT gm_tasks_task_type_check CHECK (task_type IN (
    'ATRASO_ITEM',
    'ACUMULO_BAR',
    'ENTREGA_PENDENTE',
    'ITEM_CRITICO',
    'PEDIDO_ESQUECIDO',
    -- Novos tipos de estoque
    'ESTOQUE_CRITICO',
    'RUPTURA_PREVISTA',
    'EQUIPAMENTO_CHECK'
  ));

COMMENT ON COLUMN public.gm_tasks.task_type IS 'Tipo de tarefa: ATRASO_ITEM, ACUMULO_BAR, ESTOQUE_CRITICO, RUPTURA_PREVISTA, EQUIPAMENTO_CHECK, etc';

-- =============================================================================
-- 2. RPC: SIMULATE ORDER STOCK IMPACT
-- =============================================================================
-- Simula o impacto de um pedido no estoque (usado antes de criar pedido)
CREATE OR REPLACE FUNCTION public.simulate_order_stock_impact(
  p_restaurant_id UUID,
  p_items JSONB -- [{product_id, quantity}]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH req AS (
    SELECT
      (i->>'product_id')::UUID AS product_id,
      COALESCE((i->>'quantity')::INT, 1) AS qty
    FROM jsonb_array_elements(p_items) i
  ),
  needed AS (
    SELECT
      b.ingredient_id,
      b.station,
      SUM(b.qty_per_unit * r.qty) AS needed_qty
    FROM req r
    JOIN public.gm_product_bom b
      ON b.product_id = r.product_id
     AND b.restaurant_id = p_restaurant_id
    GROUP BY b.ingredient_id, b.station
  ),
  stock AS (
    SELECT
      sl.ingredient_id,
      SUM(sl.qty) AS available_qty,
      SUM(sl.min_qty) AS min_total
    FROM public.gm_stock_levels sl
    WHERE sl.restaurant_id = p_restaurant_id
    GROUP BY sl.ingredient_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'ingredient_id', n.ingredient_id,
    'needed_qty', n.needed_qty,
    'available_qty', COALESCE(s.available_qty, 0),
    'will_be', COALESCE(s.available_qty, 0) - n.needed_qty,
    'below_min', (COALESCE(s.available_qty, 0) - n.needed_qty) < COALESCE(s.min_total, 0),
    'station', n.station
  ))
  INTO v_result
  FROM needed n
  LEFT JOIN stock s ON s.ingredient_id = n.ingredient_id;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

COMMENT ON FUNCTION public.simulate_order_stock_impact IS 
'Simula o impacto de um pedido no estoque. Retorna JSONB com ingredientes necessários, disponíveis e se ficará abaixo do mínimo.';
