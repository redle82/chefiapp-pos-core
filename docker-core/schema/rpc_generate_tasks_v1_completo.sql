-- =============================================================================
-- TASK ENGINE v1 COMPLETO - RPC para Gerar Tarefas Automáticas
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Task Engine v1 completo (mínimo, operacional, vendável)
-- Regras: ATRASO_ITEM, ACUMULO_BAR, ENTREGA_PENDENTE, ESTOQUE_CRITICO
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_tasks_from_orders(
  p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tasks_created INTEGER := 0;
  v_atraso_kitchen INTEGER := 0;
  v_atraso_bar INTEGER := 0;
  v_acumulo_bar INTEGER := 0;
  v_entrega_pendente INTEGER := 0;
  v_estoque_critico INTEGER := 0;
BEGIN
  -- ===========================================================================
  -- 1. TAREFAS DE ATRASO DE ITEM (KITCHEN + BAR)
  -- ===========================================================================
  -- Trigger: Item ultrapassa 120% do prep_time_seconds
  -- Prioridade: Baseada no delay_ratio (>50% CRITICA, >25% ALTA, >20% MEDIA)
  
  WITH delayed_items AS (
    SELECT 
      o.restaurant_id,
      o.id AS order_id,
      oi.id AS order_item_id,
      oi.station,
      oi.name_snapshot,
      o.table_number,
      oi.prep_time_seconds,
      EXTRACT(EPOCH FROM (NOW() - oi.created_at))::INTEGER AS elapsed_seconds,
      CASE 
        WHEN oi.prep_time_seconds > 0 THEN
          (EXTRACT(EPOCH FROM (NOW() - oi.created_at)) - oi.prep_time_seconds) / oi.prep_time_seconds
        ELSE 0
      END AS delay_ratio
    FROM public.gm_orders o
    JOIN public.gm_order_items oi ON oi.order_id = o.id
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
      AND (oi.ready_at IS NULL OR oi.ready_at = (SELECT MIN(ready_at) FROM public.gm_order_items WHERE order_id = oi.order_id AND ready_at IS NOT NULL))
      AND oi.prep_time_seconds IS NOT NULL
      AND oi.station IN ('KITCHEN', 'BAR')
      AND (NOW() - oi.created_at) > (oi.prep_time_seconds * 1.2 || ' seconds')::INTERVAL
      AND NOT EXISTS (
        SELECT 1 FROM public.gm_tasks t
        WHERE t.order_item_id = oi.id
          AND t.task_type = 'ATRASO_ITEM'
          AND t.status = 'OPEN'
      )
  )
  INSERT INTO public.gm_tasks (
    restaurant_id, order_id, order_item_id,
    task_type, station, priority, message, context, source_event, auto_generated
  )
  SELECT 
    restaurant_id,
    order_id,
    order_item_id,
    'ATRASO_ITEM',
    station,
    CASE 
      WHEN delay_ratio > 0.5 THEN 'CRITICA'
      WHEN delay_ratio > 0.25 THEN 'ALTA'
      ELSE 'MEDIA'
    END,
    format('Verificar atraso do %s – Mesa %s', 
      name_snapshot, 
      COALESCE(table_number::text, 'N/A')
    ),
    jsonb_build_object(
      'item_name', name_snapshot,
      'item_id', order_item_id,
      'expected_seconds', prep_time_seconds,
      'elapsed_seconds', elapsed_seconds,
      'delay_seconds', elapsed_seconds - prep_time_seconds,
      'delay_ratio', delay_ratio,
      'table_number', table_number,
      'order_id', order_id
    ),
    'item_delay',
    true
  FROM delayed_items
  WHERE delay_ratio > 0.2; -- Só criar tarefa se > 20% de atraso
  
  GET DIAGNOSTICS v_atraso_kitchen = ROW_COUNT;
  v_tasks_created := v_tasks_created + v_atraso_kitchen;
  
  -- ===========================================================================
  -- 2. TAREFAS DE ACÚMULO NO BAR
  -- ===========================================================================
  -- Trigger: 3+ drinks em OPEN ou IN_PREP no bar há mais de 2 minutos
  -- Prioridade: MEDIA (se 3-5 itens), ALTA (se 6+ itens)
  
  WITH bar_accumulation AS (
    SELECT 
      o.restaurant_id,
      COUNT(DISTINCT o.id) AS pending_orders,
      COUNT(oi.id) AS pending_items,
      MIN(oi.created_at) AS oldest_item_created,
      EXTRACT(EPOCH FROM (NOW() - MIN(oi.created_at)))::INTEGER AS oldest_wait_seconds
    FROM public.gm_orders o
    JOIN public.gm_order_items oi ON oi.order_id = o.id
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
      AND oi.ready_at IS NULL
      AND oi.station = 'BAR'
      AND (NOW() - oi.created_at) > INTERVAL '2 minutes'
    GROUP BY o.restaurant_id
    HAVING COUNT(oi.id) >= 3
      AND NOT EXISTS (
        SELECT 1 FROM public.gm_tasks t
        WHERE t.restaurant_id = o.restaurant_id
          AND t.task_type = 'ACUMULO_BAR'
          AND t.station = 'BAR'
          AND t.status = 'OPEN'
          AND t.created_at > NOW() - INTERVAL '10 minutes' -- Evitar spam
      )
  )
  INSERT INTO public.gm_tasks (
    restaurant_id, order_id, order_item_id,
    task_type, station, priority, message, context, source_event, auto_generated
  )
  SELECT 
    restaurant_id,
    NULL, -- Não vinculado a pedido específico
    NULL, -- Não vinculado a item específico
    'ACUMULO_BAR',
    'BAR',
    CASE 
      WHEN pending_items >= 6 THEN 'ALTA'
      ELSE 'MEDIA'
    END,
    format('Priorizar pedidos do bar (%s drinks aguardando)', pending_items),
    jsonb_build_object(
      'pending_orders', pending_orders,
      'pending_items', pending_items,
      'oldest_wait_seconds', oldest_wait_seconds
    ),
    'bar_accumulation',
    true
  FROM bar_accumulation;
  
  GET DIAGNOSTICS v_acumulo_bar = ROW_COUNT;
  v_tasks_created := v_tasks_created + v_acumulo_bar;
  
  -- ===========================================================================
  -- 3. TAREFAS DE ENTREGA PENDENTE
  -- ===========================================================================
  -- Trigger: Pedido READY há 5+ minutos sem DELIVERED
  -- Prioridade: ALTA (5-10 min), CRITICA (>10 min)
  
  WITH pending_delivery AS (
    SELECT 
      o.restaurant_id,
      o.id AS order_id,
      o.table_number,
      COUNT(oi.id) AS ready_items,
      EXTRACT(EPOCH FROM (NOW() - COALESCE(o.ready_at, o.created_at)))::INTEGER AS wait_seconds
    FROM public.gm_orders o
    LEFT JOIN public.gm_order_items oi ON oi.order_id = o.id AND oi.ready_at IS NOT NULL
    WHERE o.restaurant_id = p_restaurant_id
      AND o.status = 'READY'
      AND o.ready_at IS NOT NULL
      AND (NOW() - o.ready_at) > INTERVAL '5 minutes'
    GROUP BY o.restaurant_id, o.id, o.table_number, o.ready_at
    HAVING NOT EXISTS (
      SELECT 1 FROM public.gm_tasks t
      WHERE t.order_id = o.id
        AND t.task_type = 'ENTREGA_PENDENTE'
        AND t.status = 'OPEN'
    )
  )
  INSERT INTO public.gm_tasks (
    restaurant_id, order_id, order_item_id,
    task_type, station, priority, message, context, source_event, auto_generated
  )
  SELECT 
    restaurant_id,
    order_id,
    NULL,
    'ENTREGA_PENDENTE',
    'SERVICE',
    CASE 
      WHEN wait_seconds > 600 THEN 'CRITICA' -- >10 min
      ELSE 'ALTA' -- 5-10 min
    END,
    format('Pedido pronto aguardando entrega – Mesa %s', 
      COALESCE(table_number::text, 'N/A')
    ),
    jsonb_build_object(
      'order_id', order_id,
      'table_number', table_number,
      'ready_items', ready_items,
      'wait_seconds', wait_seconds
    ),
    'delivery_pending',
    true
  FROM pending_delivery;
  
  GET DIAGNOSTICS v_entrega_pendente = ROW_COUNT;
  v_tasks_created := v_tasks_created + v_entrega_pendente;
  
  -- ===========================================================================
  -- 4. TAREFAS DE ESTOQUE CRÍTICO
  -- ===========================================================================
  -- Trigger: Ingrediente abaixo do mínimo (qty <= min_qty)
  -- Prioridade: CRITICA (se qty = 0), ALTA (se qty < 0.5 * min_qty), MEDIA (caso contrário)
  
  WITH low_stock AS (
    SELECT 
      sl.restaurant_id,
      sl.ingredient_id,
      i.name AS ingredient_name,
      i.unit,
      sl.location_id,
      l.name AS location_name,
      sl.qty,
      sl.min_qty,
      CASE 
        WHEN sl.qty <= 0 THEN 'CRITICA'
        WHEN sl.qty < sl.min_qty * 0.5 THEN 'ALTA'
        ELSE 'MEDIA'
      END AS priority,
      sl.min_qty - sl.qty AS deficit
    FROM public.gm_stock_levels sl
    JOIN public.gm_ingredients i ON i.id = sl.ingredient_id
    JOIN public.gm_locations l ON l.id = sl.location_id
    WHERE sl.restaurant_id = p_restaurant_id
      AND sl.min_qty > 0
      AND sl.qty <= sl.min_qty
      AND NOT EXISTS (
        SELECT 1 FROM public.gm_tasks t
        WHERE t.restaurant_id = sl.restaurant_id
          AND t.task_type = 'ESTOQUE_CRITICO'
          AND t.status = 'OPEN'
          AND t.context->>'ingredient_id' = sl.ingredient_id::TEXT
      )
  )
  INSERT INTO public.gm_tasks (
    restaurant_id, order_id, order_item_id,
    task_type, station, priority, message, context, source_event, auto_generated
  )
  SELECT 
    restaurant_id,
    NULL,
    NULL,
    'ESTOQUE_CRITICO',
    CASE 
      WHEN location_name ILIKE '%bar%' OR location_name ILIKE '%BAR%' THEN 'BAR'
      WHEN location_name ILIKE '%cozinha%' OR location_name ILIKE '%KITCHEN%' THEN 'KITCHEN'
      ELSE NULL
    END,
    priority,
    format('Estoque crítico: %s (%s %s) – Local: %s', 
      ingredient_name, 
      qty, 
      unit,
      location_name
    ),
    jsonb_build_object(
      'ingredient_id', ingredient_id,
      'ingredient_name', ingredient_name,
      'unit', unit,
      'location_id', location_id,
      'location_name', location_name,
      'current_qty', qty,
      'min_qty', min_qty,
      'deficit', deficit
    ),
    'stock_critical',
    true
  FROM low_stock;
  
  GET DIAGNOSTICS v_estoque_critico = ROW_COUNT;
  v_tasks_created := v_tasks_created + v_estoque_critico;
  
  -- ===========================================================================
  -- 5. FECHAR TAREFAS AUTOMATICAMENTE (quando condição some)
  -- ===========================================================================
  
  -- Fechar tarefas de ATRASO_ITEM quando item fica pronto
  UPDATE public.gm_tasks
  SET status = 'RESOLVED',
      resolved_at = NOW(),
      updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id
    AND task_type = 'ATRASO_ITEM'
    AND status = 'OPEN'
    AND order_item_id IN (
      SELECT id FROM public.gm_order_items
      WHERE ready_at IS NOT NULL
    );
  
  -- Fechar tarefas de ACUMULO_BAR quando acúmulo diminui
  UPDATE public.gm_tasks
  SET status = 'RESOLVED',
      resolved_at = NOW(),
      updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id
    AND task_type = 'ACUMULO_BAR'
    AND status = 'OPEN'
    AND station = 'BAR'
    AND NOT EXISTS (
      SELECT 1
      FROM public.gm_orders o
      JOIN public.gm_order_items oi ON oi.order_id = o.id
      WHERE o.restaurant_id = p_restaurant_id
        AND o.status IN ('OPEN', 'IN_PREP', 'PREPARING')
        AND oi.ready_at IS NULL
        AND oi.station = 'BAR'
        AND (NOW() - oi.created_at) > INTERVAL '2 minutes'
      GROUP BY o.restaurant_id
      HAVING COUNT(oi.id) >= 3
    );
  
  -- Fechar tarefas de ENTREGA_PENDENTE quando pedido é fechado/entregue
  UPDATE public.gm_tasks
  SET status = 'RESOLVED',
      resolved_at = NOW(),
      updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id
    AND task_type = 'ENTREGA_PENDENTE'
    AND status = 'OPEN'
    AND order_id IN (
      SELECT id FROM public.gm_orders
      WHERE status = 'CLOSED'
    );
  
  -- Fechar tarefas de ESTOQUE_CRITICO quando estoque é reposto
  UPDATE public.gm_tasks
  SET status = 'RESOLVED',
      resolved_at = NOW(),
      updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id
    AND task_type = 'ESTOQUE_CRITICO'
    AND status = 'OPEN'
    AND context->>'ingredient_id' IN (
      SELECT ingredient_id::TEXT
      FROM public.gm_stock_levels
      WHERE restaurant_id = p_restaurant_id
        AND min_qty > 0
        AND qty > min_qty
    );
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'tasks_created', v_tasks_created,
    'breakdown', jsonb_build_object(
      'atraso_item', v_atraso_kitchen + v_atraso_bar,
      'acumulo_bar', v_acumulo_bar,
      'entrega_pendente', v_entrega_pendente,
      'estoque_critico', v_estoque_critico
    ),
    'restaurant_id', p_restaurant_id,
    'generated_at', NOW()
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'tasks_created', v_tasks_created
    );
END;
$$;

COMMENT ON FUNCTION public.generate_tasks_from_orders IS 
'Task Engine v1 completo: Gera tarefas automáticas baseadas em eventos operacionais (atraso de item, acúmulo no bar, entrega pendente, estoque crítico). Fecha tarefas automaticamente quando condição some.';
