CREATE OR REPLACE FUNCTION public.process_webhook_event(p_provider character varying, p_event_type character varying, p_event_id character varying, p_payload jsonb, p_signature character varying)
 RETURNS TABLE(id uuid, status character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    INSERT INTO webhook_events (
        provider, event_type, event_id, raw_payload, signature, status
    ) VALUES (
        p_provider, p_event_type, p_event_id, p_payload, p_signature, 'PENDING'
    )
    ON CONFLICT (provider, event_id) DO UPDATE
    SET status = 'PENDING', verified_at = NOW(), updated_at = NOW()
    RETURNING webhook_events.id, webhook_events.status;
END;
$function$;
