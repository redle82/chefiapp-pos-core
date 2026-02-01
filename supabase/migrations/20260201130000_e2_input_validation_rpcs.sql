-- Onda 3 · E2 — Validação de entrada nos RPCs críticos (THREAT_MODEL, OWASP 5.1.x).
-- Rejeitar entradas inválidas antes de autorização e lógica de negócio.
-- Ref: docs/architecture/THREAT_MODEL.md, docs/architecture/THREAT_MODEL_MITIGATION_MATRIX.md, OWASP_ASVS_CHECKLIST.md

-- Constantes de validação (limites defensivos)
-- create_order_atomic: máximo de linhas por pedido; quantidade e preço
-- process_order_payment: métodos de pagamento permitidos

-- ==============================================================================
-- 1. create_order_atomic — validação de p_items e p_payment_method
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_total_cents INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_short_id TEXT;
    v_count INTEGER;
    v_idx INT;
    v_len INT;
BEGIN
    -- E2: Input validation (OWASP 5.1.x) — reject invalid before auth
    IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' THEN
        RAISE EXCEPTION 'Invalid input: p_items must be a non-null JSON array.';
    END IF;
    v_len := jsonb_array_length(p_items);
    IF v_len < 1 OR v_len > 500 THEN
        RAISE EXCEPTION 'Invalid input: p_items must have between 1 and 500 elements, got %.', v_len;
    END IF;
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_idx := v_idx + 1;
        IF v_item->>'product_id' IS NULL OR v_item->>'product_id' = '' THEN
            RAISE EXCEPTION 'Invalid input: item % missing or empty product_id.', v_idx;
        END IF;
        IF v_item->>'name' IS NULL OR length(trim(v_item->>'name')) < 1 OR length(v_item->>'name') > 500 THEN
            RAISE EXCEPTION 'Invalid input: item % name must be 1-500 chars.', v_idx;
        END IF;
        IF v_item->>'quantity' IS NULL OR v_item->>'quantity' = '' OR v_item->>'quantity' !~ '^[0-9]+$' OR (v_item->>'quantity')::INTEGER < 1 OR (v_item->>'quantity')::INTEGER > 9999 THEN
            RAISE EXCEPTION 'Invalid input: item % quantity must be integer 1-9999.', v_idx;
        END IF;
        IF v_item->>'unit_price' IS NULL OR v_item->>'unit_price' = '' OR v_item->>'unit_price' !~ '^[0-9]+$' OR (v_item->>'unit_price')::INTEGER < 0 THEN
            RAISE EXCEPTION 'Invalid input: item % unit_price must be non-negative integer.', v_idx;
        END IF;
    END LOOP;
    IF p_payment_method IS NULL OR p_payment_method NOT IN ('cash', 'card', 'other', 'split') THEN
        RAISE EXCEPTION 'Invalid input: p_payment_method must be one of cash, card, other, split.';
    END IF;

    -- Authorisation (unchanged)
    IF auth.uid() IS NOT NULL AND auth.role() = 'authenticated' THEN
        IF NOT (
            EXISTS (SELECT 1 FROM public.gm_restaurants WHERE id = p_restaurant_id AND owner_id = auth.uid())
            OR public.is_user_member_of_restaurant(p_restaurant_id)
        ) THEN
            RAISE EXCEPTION 'Access Denied: You are not a member of this restaurant.';
        END IF;
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_cents := v_total_cents + v_item_total;
    END LOOP;

    SELECT count(*) + 1 INTO v_count
    FROM public.gm_orders WHERE restaurant_id = p_restaurant_id;
    v_short_id := '#' || v_count::TEXT;

    INSERT INTO public.gm_orders (restaurant_id, short_id, status, total_cents, payment_status, payment_method, sync_metadata)
    VALUES (p_restaurant_id, v_short_id, 'PENDING', v_total_cents, 'PENDING', p_payment_method, p_sync_metadata)
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.gm_order_items (order_id, product_id, name_snapshot, quantity, price_snapshot, subtotal_cents)
        VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'name',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::INTEGER,
            (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER
        );
    END LOOP;

    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'ORDER_CREATED',
            'order',
            v_order_id::text,
            jsonb_build_object('short_id', v_short_id, 'total_cents', v_total_cents),
            'order_created',
            'user',
            'success'
        );
    END IF;

    RETURN jsonb_build_object('id', v_order_id, 'short_id', v_short_id, 'total_cents', v_total_cents, 'status', 'PENDING');
