-- 20260128_core_payments_and_cash_registers.sql
-- Fase 3 Financial Core: Tabelas e RPCs de caixa, pagamentos e observabilidade.
-- Alinhado com CORE_FINANCIAL_SOVEREIGNTY_CONTRACT e FINANCIAL_CORE_VIOLATION_AUDIT.
-- Referência: supabase/migrations 019, 021, 022, 20260120000001, 20260122000002.

-- =============================================================================
-- 1. PARTIALLY_PAID no payment_status (gm_orders)
-- =============================================================================
ALTER TABLE public.gm_orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.gm_orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'REFUNDED'));

-- =============================================================================
-- 2. TABELAS: gm_cash_registers, gm_payments, gm_payment_audit_logs
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Caixa Principal',
    status TEXT NOT NULL DEFAULT 'closed',
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opened_by TEXT,
    closed_by TEXT,
    opening_balance_cents BIGINT DEFAULT 0,
    closing_balance_cents BIGINT,
    total_sales_cents BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT gm_cash_registers_status_check CHECK (status IN ('open', 'closed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_cash_registers_one_open
  ON public.gm_cash_registers(restaurant_id)
  WHERE status = 'open';
COMMENT ON INDEX idx_gm_cash_registers_one_open IS 'Only one open cash register per restaurant.';

CREATE TABLE IF NOT EXISTS public.gm_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE CASCADE,
    cash_register_id UUID REFERENCES public.gm_cash_registers(id),
    operator_id UUID,
    amount_cents BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid',
    idempotency_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT gm_payments_status_check CHECK (status IN ('paid', 'failed', 'refunded'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_payments_idempotency
  ON public.gm_payments(idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.gm_payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    order_id UUID,
    operator_id UUID,
    amount_cents INTEGER,
    method TEXT,
    result TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT,
    payment_id UUID,
    duration_ms INTEGER,
    client_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_restaurant_date
  ON public.gm_payment_audit_logs(restaurant_id, created_at);

-- =============================================================================
-- 3. RPC: open_cash_register_atomic
-- =============================================================================
CREATE OR REPLACE FUNCTION public.open_cash_register_atomic(
    p_restaurant_id UUID,
    p_name TEXT DEFAULT 'Caixa Principal',
    p_opened_by TEXT DEFAULT NULL,
    p_opening_balance_cents BIGINT DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM public.gm_cash_registers WHERE restaurant_id = p_restaurant_id AND status = 'open') THEN
        RAISE EXCEPTION 'CASH_REGISTER_ALREADY_OPEN';
    END IF;
    INSERT INTO public.gm_cash_registers (restaurant_id, name, status, opened_at, opened_by, opening_balance_cents, updated_at)
    VALUES (p_restaurant_id, COALESCE(NULLIF(TRIM(p_name), ''), 'Caixa Principal'), 'open', NOW(), p_opened_by, COALESCE(p_opening_balance_cents, 0), NOW())
    RETURNING id INTO v_id;
    RETURN jsonb_build_object('id', v_id, 'status', 'open');
END;
$$;

-- =============================================================================
-- 4. RPC: fn_log_payment_attempt (antes de process_order_payment)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.fn_log_payment_attempt(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_operator_id UUID,
    p_amount_cents INTEGER,
    p_method TEXT,
    p_result TEXT,
    p_error_code TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL,
    p_client_info TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- =============================================================================
-- 5. RPC: get_payment_health
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_payment_health(p_restaurant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempts_24h INTEGER;
    v_success_24h INTEGER;
    v_fail_24h INTEGER;
    v_avg_duration_ms NUMERIC;
    v_total_processed_cents BIGINT;
    v_most_common_error TEXT;
    v_success_rate NUMERIC;
BEGIN
    WITH window_stats AS (
        SELECT result, duration_ms, amount_cents, error_code
        FROM public.gm_payment_audit_logs
        WHERE restaurant_id = p_restaurant_id AND created_at >= NOW() - INTERVAL '24 hours'
    )
    SELECT
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE result = 'success')::INTEGER,
        COUNT(*) FILTER (WHERE result != 'success')::INTEGER,
        AVG(duration_ms) FILTER (WHERE result = 'success')::NUMERIC(10,2),
        COALESCE(SUM(amount_cents) FILTER (WHERE result = 'success'), 0)::BIGINT,
        (array_agg(error_code) FILTER (WHERE result != 'success' AND error_code IS NOT NULL))[1]
    INTO v_attempts_24h, v_success_24h, v_fail_24h, v_avg_duration_ms, v_total_processed_cents, v_most_common_error
    FROM window_stats;
    IF v_attempts_24h > 0 THEN
        v_success_rate := (v_success_24h::NUMERIC / v_attempts_24h::NUMERIC) * 100;
    ELSE
        v_success_rate := 100;
    END IF;
    RETURN jsonb_build_object(
        'attempts_24h', COALESCE(v_attempts_24h, 0),
        'success_24h', COALESCE(v_success_24h, 0),
        'fail_24h', COALESCE(v_fail_24h, 0),
        'success_rate', TRUNC(v_success_rate, 2),
        'avg_duration_ms', COALESCE(v_avg_duration_ms, 0),
        'total_processed_cents', COALESCE(v_total_processed_cents, 0),
        'most_common_error', v_most_common_error
    );
END;
$$;

-- =============================================================================
-- 6. RPC: process_order_payment (assinatura por nome: cliente envia p_order_id, p_restaurant_id, ...)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.process_order_payment(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_cash_register_id UUID,
    p_method TEXT,
    p_amount_cents INTEGER,
    p_operator_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- =============================================================================
-- 7. RPC: process_split_payment_atomic (mesma lógica; cliente espera remaining_after, is_fully_paid)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.process_split_payment_atomic(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_cash_register_id UUID,
    p_method TEXT,
    p_amount_cents INTEGER,
    p_operator_id UUID DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.process_order_payment(
        p_order_id, p_restaurant_id, p_cash_register_id, p_method, p_amount_cents, p_operator_id, p_idempotency_key
    );
END;
$$;

-- =============================================================================
-- 8. RPC: process_inventory_deduction (deduz stock por itens do pedido)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.process_inventory_deduction(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_updated INTEGER := 0;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.quantity
        FROM public.gm_order_items oi
        WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL
    LOOP
        UPDATE public.gm_products
        SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - v_item.quantity),
            updated_at = NOW()
        WHERE id = v_item.product_id AND track_stock = true;
        IF FOUND THEN
            v_updated := v_updated + 1;
        END IF;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'items_updated', v_updated);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON TABLE public.gm_cash_registers IS 'Financial Core: one open cash register per restaurant.';
COMMENT ON TABLE public.gm_payments IS 'Financial Core: all payments via RPC only.';
COMMENT ON FUNCTION public.open_cash_register_atomic IS 'Core RPC: open cash register atomically. One open per restaurant.';
COMMENT ON FUNCTION public.process_order_payment IS 'Core RPC: process payment (full or partial).';
COMMENT ON FUNCTION public.process_split_payment_atomic IS 'Core RPC: alias for process_order_payment (split bill).';
COMMENT ON FUNCTION public.process_inventory_deduction IS 'Core RPC: deduct stock for order items (track_stock products).';
