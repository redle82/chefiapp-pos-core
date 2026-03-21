CREATE OR REPLACE FUNCTION public.open_cash_register_atomic(p_restaurant_id uuid, p_name text DEFAULT 'Caixa Principal'::text, p_opened_by text DEFAULT NULL::text, p_opening_balance_cents bigint DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE v_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM public.gm_cash_registers WHERE restaurant_id = p_restaurant_id AND status = 'open') THEN
        RAISE EXCEPTION 'CASH_REGISTER_ALREADY_OPEN';
    END IF;
    INSERT INTO public.gm_cash_registers (restaurant_id, name, status, opened_at, opened_by, opening_balance_cents, updated_at)
    VALUES (p_restaurant_id, COALESCE(NULLIF(TRIM(p_name), ''), 'Caixa Principal'), 'open', NOW(), p_opened_by, COALESCE(p_opening_balance_cents, 0), NOW())
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('id', v_id, 'status', 'open');
END;
$function$;
