-- 026_resolve_rpc_ambiguity.sql
-- Fixes "Could not choose function" error by dropping all overloads
-- Drop signature from Migration 021
DROP FUNCTION IF EXISTS public.process_order_payment(UUID, UUID, TEXT, INTEGER, UUID, UUID, TEXT);
-- Drop signature from Migration 025 (just in case)
DROP FUNCTION IF EXISTS public.process_order_payment(UUID, UUID, UUID, UUID, INTEGER, TEXT, TEXT);
-- Recreate Correct Function (from Migration 025) which supports 'served' payment
CREATE OR REPLACE FUNCTION public.process_order_payment(
        p_restaurant_id UUID,
        p_order_id UUID,
        p_cash_register_id UUID,
        p_operator_id UUID,
        p_amount_cents INTEGER,
        p_method TEXT,
        p_idempotency_key TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_status TEXT;
v_order_total INTEGER;
v_register_status TEXT;
BEGIN -- 1. Validate Cash Register
SELECT status INTO v_register_status
FROM public.gm_cash_registers
WHERE id = p_cash_register_id
    AND restaurant_id = p_restaurant_id;
IF v_register_status IS NULL THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Cash Register not found'
);
END IF;
IF v_register_status != 'open' THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Cash Register must be OPEN to process payments'
);
END IF;
-- 2. Validate Order State
SELECT status,
    total_cents INTO v_order_status,
    v_order_total
FROM public.gm_orders
WHERE id = p_order_id
    AND restaurant_id = p_restaurant_id;
IF v_order_status IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Order not found');
END IF;
-- FIX: Allow 'served' to be paid. Only block 'paid' or 'cancelled'.
IF v_order_status IN ('paid', 'cancelled') THEN RETURN jsonb_build_object(
    'success',
    false,
    'error',
    'Order is already final (' || v_order_status || ')'
);
END IF;
-- 3. Idempotency Check (via Unique Index)
-- 4. Execute Payment (Atomic)
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
    );
-- 5. Update Order Status
UPDATE public.gm_orders
SET status = 'paid',
    updated_at = NOW()
WHERE id = p_order_id;
-- 6. Update Cash Register Balance
UPDATE public.gm_cash_registers
SET total_sales_cents = COALESCE(total_sales_cents, 0) + p_amount_cents,
    updated_at = NOW()
WHERE id = p_cash_register_id;
-- 7. Call Observability (Mig 022) - Best Effort
-- We can try to call the logging function here or let it be separate.
-- Let's add it for strict "Sovereign Code" guarantee.
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
RETURN jsonb_build_object('success', true, 'order_id', p_order_id);
EXCEPTION
WHEN unique_violation THEN PERFORM public.fn_log_payment_attempt(
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
    'success',
    false,
    'error',
    'Duplicate transaction (Idempotency Key used)'
);
WHEN OTHERS THEN PERFORM public.fn_log_payment_attempt(
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