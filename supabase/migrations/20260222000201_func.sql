CREATE OR REPLACE FUNCTION public.process_order_payment(p_order_id uuid, p_restaurant_id uuid, p_cash_register_id uuid, p_method text, p_amount_cents integer, p_operator_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order_status TEXT;
    v_order_total INTEGER;
    v_register_status TEXT;
    v_total_paid INTEGER := 0;
    v_new_total_paid INTEGER;
    v_order_payment_status TEXT;
    v_order_final_status TEXT;
    v_payment_id UUID;
BEGIN
    SELECT status INTO v_register_status
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id AND restaurant_id = p_restaurant_id;
    IF v_register_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register not found');
    END IF;
    IF v_register_status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register must be OPEN to process payments');
    END IF;
    SELECT status, total_cents INTO v_order_status, v_order_total
    FROM public.gm_orders
    WHERE id = p_order_id AND restaurant_id = p_restaurant_id
    FOR UPDATE;
    IF v_order_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    IF v_order_status IN ('CLOSED', 'CANCELLED') OR v_order_status = 'paid' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is already final (' || COALESCE(v_order_status, '') || ')');
    END IF;
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
    FROM public.gm_payments
    WHERE order_id = p_order_id AND status = 'paid';
    v_new_total_paid := v_total_paid + p_amount_cents;
    IF v_new_total_paid > v_order_total THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment amount exceeds remaining balance');
    END IF;
    INSERT INTO public.gm_payments (
        restaurant_id, order_id, cash_register_id, operator_id, amount_cents, currency, payment_method, status, idempotency_key, updated_at
    ) VALUES (
        p_restaurant_id, p_order_id, p_cash_register_id, p_operator_id, p_amount_cents, 'EUR', p_method, 'paid', p_idempotency_key, NOW()
    )
    RETURNING id INTO v_payment_id;
    IF v_new_total_paid >= v_order_total THEN
        v_order_payment_status := 'PAID';
        v_order_final_status := 'CLOSED';
    ELSE
        v_order_payment_status := 'PARTIALLY_PAID';
        v_order_final_status := 'OPEN';
    END IF;
    UPDATE public.gm_orders
    SET status = v_order_final_status, payment_status = v_order_payment_status, updated_at = NOW()
    WHERE id = p_order_id;
    UPDATE public.gm_cash_registers
    SET total_sales_cents = COALESCE(total_sales_cents, 0) + p_amount_cents, updated_at = NOW()
    WHERE id = p_cash_register_id;
    PERFORM public.fn_log_payment_attempt(
        p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'success',
        NULL, NULL, p_idempotency_key, v_payment_id, NULL, NULL
    );
    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'payment_status', v_order_payment_status,
        'total_paid', v_new_total_paid,
        'remaining', v_order_total - v_new_total_paid
    );
EXCEPTION
    WHEN unique_violation THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'fail',
            'IDEMPOTENCY', 'Duplicate Transaction', p_idempotency_key, NULL, NULL, NULL
        );
        RETURN jsonb_build_object('success', false, 'error', 'Duplicate transaction (Idempotency Key used)');
    WHEN OTHERS THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method, 'fail',
            'UNKNOWN', SQLERRM, p_idempotency_key, NULL, NULL, NULL
        );
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
