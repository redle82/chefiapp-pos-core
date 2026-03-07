CREATE OR REPLACE FUNCTION public.process_split_payment_atomic(p_order_id uuid, p_restaurant_id uuid, p_cash_register_id uuid, p_method text, p_amount_cents integer, p_operator_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN public.process_order_payment(
        p_order_id, p_restaurant_id, p_cash_register_id, p_method, p_amount_cents, p_operator_id, p_idempotency_key
    );
END;
$function$;
