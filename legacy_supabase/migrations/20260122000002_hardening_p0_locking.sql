-- Hardening P0-E: Locking & Race Conditions
-- Date: 2026-01-22
-- Purpose: Prevent race conditions where a concurrent 'Cancel' overwrites a 'Paid' status.
-- Mechanism: Explicitly increment 'version' during payment, causing optimistic lock failures in concurrent transactions.

CREATE OR REPLACE FUNCTION public.process_order_payment(
        p_restaurant_id UUID,
        p_order_id UUID,
        p_cash_register_id UUID,
        p_operator_id UUID,
        p_amount_cents INTEGER,
        p_method TEXT,
        p_idempotency_key TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_order_status TEXT;
    v_order_total INTEGER;
    v_register_status TEXT;
    v_total_paid INTEGER := 0; -- Total já pago até agora
    v_new_total_paid INTEGER; -- Total após este pagamento
    v_payment_status TEXT; -- Status final do pagamento
    v_order_payment_status TEXT; -- Status final do pedido
    v_payment_id UUID;
BEGIN 
    -- 1. Validate Cash Register
    SELECT status INTO v_register_status
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id
        AND restaurant_id = p_restaurant_id;
    
    IF v_register_status IS NULL THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cash Register not found'
        );
    END IF;
    
    IF v_register_status != 'open' THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cash Register must be OPEN to process payments'
        );
    END IF;

    -- 2. Validate Order State (com FOR UPDATE para prevenir race conditions)
    SELECT status, total_cents INTO v_order_status, v_order_total
    FROM public.gm_orders
    WHERE id = p_order_id
        AND restaurant_id = p_restaurant_id
    FOR UPDATE; -- Lock pessimista: previne pagamento duplo simultâneo
    
    IF v_order_status IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- FIX: Allow 'served' to be paid. Only block 'paid' or 'cancelled'.
    IF v_order_status IN ('paid', 'cancelled') THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Order is already final (' || v_order_status || ')'
        );
    END IF;

    -- 3. Calcular total já pago (soma de todos os pagamentos do pedido)
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
    FROM public.gm_payments
    WHERE order_id = p_order_id
        AND status = 'paid';

    -- 4. Validar que o pagamento não excede o total do pedido
    v_new_total_paid := v_total_paid + p_amount_cents;
    
    IF v_new_total_paid > v_order_total THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payment amount (' || p_amount_cents || ') exceeds remaining balance (' || (v_order_total - v_total_paid) || ')'
        );
    END IF;

    -- 5. Idempotency Check (via Unique Index)
    -- 6. Execute Payment (Atomic)
    INSERT INTO public.gm_payments (
            tenant_id,
            restaurant_id,
            order_id,
            cash_register_id,
            operator_id,
            amount_cents,
            currency,
            payment_method,
            status,
            idempotency_key,
            created_at
        )
    VALUES (
            p_restaurant_id,
            p_restaurant_id,
            p_order_id,
            p_cash_register_id,
            p_operator_id,
            p_amount_cents,
            'EUR',
            p_method,
            'paid',
            p_idempotency_key,
            NOW()
        )
    RETURNING id INTO v_payment_id;

    -- 7. Determinar status final do pedido baseado no total pago
    IF v_new_total_paid >= v_order_total THEN
        -- Pedido totalmente pago
        v_order_payment_status := 'paid';
        v_order_status := 'paid';
    ELSE
        -- Pedido parcialmente pago
        v_order_payment_status := 'partially_paid';
        v_order_status := 'OPEN'; -- Mantém status OPEN para permitir mais pagamentos
    END IF;

    -- 8. Update Order Status e Payment Status
    -- CRITICAL P0-E FIX: Explicitly increment version to invalidate concurrent Optimistic Locks
    UPDATE public.gm_orders
    SET 
        status = v_order_status,
        payment_status = v_order_payment_status,
        version = version + 1, -- FORCE VERSION BUMP
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 9. Update Cash Register Balance
    UPDATE public.gm_cash_registers
    SET total_sales_cents = COALESCE(total_sales_cents, 0) + p_amount_cents,
        updated_at = NOW()
    WHERE id = p_cash_register_id;

    -- 10. Call Observability (Mig 022) - Best Effort
    PERFORM public.fn_log_payment_attempt(
        p_order_id,
        p_restaurant_id,
        p_operator_id,
        p_amount_cents,
        p_method,
        'success',
        NULL,
        NULL,
        p_idempotency_key,
        NULL,
        NULL,
        NULL
    );

    RETURN jsonb_build_object(
        'success', true, 
        'order_id', p_order_id,
        'payment_id', v_payment_id,
        'payment_status', v_order_payment_status,
        'total_paid', v_new_total_paid,
        'remaining', v_order_total - v_new_total_paid
    );

EXCEPTION
    WHEN unique_violation THEN 
        PERFORM public.fn_log_payment_attempt(
            p_order_id,
            p_restaurant_id,
            p_operator_id,
            p_amount_cents,
            p_method,
            'fail',
            'IDEMPOTENCY',
            'Duplicate Transaction',
            p_idempotency_key
        );
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Duplicate transaction (Idempotency Key used)'
        );
    WHEN OTHERS THEN 
        PERFORM public.fn_log_payment_attempt(
            p_order_id,
            p_restaurant_id,
            p_operator_id,
            p_amount_cents,
            p_method,
            'fail',
            'UNKNOWN',
            SQLERRM,
            p_idempotency_key
        );
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
