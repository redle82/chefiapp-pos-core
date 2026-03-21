CREATE OR REPLACE FUNCTION public.assign_task(p_task_id uuid, p_assigned_to uuid, p_restaurant_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;