END;
$$;

COMMENT ON FUNCTION public.create_order_atomic(UUID, JSONB, TEXT, JSONB) IS
  'E2 Onda 3: input validation (p_items 1-500 elements, quantity 1-9999, unit_price >= 0, payment_method allowed). THREAT_MODEL mitigation.';

-- ==============================================================================
-- 2. process_order_payment — validação de p_amount_cents e p_method
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_order_payment(
        p_restaurant_id UUID,
        p_order_id UUID,
        p_cash_register_id UUID,
        p_operator_id UUID,
        p_amount_cents INTEGER,
        p_method TEXT,
        p_idempotency_key TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_order_status TEXT;
    v_order_total INTEGER;
    v_register_status TEXT;
    v_total_paid INTEGER := 0;
    v_new_total_paid INTEGER;
    v_payment_status TEXT;
    v_order_payment_status TEXT;
    v_payment_id UUID;
BEGIN
    -- E2: Input validation (OWASP 5.1.x)
    IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid input: amount_cents must be positive.');
    END IF;
    IF p_method IS NULL OR p_method NOT IN ('cash', 'card', 'other', 'split') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid input: method must be one of cash, card, other, split.');
    END IF;

    SELECT status INTO v_register_status
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id
        AND restaurant_id = p_restaurant_id;

    IF v_register_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register not found');
    END IF;

    IF v_register_status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cash Register must be OPEN to process payments');
    END IF;

    SELECT status, total_cents INTO v_order_status, v_order_total
    FROM public.gm_orders
    WHERE id = p_order_id
        AND restaurant_id = p_restaurant_id
    FOR UPDATE;

    IF v_order_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    IF v_order_status IN ('paid', 'cancelled') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order is already final (' || v_order_status || ')');
    END IF;

    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
    FROM public.gm_payments
    WHERE order_id = p_order_id
        AND status = 'paid';

    v_new_total_paid := v_total_paid + p_amount_cents;

    IF v_new_total_paid > v_order_total THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment amount (' || p_amount_cents || ') exceeds remaining balance (' || (v_order_total - v_total_paid) || ')');
    END IF;

    INSERT INTO public.gm_payments (
            tenant_id, restaurant_id, order_id, cash_register_id, operator_id,
            amount_cents, currency, payment_method, status, idempotency_key, created_at
        )
    VALUES (
            p_restaurant_id, p_restaurant_id, p_order_id, p_cash_register_id, p_operator_id,
            p_amount_cents, 'EUR', p_method, 'paid', p_idempotency_key, NOW()
        )
    RETURNING id INTO v_payment_id;

    IF v_new_total_paid >= v_order_total THEN
        v_order_payment_status := 'paid';
        v_order_status := 'paid';
    ELSE
        v_order_payment_status := 'partially_paid';
        v_order_status := 'OPEN';
    END IF;

    UPDATE public.gm_orders
    SET status = v_order_status, payment_status = v_order_payment_status,
        version = version + 1, updated_at = NOW()
    WHERE id = p_order_id;

    UPDATE public.gm_cash_registers
    SET total_sales_cents = COALESCE(total_sales_cents, 0) + p_amount_cents, updated_at = NOW()
    WHERE id = p_cash_register_id;

    PERFORM public.fn_log_payment_attempt(
        p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method,
        'success', NULL, NULL, p_idempotency_key, NULL, NULL, NULL
    );

    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'PAYMENT_RECORDED',
            'payment',
            v_payment_id::text,
            jsonb_build_object('order_id', p_order_id, 'amount_cents', p_amount_cents, 'method', p_method),
            'payment_recorded',
            'user',
            'success'
        );
    END IF;

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
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method,
            'fail', 'IDEMPOTENCY', 'Duplicate Transaction', p_idempotency_key
        );
        RETURN jsonb_build_object('success', false, 'error', 'Duplicate transaction (Idempotency Key used)');
    WHEN OTHERS THEN
        PERFORM public.fn_log_payment_attempt(
            p_order_id, p_restaurant_id, p_operator_id, p_amount_cents, p_method,
            'fail', 'UNKNOWN', SQLERRM, p_idempotency_key
        );
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.process_order_payment(UUID, UUID, UUID, UUID, INTEGER, TEXT, TEXT) IS
  'E2 Onda 3: input validation (amount_cents > 0, method in allowed list). THREAT_MODEL mitigation.';
