-- =============================================================================
-- Task RPCs: generate_tasks_if_idle, claim_task
-- Ref: docs/FLOW_KDS_TASKS_TABLES.md, docs/contracts/OPERATIONAL_ORCHESTRATOR_CONTRACT.md
-- =============================================================================

-- generate_tasks_if_idle: Gera tarefa MODO_INTERNO quando restaurante ocioso
-- Idempotência: max 1 tarefa OPEN com source_event='restaurant_idle' por restaurante
CREATE OR REPLACE FUNCTION public.generate_tasks_if_idle(
  p_restaurant_id UUID,
  p_idle_minutes_threshold INTEGER DEFAULT 5,
  p_message TEXT DEFAULT 'Modo interno: sem pedidos ativos. Checklist e organização.'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_orders INTEGER;
  v_idle_minutes NUMERIC;
  v_shift_open BOOLEAN;
  v_last_order_at TIMESTAMPTZ;
  v_task_id UUID;
BEGIN
  -- KDS_LOAD: pedidos ativos
  SELECT COUNT(*) INTO v_active_orders
  FROM public.gm_orders
  WHERE restaurant_id = p_restaurant_id
    AND status IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY');

  IF v_active_orders > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'active_orders',
      'active_orders', v_active_orders,
      'generated', 0
    );
  END IF;

  -- shiftOpen: caixa aberta
  SELECT EXISTS (
    SELECT 1 FROM public.gm_cash_registers
    WHERE restaurant_id = p_restaurant_id
      AND status = 'open'
  ) INTO v_shift_open;

  IF NOT v_shift_open THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'shift_closed',
      'generated', 0
    );
  END IF;

  -- idleMinutesSinceLastOrder
  SELECT MAX(created_at) INTO v_last_order_at
  FROM public.gm_orders
  WHERE restaurant_id = p_restaurant_id;

  IF v_last_order_at IS NULL THEN
    v_idle_minutes := 999;
  ELSE
    v_idle_minutes := EXTRACT(EPOCH FROM (NOW() - v_last_order_at)) / 60;
  END IF;

  IF v_idle_minutes < p_idle_minutes_threshold THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'idle_under_threshold',
      'idle_minutes', ROUND(v_idle_minutes::numeric, 1),
      'threshold', p_idle_minutes_threshold,
      'generated', 0
    );
  END IF;

  -- Idempotência: já existe tarefa OPEN restaurant_idle?
  IF EXISTS (
    SELECT 1 FROM public.gm_tasks
    WHERE restaurant_id = p_restaurant_id
      AND status = 'OPEN'
      AND source_event = 'restaurant_idle'
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'reason', 'idempotent_skip',
      'generated', 0
    );
  END IF;

  -- Criar tarefa MODO_INTERNO
  INSERT INTO public.gm_tasks (
    restaurant_id,
    task_type,
    message,
    station,
    priority,
    context,
    source_event,
    auto_generated
  ) VALUES (
    p_restaurant_id,
    'MODO_INTERNO',
    p_message,
    'KITCHEN',
    'MEDIA',
    jsonb_build_object('idle_minutes', ROUND(v_idle_minutes::numeric, 1), 'generated_at', NOW()),
    'restaurant_idle',
    true
  )
  RETURNING id INTO v_task_id;

  RETURN jsonb_build_object(
    'success', true,
    'reason', 'generated',
    'task_id', v_task_id,
    'generated', 1
  );
END;
$$;

COMMENT ON FUNCTION public.generate_tasks_if_idle IS 'Gera tarefa MODO_INTERNO quando KDS vazio, turno aberto e idle >= threshold. Idempotente. Ref: FLOW_KDS_TASKS_TABLES.';


-- claim_task: atribui e inicia tarefa (assign + start em uma chamada)
CREATE OR REPLACE FUNCTION public.claim_task(
  p_task_id UUID,
  p_actor_id UUID,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- assign + start atomicamente
  PERFORM public.assign_task(p_task_id, p_actor_id, p_restaurant_id);
  PERFORM public.start_task(p_task_id, p_actor_id, p_restaurant_id);
END;
$$;

COMMENT ON FUNCTION public.claim_task IS 'Atribui e inicia tarefa (assign + start). Ref: FLOW_KDS_TASKS_TABLES.';


GRANT EXECUTE ON FUNCTION public.generate_tasks_if_idle TO postgres;
GRANT EXECUTE ON FUNCTION public.claim_task TO postgres;
