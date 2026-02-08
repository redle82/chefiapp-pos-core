-- =============================================================================
-- TASK ENGINE - RPC para Gerar Tarefas Automáticas (Atualizado com Templates)
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Gerar tarefas automáticas baseadas em eventos operacionais
-- Atualizado: Linkar com templates quando aplicável
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_tasks_from_orders(
  p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tasks_created INTEGER := 0;
  v_atraso_template_id UUID;
BEGIN
  -- Buscar template para ATRASO_ITEM (se existir)
  SELECT t.id INTO v_atraso_template_id
  FROM public.gm_task_templates t
  JOIN public.gm_task_packs p ON p.id = t.pack_id
  JOIN public.gm_restaurant_packs rp ON rp.pack_id = p.id
  WHERE rp.restaurant_id = p_restaurant_id
    AND rp.enabled = true
    AND t.is_active = true
    AND t.event_trigger = 'item_delay'
  LIMIT 1;
  
  -- ===========================================================================
  -- 1. TAREFAS DE ATRASO DE ITEM (Cozinha)
  -- ===========================================================================
  -- Trigger: Item ultrapassa 120% do prep_time_seconds
  -- Prioridade: Baseada no delay_ratio
  -- Linkar com template se existir
  
  INSERT INTO public.gm_tasks (
    restaurant_id, order_id, order_item_id, template_id,
    task_type, station, priority, message, context, source_event
  )
  SELECT 
    o.restaurant_id,
    o.id,
    oi.id,
    v_atraso_template_id, -- Linkar template se existir
    'ATRASO_ITEM',
    oi.station,
    CASE 
      WHEN delay_calc.delay_ratio > 0.5 THEN 'CRITICA'
      WHEN delay_calc.delay_ratio > 0.25 THEN 'ALTA'
      ELSE 'MEDIA'
    END,
    format('Verificar atraso do %s – Mesa %s', 
      oi.name_snapshot, 
      COALESCE(o.table_number::text, 'N/A')
    ),
    jsonb_build_object(
      'item_name', oi.name_snapshot,
      'item_id', oi.id,
      'expected_seconds', oi.prep_time_seconds,
      'elapsed_seconds', EXTRACT(EPOCH FROM (NOW() - oi.created_at))::INTEGER,
      'delay_seconds', EXTRACT(EPOCH FROM (NOW() - oi.created_at))::INTEGER - COALESCE(oi.prep_time_seconds, 300),
      'delay_ratio', delay_calc.delay_ratio,
      'table_number', o.table_number,
      'order_id', o.id,
      'order_number', COALESCE(o.number, o.short_id)
    ),
    'item_delay'
  FROM public.gm_orders o
  JOIN public.gm_order_items oi ON oi.order_id = o.id
  CROSS JOIN LATERAL (
    SELECT 
      CASE 
        WHEN oi.prep_time_seconds > 0 THEN
          (EXTRACT(EPOCH FROM (NOW() - oi.created_at)) - oi.prep_time_seconds) / oi.prep_time_seconds
        ELSE 0
      END AS delay_ratio
  ) AS delay_calc
  WHERE o.restaurant_id = p_restaurant_id
    AND o.status IN ('OPEN', 'IN_PREP')
    AND oi.ready_at IS NULL
    AND oi.prep_time_seconds IS NOT NULL
    AND oi.station = 'KITCHEN' -- Foco inicial: Cozinha
    AND (NOW() - oi.created_at) > (oi.prep_time_seconds * 1.2 || ' seconds')::INTERVAL
    AND delay_calc.delay_ratio > 0.2 -- Só criar tarefa se > 20% de atraso
    AND NOT EXISTS (
      SELECT 1 FROM public.gm_tasks t
      WHERE t.order_item_id = oi.id
        AND t.task_type = 'ATRASO_ITEM'
        AND t.status = 'OPEN'
    );
  
  GET DIAGNOSTICS v_tasks_created = ROW_COUNT;
  
  -- ===========================================================================
  -- 2. TAREFAS DE ACÚMULO NO BAR (Futuro - comentado por enquanto)
  -- ===========================================================================
  -- TODO: Implementar quando necessário
  -- Trigger: 3+ drinks em OPEN ou IN_PREP no bar
  
  -- ===========================================================================
  -- 3. TAREFAS DE ENTREGA PENDENTE (Futuro - comentado por enquanto)
  -- ===========================================================================
  -- TODO: Implementar quando necessário
  -- Trigger: Pedido READY há 5+ minutos sem DELIVERED
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'tasks_created', v_tasks_created,
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

-- Comentário
COMMENT ON FUNCTION public.generate_tasks_from_orders IS 'Gera tarefas automáticas baseadas em eventos operacionais (atraso de item, acúmulo, etc). Linka com templates quando aplicável.';
