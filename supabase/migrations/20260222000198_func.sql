CREATE OR REPLACE FUNCTION public.mark_webhook_processed(p_event_uuid uuid, p_status character varying DEFAULT 'PROCESSED'::character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE webhook_events
    SET status = p_status, processed_at = NOW(), updated_at = NOW()
    WHERE id = p_event_uuid;
END;
$function$;
