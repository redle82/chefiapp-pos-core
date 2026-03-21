CREATE OR REPLACE FUNCTION public.fn_log_payment_attempt(p_order_id uuid, p_restaurant_id uuid, p_operator_id uuid, p_amount_cents integer, p_method text, p_result text, p_error_code text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text, p_idempotency_key text DEFAULT NULL::text, p_payment_id uuid DEFAULT NULL::uuid, p_duration_ms integer DEFAULT NULL::integer, p_client_info text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE v_log_id UUID;
BEGIN
    INSERT INTO public.gm_payment_audit_logs (
        order_id, restaurant_id, operator_id, amount_cents, method, result,
        error_code, error_message, idempotency_key, payment_id, duration_ms, client_info
    ) VALUES (
        p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, p_result,
        p_error_code, p_error_message, p_idempotency_key, p_payment_id, p_duration_ms,
        CASE WHEN p_client_info IS NOT NULL AND TRIM(p_client_info) != '' THEN (p_client_info::jsonb) ELSE NULL END
    )
    RETURNING id INTO v_log_id;
    RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
