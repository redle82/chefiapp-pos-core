-- =============================================================================
-- APPSTAFF TASK RPCs — create_task, assign_task, start_task, complete_task, reject_task
-- =============================================================================
-- Data: 2026-02-03
-- Objetivo: RPCs mínimas para o AppStaff (TASKS_CONTRACT_v1, CORE_TASK_EXECUTION_CONTRACT).
--           gm_tasks usa status OPEN → ACKNOWLEDGED → RESOLVED | DISMISSED.
-- =============================================================================

-- RPC: create_task — cria tarefa no Core (status OPEN)
CREATE OR REPLACE FUNCTION public.create_task(
  p_restaurant_id UUID,
  p_task_type TEXT,
  p_message TEXT,
  p_station TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'MEDIA',
  p_order_id UUID DEFAULT NULL,
  p_order_item_id UUID DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_auto_generated BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.gm_tasks (
    restaurant_id, task_type, message, station, priority,
    order_id, order_item_id, context, status, auto_generated
  ) VALUES (
    p_restaurant_id, p_task_type, p_message,
    NULLIF(p_station, '')::TEXT,
    COALESCE(NULLIF(p_priority, ''), 'MEDIA'),
    p_order_id, p_order_item_id, COALESCE(p_context, '{}'::jsonb),
    'OPEN', p_auto_generated
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.create_task IS 'AppStaff: cria tarefa. Status inicial OPEN. Conforme TASKS_CONTRACT_v1.';


-- RPC: assign_task — atribui tarefa a um utilizador (continua OPEN)
CREATE OR REPLACE FUNCTION public.assign_task(
  p_task_id UUID,
  p_assigned_to UUID,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET assigned_to = p_assigned_to, updated_at = NOW()
  WHERE id = p_task_id AND status = 'OPEN';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not in OPEN status', p_task_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.assign_task IS 'AppStaff: atribui tarefa a um user. Apenas tarefas OPEN.';


-- RPC: start_task — marca tarefa como em execução (OPEN → ACKNOWLEDGED)
CREATE OR REPLACE FUNCTION public.start_task(
  p_task_id UUID,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET status = 'ACKNOWLEDGED', acknowledged_at = NOW(), updated_at = NOW()
  WHERE id = p_task_id AND status = 'OPEN';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or not in OPEN status', p_task_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.start_task IS 'AppStaff: inicia execução da tarefa. OPEN → ACKNOWLEDGED.';


-- RPC: complete_task — marca tarefa como concluída (RESOLVED)
CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_id UUID,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  SELECT restaurant_id INTO v_restaurant_id FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET status = 'RESOLVED', resolved_at = COALESCE(resolved_at, NOW()), updated_at = NOW()
  WHERE id = p_task_id AND status IN ('OPEN', 'ACKNOWLEDGED');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or already terminal', p_task_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.complete_task IS 'AppStaff: conclui tarefa. OPEN/ACKNOWLEDGED → RESOLVED.';


-- RPC: reject_task — rejeita tarefa com motivo (DISMISSED, motivo em context)
CREATE OR REPLACE FUNCTION public.reject_task(
  p_task_id UUID,
  p_reason TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
  v_context JSONB;
BEGIN
  SELECT restaurant_id, context INTO v_restaurant_id, v_context FROM public.gm_tasks WHERE id = p_task_id;
  IF v_restaurant_id IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', p_task_id;
  END IF;
  IF p_restaurant_id IS NOT NULL AND v_restaurant_id != p_restaurant_id THEN
    RAISE EXCEPTION 'Task does not belong to restaurant %', p_restaurant_id;
  END IF;
  UPDATE public.gm_tasks
  SET
    status = 'DISMISSED',
    resolved_at = COALESCE(resolved_at, NOW()),
    updated_at = NOW(),
    context = jsonb_set(COALESCE(context, '{}'::jsonb), '{reject_reason}', to_jsonb(COALESCE(p_reason, '')::TEXT))
  WHERE id = p_task_id AND status IN ('OPEN', 'ACKNOWLEDGED');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task % not found or already terminal', p_task_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.reject_task IS 'AppStaff: rejeita tarefa com motivo registado em context.reject_reason. OPEN/ACK → DISMISSED.';
