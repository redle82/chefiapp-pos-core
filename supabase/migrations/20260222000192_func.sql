CREATE OR REPLACE FUNCTION public.create_task(p_restaurant_id uuid, p_task_type text, p_message text, p_station text DEFAULT NULL::text, p_priority text DEFAULT 'MEDIA'::text, p_order_id uuid DEFAULT NULL::uuid, p_order_item_id uuid DEFAULT NULL::uuid, p_context jsonb DEFAULT '{}'::jsonb, p_auto_generated boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;
