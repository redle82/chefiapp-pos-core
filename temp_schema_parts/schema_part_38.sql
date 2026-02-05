-- Onda 2 · D1 + D2 — Eventos shift_started/shift_ended (EVENT_TAXONOMY) e RPC métricas operacionais (METRICS_DICTIONARY).
-- Ref: docs/architecture/EVENT_TAXONOMY.md, docs/architecture/METRICS_DICTIONARY.md

-- ==============================================================================
-- D1: shift_started em start_turn
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.start_turn(
    p_restaurant_id uuid,
    p_operational_mode operational_mode,
    p_device_id text,
    p_device_name text,
    p_role_at_turn text,
    p_permissions_snapshot jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_session_id uuid;
    v_user_role text;
    v_new_session_id uuid;
BEGIN
    IF p_operational_mode = 'tower' THEN
        SELECT role INTO v_user_role
        FROM public.gm_restaurant_members
        WHERE user_id = auth.uid() AND restaurant_id = p_restaurant_id AND disabled_at IS NULL;

        IF v_user_role IS NULL OR v_user_role NOT IN ('owner', 'manager') THEN
            RETURN jsonb_build_object('success', false, 'error', 'TOWER_MODE_FORBIDDEN');
        END IF;
    END IF;

    SELECT id INTO v_existing_session_id
    FROM public.turn_sessions
    WHERE user_id = auth.uid() AND device_id = p_device_id AND status = 'active'
    LIMIT 1;

    IF v_existing_session_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'session_id', v_existing_session_id, 'resumed', true);
    END IF;

    IF NOT public.is_user_member_of_restaurant(p_restaurant_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'NOT_MEMBER');
    END IF;

    INSERT INTO public.turn_sessions (
        restaurant_id, user_id, role_at_turn, operational_mode,
        device_id, device_name, permissions_snapshot, status
    ) VALUES (
        p_restaurant_id, auth.uid(), p_role_at_turn, p_operational_mode,
        p_device_id, p_device_name, p_permissions_snapshot, 'active'
    ) RETURNING id INTO v_new_session_id;

    -- EVENT_TAXONOMY: shift_started
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'SHIFT_STARTED',
            'turn_session',
            v_new_session_id::text,
            jsonb_build_object('device_id', p_device_id, 'operational_mode', p_operational_mode::text),
            'shift_started',
            'user',
            'success'
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'session_id', v_new_session_id, 'resumed', false);
END;
$$;

-- ==============================================================================
-- D1: shift_ended — trigger quando turn_sessions passa a closed/force_closed
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.gm_audit_shift_ended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.status = 'active' AND NEW.status IN ('closed', 'force_closed') THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            NEW.restaurant_id,
            COALESCE(auth.uid(), OLD.user_id),
            'SHIFT_ENDED',
            'turn_session',
            NEW.id::text,
            jsonb_build_object('user_id', OLD.user_id, 'ended_at', NEW.ended_at),
            'shift_ended',
            'user',
            'success'
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_turn_sessions_audit_shift_ended ON public.turn_sessions;
CREATE TRIGGER tr_turn_sessions_audit_shift_ended
    AFTER UPDATE OF status ON public.turn_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.gm_audit_shift_ended();

-- ==============================================================================
-- D2: RPC get_operational_metrics (METRICS_DICTIONARY — por tenant e período)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_operational_metrics(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_orders_created_total BIGINT;
    v_orders_cancelled_total BIGINT;
    v_payments_recorded_total BIGINT;
    v_payments_amount_cents BIGINT;
    v_active_shifts_count BIGINT;
    v_export_requested_count BIGINT;
BEGIN
    IF NOT (
        EXISTS (SELECT 1 FROM public.gm_restaurants r WHERE r.id = p_restaurant_id AND r.owner_id = auth.uid())
        OR public.is_user_member_of_restaurant(p_restaurant_id)
    ) THEN
        RAISE EXCEPTION 'Access Denied: You are not a member of this restaurant.';
    END IF;

    IF p_from IS NULL OR p_to IS NULL OR p_from > p_to THEN
        RAISE EXCEPTION 'Invalid period: p_from and p_to required, p_from <= p_to.';
    END IF;

    SELECT COUNT(*) INTO v_orders_created_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*) INTO v_orders_cancelled_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to
      AND (status = 'cancelled' OR status = 'CANCELLED');

    SELECT COUNT(*), COALESCE(SUM(amount_cents), 0) INTO v_payments_recorded_total, v_payments_amount_cents
    FROM public.gm_payments
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*) INTO v_active_shifts_count
    FROM public.turn_sessions
    WHERE restaurant_id = p_restaurant_id AND status = 'active';

    SELECT COUNT(*) INTO v_export_requested_count
    FROM public.gm_audit_logs
    WHERE tenant_id = p_restaurant_id
      AND event_type = 'export_requested'
      AND created_at >= p_from AND created_at <= p_to;

    RETURN jsonb_build_object(
        'schema_version', 'operational_metrics_v1',
        'tenant_id', p_restaurant_id,
        'period', jsonb_build_object('start', p_from, 'end', p_to),
        'orders_created_total', v_orders_created_total,
        'orders_cancelled_total', v_orders_cancelled_total,
        'payments_recorded_total', v_payments_recorded_total,
        'payments_amount_cents', v_payments_amount_cents,
        'active_shifts_count', v_active_shifts_count,
        'export_requested_count', v_export_requested_count,
        'daily_revenue_cents', v_payments_amount_cents,
        'daily_orders_count', v_orders_created_total,
        'avg_order_value_cents', CASE WHEN v_orders_created_total > 0 THEN (v_payments_amount_cents / v_orders_created_total) ELSE 0 END
    );
END;
$$;

COMMENT ON FUNCTION public.get_operational_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS
  'Métricas operacionais por tenant e período (METRICS_DICTIONARY). orders_created_total, payments_recorded_total, active_shifts_count, etc.';
;
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
;
-- Migration: Add billing_status to gm_restaurants (Onda 4.5)
-- Purpose: Portal and Core use gm_restaurants.billing_status for trial | active | past_due | canceled.
-- Refs: merchant-portal GlobalUIStateContext, RuntimeReader, coreBillingApi.

ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS billing_status text DEFAULT 'trial';

COMMENT ON COLUMN public.gm_restaurants.billing_status IS 'SaaS billing state: trial | active | past_due | canceled';

-- Optional: constraint for valid values (uncomment if desired)
-- ALTER TABLE public.gm_restaurants
-- ADD CONSTRAINT gm_restaurants_billing_status_check
-- CHECK (billing_status IS NULL OR billing_status IN ('trial', 'active', 'past_due', 'canceled'));
;
