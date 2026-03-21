CREATE OR REPLACE FUNCTION public.reject_task(p_task_id uuid, p_reason text DEFAULT NULL::text, p_actor_id uuid DEFAULT NULL::uuid, p_restaurant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;
