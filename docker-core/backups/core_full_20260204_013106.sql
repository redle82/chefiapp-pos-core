--
-- PostgreSQL database dump
--

\restrict Kr3sT0M6wztiNIEUBOpjgrMeWIWIvuzocVkkX9KVaWHUOreerdLzoUfoBB8U3Oy

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA _realtime;


ALTER SCHEMA _realtime OWNER TO postgres;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: create_order_atomic(uuid, jsonb, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_order_atomic(p_restaurant_id uuid, p_items jsonb, p_payment_method text DEFAULT 'cash'::text, p_sync_metadata jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order_id UUID;
    v_total_cents INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_prod_id UUID;
    v_qty INTEGER;
    v_prod_name TEXT;
    v_unit_price INTEGER;
    v_table_id UUID;
    v_table_number INTEGER;
    v_prep_time_seconds INTEGER;
    v_prep_category TEXT;
    v_station TEXT;
BEGIN
    -- Extract table info from sync_metadata if provided
    IF p_sync_metadata IS NOT NULL THEN
        v_table_id := (p_sync_metadata->>'table_id')::UUID;
        v_table_number := (p_sync_metadata->>'table_number')::INTEGER;
    END IF;

    -- 1. Calculate Total Amount
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_cents := v_total_cents + v_item_total;
    END LOOP;

    -- 2. Insert Order (Atomic) - Constraint idx_one_open_order_per_table será aplicada automaticamente
    INSERT INTO public.gm_orders (
        restaurant_id,
        table_id,
        table_number,
        status,
        total_cents,
        subtotal_cents,
        payment_status,
        sync_metadata,
        origin,
        metadata
    )
    VALUES (
        p_restaurant_id,
        v_table_id,
        v_table_number,
        'OPEN',
        v_total_cents,
        v_total_cents,
        'PENDING',
        p_sync_metadata,
        COALESCE((p_sync_metadata->>'origin')::TEXT, 'CAIXA'),
        jsonb_build_object('payment_method', p_payment_method)
    )
    RETURNING id INTO v_order_id;

    -- 3. Insert Order Items (com autoria para divisão de conta + prep_time snapshot)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_prod_name := v_item->>'name';
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;

        -- Buscar prep_time e station do produto (snapshot no momento do pedido)
        SELECT prep_time_seconds, prep_category, station
        INTO v_prep_time_seconds, v_prep_category, v_station
        FROM public.gm_products
        WHERE id = v_prod_id;

        -- Valores padrão se produto não encontrado ou sem prep_time
        v_prep_time_seconds := COALESCE(v_prep_time_seconds, 300); -- 5 min padrão
        v_prep_category := COALESCE(v_prep_category, 'main');
        v_station := COALESCE(v_station, 'KITCHEN');

        INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            name_snapshot,
            price_snapshot,
            quantity,
            subtotal_cents,
            -- Prep time snapshot (para timer por item)
            prep_time_seconds,
            prep_category,
            -- Station snapshot (BAR vs KITCHEN)
            station,
            -- Autoria do item (para divisão de conta)
            created_by_user_id,
            created_by_role,
            device_id
        )
        VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_unit_price,
            v_qty,
            v_unit_price * v_qty,
            -- Prep time snapshot (para timer por item)
            v_prep_time_seconds,
            v_prep_category,
            -- Station snapshot (BAR vs KITCHEN)
            v_station,
            -- Extrair autoria do item (se presente)
            (v_item->>'created_by_user_id')::UUID,
            v_item->>'created_by_role',
            v_item->>'device_id'
        );
    END LOOP;

    -- 4. Return Created Order
    RETURN jsonb_build_object(
        'id', v_order_id,
        'total_cents', v_total_cents,
        'status', 'OPEN'
    );
EXCEPTION
    WHEN unique_violation THEN
        -- Constraint idx_one_open_order_per_table violada
        RAISE EXCEPTION 'TABLE_HAS_ACTIVE_ORDER: Esta mesa já possui um pedido aberto';
END;
$$;


ALTER FUNCTION public.create_order_atomic(p_restaurant_id uuid, p_items jsonb, p_payment_method text, p_sync_metadata jsonb) OWNER TO postgres;

--
-- Name: FUNCTION create_order_atomic(p_restaurant_id uuid, p_items jsonb, p_payment_method text, p_sync_metadata jsonb); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_order_atomic(p_restaurant_id uuid, p_items jsonb, p_payment_method text, p_sync_metadata jsonb) IS 'Official Core RPC: Creates order atomically. Enforces constitutional constraints.';


--
-- Name: create_tables_from_capacity(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_tables_from_capacity(p_restaurant_id uuid, p_capacity integer, p_tables_per_zone integer DEFAULT 5) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_tables_created INTEGER := 0;
  v_table_number INTEGER;
  v_zone_id UUID;
BEGIN
  -- Verificar se já existem mesas
  IF EXISTS (SELECT 1 FROM public.gm_tables WHERE restaurant_id = p_restaurant_id) THEN
    RETURN 0; -- Já existem mesas, não criar
  END IF;

  -- Criar mesas baseado na capacidade (assumindo 4 pessoas por mesa)
  FOR v_table_number IN 1..(p_capacity / 4) LOOP
    INSERT INTO public.gm_tables (restaurant_id, number, status)
    VALUES (p_restaurant_id, v_table_number, 'closed')
    ON CONFLICT (restaurant_id, number) DO NOTHING;
    
    v_tables_created := v_tables_created + 1;
  END LOOP;

  RETURN v_tables_created;
END;
$$;


ALTER FUNCTION public.create_tables_from_capacity(p_restaurant_id uuid, p_capacity integer, p_tables_per_zone integer) OWNER TO postgres;

--
-- Name: FUNCTION create_tables_from_capacity(p_restaurant_id uuid, p_capacity integer, p_tables_per_zone integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_tables_from_capacity(p_restaurant_id uuid, p_capacity integer, p_tables_per_zone integer) IS 'Cria mesas automaticamente baseado na capacidade do restaurante';


--
-- Name: fn_log_payment_attempt(uuid, uuid, uuid, integer, text, text, text, text, text, uuid, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_log_payment_attempt(p_order_id uuid, p_restaurant_id uuid, p_operator_id uuid, p_amount_cents integer, p_method text, p_result text, p_error_code text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text, p_idempotency_key text DEFAULT NULL::text, p_payment_id uuid DEFAULT NULL::uuid, p_duration_ms integer DEFAULT NULL::integer, p_client_info text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.fn_log_payment_attempt(p_order_id uuid, p_restaurant_id uuid, p_operator_id uuid, p_amount_cents integer, p_method text, p_result text, p_error_code text, p_error_message text, p_idempotency_key text, p_payment_id uuid, p_duration_ms integer, p_client_info text) OWNER TO postgres;

--
-- Name: get_operational_metrics(uuid, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_operational_metrics(p_restaurant_id uuid, p_from timestamp with time zone, p_to timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_tenant_id UUID;
    v_orders_created_total INTEGER;
    v_orders_cancelled_total INTEGER;
    v_payments_recorded_total INTEGER;
    v_payments_amount_cents BIGINT;
    v_active_shifts_count INTEGER;
    v_daily_revenue_cents BIGINT;
    v_daily_orders_count INTEGER;
    v_avg_order_value_cents INTEGER;
BEGIN
    SELECT tenant_id INTO v_tenant_id
    FROM public.gm_restaurants
    WHERE id = p_restaurant_id;
    IF v_tenant_id IS NULL THEN
        RETURN jsonb_build_object(
            'schema_version', '1',
            'tenant_id', '',
            'period', jsonb_build_object('start', p_from, 'end', p_to),
            'orders_created_total', 0,
            'orders_cancelled_total', 0,
            'payments_recorded_total', 0,
            'payments_amount_cents', 0,
            'active_shifts_count', 0,
            'export_requested_count', 0,
            'daily_revenue_cents', 0,
            'daily_orders_count', 0,
            'avg_order_value_cents', 0
        );
    END IF;

    SELECT COUNT(*)::INTEGER INTO v_orders_created_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER INTO v_orders_cancelled_total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND status = 'CANCELLED'
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER, COALESCE(SUM(amount_cents), 0)::BIGINT
    INTO v_payments_recorded_total, v_payments_amount_cents
    FROM public.gm_payments
    WHERE restaurant_id = p_restaurant_id
      AND status = 'paid'
      AND created_at >= p_from AND created_at <= p_to;

    SELECT COUNT(*)::INTEGER INTO v_active_shifts_count
    FROM public.gm_cash_registers
    WHERE restaurant_id = p_restaurant_id AND status = 'open';

    SELECT COUNT(*)::INTEGER INTO v_daily_orders_count
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND status = 'CLOSED'
      AND payment_status IN ('PAID', 'PARTIALLY_PAID')
      AND updated_at >= p_from AND updated_at <= p_to;

    v_daily_revenue_cents := COALESCE(v_payments_amount_cents, 0);
    v_avg_order_value_cents := CASE
        WHEN v_daily_orders_count > 0 THEN (v_daily_revenue_cents / v_daily_orders_count)::INTEGER
        ELSE 0
    END;

    RETURN jsonb_build_object(
        'schema_version', '1',
        'tenant_id', v_tenant_id,
        'period', jsonb_build_object('start', p_from, 'end', p_to),
        'orders_created_total', v_orders_created_total,
        'orders_cancelled_total', v_orders_cancelled_total,
        'payments_recorded_total', v_payments_recorded_total,
        'payments_amount_cents', v_payments_amount_cents,
        'active_shifts_count', v_active_shifts_count,
        'export_requested_count', 0,
        'daily_revenue_cents', v_daily_revenue_cents,
        'daily_orders_count', v_daily_orders_count,
        'avg_order_value_cents', v_avg_order_value_cents
    );
END;
$$;


ALTER FUNCTION public.get_operational_metrics(p_restaurant_id uuid, p_from timestamp with time zone, p_to timestamp with time zone) OWNER TO postgres;

--
-- Name: get_payment_health(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_payment_health(p_restaurant_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.get_payment_health(p_restaurant_id uuid) OWNER TO postgres;

--
-- Name: get_shift_history(uuid, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_shift_history(p_restaurant_id uuid, p_from timestamp with time zone, p_to timestamp with time zone) RETURNS TABLE(shift_id uuid, opened_at timestamp with time zone, closed_at timestamp with time zone, total_sales_cents bigint, orders_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        cr.id AS shift_id,
        cr.opened_at AS opened_at,
        cr.closed_at AS closed_at,
        COALESCE(cr.total_sales_cents, 0)::BIGINT AS total_sales_cents,
        (SELECT COUNT(*)::BIGINT
         FROM public.gm_orders o
         WHERE o.cash_register_id = cr.id AND o.status = 'CLOSED') AS orders_count
    FROM public.gm_cash_registers cr
    WHERE cr.restaurant_id = p_restaurant_id
      AND cr.opened_at IS NOT NULL
      AND cr.opened_at <= p_to
      AND (cr.closed_at IS NULL OR cr.closed_at >= p_from)
    ORDER BY cr.opened_at DESC;
END;
$$;


ALTER FUNCTION public.get_shift_history(p_restaurant_id uuid, p_from timestamp with time zone, p_to timestamp with time zone) OWNER TO postgres;

--
-- Name: mark_item_ready(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_item_ready(p_item_id uuid, p_restaurant_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_item_order_id UUID;
    v_all_items_ready BOOLEAN;
    v_updated_order_id UUID;
BEGIN
    UPDATE public.gm_order_items
    SET ready_at = NOW(), updated_at = NOW()
    WHERE id = p_item_id
      AND EXISTS (
          SELECT 1
          FROM public.gm_orders o
          WHERE o.id = gm_order_items.order_id
            AND o.restaurant_id = p_restaurant_id
      )
    RETURNING order_id INTO v_item_order_id;

    IF v_item_order_id IS NULL THEN
        RAISE EXCEPTION 'ITEM_NOT_FOUND: Item não encontrado ou não pertence ao restaurante';
    END IF;

    SELECT COUNT(*) = COUNT(CASE WHEN ready_at IS NOT NULL THEN 1 END)
    INTO v_all_items_ready
    FROM public.gm_order_items
    WHERE order_id = v_item_order_id;

    IF v_all_items_ready THEN
        UPDATE public.gm_orders
        SET status = 'READY',
            ready_at = CASE WHEN ready_at IS NULL THEN NOW() ELSE ready_at END,
            updated_at = NOW()
        WHERE id = v_item_order_id
          AND restaurant_id = p_restaurant_id
        RETURNING id INTO v_updated_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'item_id', p_item_id,
        'order_id', v_item_order_id,
        'all_items_ready', v_all_items_ready,
        'order_status_updated', v_updated_order_id IS NOT NULL
    );
END;
$$;


ALTER FUNCTION public.mark_item_ready(p_item_id uuid, p_restaurant_id uuid) OWNER TO postgres;

--
-- Name: open_cash_register_atomic(uuid, text, text, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.open_cash_register_atomic(p_restaurant_id uuid, p_name text DEFAULT 'Caixa Principal'::text, p_opened_by text DEFAULT NULL::text, p_opening_balance_cents bigint DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.open_cash_register_atomic(p_restaurant_id uuid, p_name text, p_opened_by text, p_opening_balance_cents bigint) OWNER TO postgres;

--
-- Name: process_inventory_deduction(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_inventory_deduction(p_order_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.process_inventory_deduction(p_order_id uuid) OWNER TO postgres;

--
-- Name: process_order_payment(uuid, uuid, uuid, text, integer, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_order_payment(p_order_id uuid, p_restaurant_id uuid, p_cash_register_id uuid, p_method text, p_amount_cents integer, p_operator_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.process_order_payment(p_order_id uuid, p_restaurant_id uuid, p_cash_register_id uuid, p_method text, p_amount_cents integer, p_operator_id uuid, p_idempotency_key text) OWNER TO postgres;

--
-- Name: process_split_payment_atomic(uuid, uuid, uuid, text, integer, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_split_payment_atomic(p_order_id uuid, p_restaurant_id uuid, p_cash_register_id uuid, p_method text, p_amount_cents integer, p_operator_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN public.process_order_payment(
        p_order_id, p_restaurant_id, p_cash_register_id, p_method, p_amount_cents, p_operator_id, p_idempotency_key
    );
END;
$$;


ALTER FUNCTION public.process_split_payment_atomic(p_order_id uuid, p_restaurant_id uuid, p_cash_register_id uuid, p_method text, p_amount_cents integer, p_operator_id uuid, p_idempotency_key text) OWNER TO postgres;

--
-- Name: simulate_order_stock_impact(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.simulate_order_stock_impact(p_restaurant_id uuid, p_items jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH req AS (
    SELECT
      (i->>'product_id')::UUID AS product_id,
      COALESCE((i->>'quantity')::INT, 1) AS qty
    FROM jsonb_array_elements(p_items) i
  ),
  needed AS (
    SELECT
      b.ingredient_id,
      b.station,
      SUM(b.qty_per_unit * r.qty) AS needed_qty
    FROM req r
    JOIN public.gm_product_bom b
      ON b.product_id = r.product_id AND b.restaurant_id = p_restaurant_id
    GROUP BY b.ingredient_id, b.station
  ),
  stock AS (
    SELECT
      sl.ingredient_id,
      SUM(sl.qty) AS available_qty,
      SUM(sl.min_qty) AS min_total
    FROM public.gm_stock_levels sl
    WHERE sl.restaurant_id = p_restaurant_id
    GROUP BY sl.ingredient_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'ingredient_id', n.ingredient_id,
    'needed_qty', n.needed_qty,
    'available_qty', COALESCE(s.available_qty, 0),
    'will_be', COALESCE(s.available_qty, 0) - n.needed_qty,
    'below_min', (COALESCE(s.available_qty, 0) - n.needed_qty) < COALESCE(s.min_total, 0),
    'station', n.station
  ))
  INTO v_result
  FROM needed n
  LEFT JOIN stock s ON s.ingredient_id = n.ingredient_id;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;


ALTER FUNCTION public.simulate_order_stock_impact(p_restaurant_id uuid, p_items jsonb) OWNER TO postgres;

--
-- Name: FUNCTION simulate_order_stock_impact(p_restaurant_id uuid, p_items jsonb); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.simulate_order_stock_impact(p_restaurant_id uuid, p_items jsonb) IS 'Simula o impacto de um pedido no estoque. Requer gm_product_bom e gm_stock_levels.';


--
-- Name: update_order_status(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_order_status(p_order_id uuid, p_restaurant_id uuid, p_new_status text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_updated_id UUID;
BEGIN
    IF p_new_status NOT IN ('OPEN', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Status inválido: %', p_new_status;
    END IF;

    UPDATE public.gm_orders
    SET
        status = p_new_status,
        updated_at = NOW(),
        in_prep_at = CASE WHEN p_new_status = 'IN_PREP' AND in_prep_at IS NULL THEN NOW() ELSE in_prep_at END,
        ready_at = CASE WHEN p_new_status = 'READY' AND ready_at IS NULL THEN NOW() ELSE ready_at END
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_updated_id,
        'new_status', p_new_status
    );
END;
$$;


ALTER FUNCTION public.update_order_status(p_order_id uuid, p_restaurant_id uuid, p_new_status text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: postgres
--

CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


ALTER TABLE _realtime.extensions OWNER TO postgres;

--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: postgres
--

CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE _realtime.schema_migrations OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: postgres
--

CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL
);


ALTER TABLE _realtime.tenants OWNER TO postgres;

--
-- Name: billing_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billing_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    provider text NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    credentials_ref text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT billing_configs_currency_check CHECK ((currency = ANY (ARRAY['EUR'::text, 'USD'::text, 'BRL'::text]))),
    CONSTRAINT billing_configs_provider_check CHECK ((provider = ANY (ARRAY['stripe'::text, 'sumup'::text, 'pix'::text, 'custom'::text])))
);


ALTER TABLE public.billing_configs OWNER TO postgres;

--
-- Name: event_store; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_store (
    sequence_id bigint NOT NULL,
    event_id uuid NOT NULL,
    stream_type text NOT NULL,
    stream_id text NOT NULL,
    stream_version integer NOT NULL,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    idempotency_key text
);


ALTER TABLE public.event_store OWNER TO postgres;

--
-- Name: TABLE event_store; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.event_store IS 'Event Sourcing. Reconciliação e concorrência.';


--
-- Name: event_store_sequence_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_store_sequence_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.event_store_sequence_id_seq OWNER TO postgres;

--
-- Name: event_store_sequence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_store_sequence_id_seq OWNED BY public.event_store.sequence_id;


--
-- Name: gm_cash_registers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_cash_registers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text DEFAULT 'Caixa Principal'::text NOT NULL,
    status text DEFAULT 'closed'::text NOT NULL,
    opened_at timestamp with time zone,
    closed_at timestamp with time zone,
    opened_by text,
    closed_by text,
    opening_balance_cents bigint DEFAULT 0,
    closing_balance_cents bigint,
    total_sales_cents bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gm_cash_registers_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


ALTER TABLE public.gm_cash_registers OWNER TO postgres;

--
-- Name: TABLE gm_cash_registers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_cash_registers IS 'Financial Core: one open cash register per restaurant.';


--
-- Name: gm_equipment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_equipment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    location_id uuid,
    name text NOT NULL,
    kind text NOT NULL,
    capacity_note text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gm_equipment_kind_check CHECK ((kind = ANY (ARRAY['FRIDGE'::text, 'FREEZER'::text, 'OVEN'::text, 'GRILL'::text, 'PLANCHA'::text, 'COFFEE_MACHINE'::text, 'ICE_MACHINE'::text, 'KEG_SYSTEM'::text, 'SHELF'::text, 'OTHER'::text, 'TPV'::text, 'KDS'::text])))
);


ALTER TABLE public.gm_equipment OWNER TO postgres;

--
-- Name: COLUMN gm_equipment.kind; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_equipment.kind IS 'Tipo: equipamento de cozinha ou dispositivo operacional (TPV, KDS).';


--
-- Name: gm_ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_ingredients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    unit text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gm_ingredients_unit_check CHECK ((unit = ANY (ARRAY['g'::text, 'kg'::text, 'ml'::text, 'l'::text, 'unit'::text])))
);


ALTER TABLE public.gm_ingredients OWNER TO postgres;

--
-- Name: TABLE gm_ingredients; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_ingredients IS 'Ingredientes medidos (stock).';


--
-- Name: gm_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    kind text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gm_locations_kind_check CHECK ((kind = ANY (ARRAY['KITCHEN'::text, 'BAR'::text, 'STORAGE'::text, 'SERVICE'::text, 'OTHER'::text])))
);


ALTER TABLE public.gm_locations OWNER TO postgres;

--
-- Name: TABLE gm_locations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_locations IS 'Locais físicos (cozinha, bar, estoque).';


--
-- Name: gm_menu_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_menu_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid,
    name text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gm_menu_categories OWNER TO postgres;

--
-- Name: gm_order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    name_snapshot text NOT NULL,
    price_snapshot integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    subtotal_cents integer NOT NULL,
    modifiers jsonb DEFAULT '[]'::jsonb,
    notes text,
    created_by_user_id uuid,
    created_by_role text,
    device_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    prep_time_seconds integer,
    prep_category text,
    station text,
    ready_at timestamp with time zone,
    CONSTRAINT gm_order_items_station_check CHECK ((station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text]))),
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.gm_order_items OWNER TO postgres;

--
-- Name: TABLE gm_order_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_order_items IS 'Order items snapshot at time of creation. Immutable after creation.';


--
-- Name: COLUMN gm_order_items.created_by_user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_order_items.created_by_user_id IS 'ID do usuário que criou o item (para divisão de conta)';


--
-- Name: COLUMN gm_order_items.created_by_role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_order_items.created_by_role IS 'Role do criador: waiter, manager, owner, QR_MESA, etc.';


--
-- Name: COLUMN gm_order_items.device_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_order_items.device_id IS 'Identificador do dispositivo (opcional, usado para QR Mesa)';


--
-- Name: COLUMN gm_order_items.prep_time_seconds; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_order_items.prep_time_seconds IS 'Snapshot do prep_time_seconds do produto no momento da criação do pedido';


--
-- Name: COLUMN gm_order_items.prep_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_order_items.prep_category IS 'Snapshot do prep_category do produto no momento da criação do pedido';


--
-- Name: COLUMN gm_order_items.station; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_order_items.station IS 'Snapshot do station do produto no momento da criação do pedido';


--
-- Name: COLUMN gm_order_items.ready_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_order_items.ready_at IS 'Timestamp quando o item foi marcado como pronto';


--
-- Name: gm_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    table_id uuid,
    table_number integer,
    status text DEFAULT 'OPEN'::text NOT NULL,
    payment_status text DEFAULT 'PENDING'::text NOT NULL,
    total_cents integer DEFAULT 0,
    subtotal_cents integer DEFAULT 0,
    tax_cents integer DEFAULT 0,
    discount_cents integer DEFAULT 0,
    source text DEFAULT 'tpv'::text,
    operator_id uuid,
    cash_register_id uuid,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    sync_metadata jsonb,
    origin text,
    in_prep_at timestamp with time zone,
    ready_at timestamp with time zone,
    served_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'PARTIALLY_PAID'::text, 'FAILED'::text, 'REFUNDED'::text]))),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'PREPARING'::text, 'IN_PREP'::text, 'READY'::text, 'CLOSED'::text, 'CANCELLED'::text])))
);


ALTER TABLE public.gm_orders OWNER TO postgres;

--
-- Name: TABLE gm_orders; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_orders IS 'Sovereign Ledger: All orders go through this table. Core is authoritative.';


--
-- Name: gm_payment_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_payment_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    order_id uuid,
    operator_id uuid,
    amount_cents integer,
    method text,
    result text NOT NULL,
    error_code text,
    error_message text,
    idempotency_key text,
    payment_id uuid,
    duration_ms integer,
    client_info jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gm_payment_audit_logs OWNER TO postgres;

--
-- Name: gm_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    order_id uuid NOT NULL,
    cash_register_id uuid,
    operator_id uuid,
    amount_cents bigint NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    payment_method text NOT NULL,
    status text DEFAULT 'paid'::text NOT NULL,
    idempotency_key text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gm_payments_status_check CHECK ((status = ANY (ARRAY['paid'::text, 'failed'::text, 'refunded'::text])))
);


ALTER TABLE public.gm_payments OWNER TO postgres;

--
-- Name: TABLE gm_payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_payments IS 'Financial Core: all payments via RPC only.';


--
-- Name: gm_product_bom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_product_bom (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    ingredient_id uuid NOT NULL,
    qty_per_unit numeric NOT NULL,
    station text NOT NULL,
    preferred_location_kind text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT gm_product_bom_station_check CHECK ((station = ANY (ARRAY['KITCHEN'::text, 'BAR'::text])))
);


ALTER TABLE public.gm_product_bom OWNER TO postgres;

--
-- Name: TABLE gm_product_bom; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_product_bom IS 'Bill of Materials: produto -> ingredientes.';


--
-- Name: gm_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid,
    category_id uuid,
    name text NOT NULL,
    description text,
    price_cents integer DEFAULT 0 NOT NULL,
    photo_url text,
    available boolean DEFAULT true,
    track_stock boolean DEFAULT false,
    stock_quantity numeric DEFAULT 0,
    cost_price_cents integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    prep_time_seconds integer DEFAULT 300,
    prep_category text DEFAULT 'main'::text,
    station text DEFAULT 'KITCHEN'::text,
    CONSTRAINT gm_products_prep_category_check CHECK ((prep_category = ANY (ARRAY['drink'::text, 'starter'::text, 'main'::text, 'dessert'::text]))),
    CONSTRAINT gm_products_station_check CHECK ((station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text])))
);


ALTER TABLE public.gm_products OWNER TO postgres;

--
-- Name: COLUMN gm_products.prep_time_seconds; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_products.prep_time_seconds IS 'Tempo esperado de preparo em segundos';


--
-- Name: COLUMN gm_products.prep_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_products.prep_category IS 'Categoria de preparo: drink, starter, main, dessert';


--
-- Name: COLUMN gm_products.station; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_products.station IS 'Estação de preparo: BAR ou KITCHEN';


--
-- Name: gm_restaurant_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_restaurant_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid,
    user_id uuid NOT NULL,
    role text DEFAULT 'staff'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gm_restaurant_members OWNER TO postgres;

--
-- Name: TABLE gm_restaurant_members; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_restaurant_members IS 'Membros do restaurante (people). Bootstrap e runtime.';


--
-- Name: gm_restaurants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_restaurants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name text NOT NULL,
    slug text,
    description text,
    owner_id uuid,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    billing_status text DEFAULT 'trial'::text,
    product_mode text DEFAULT 'demo'::text NOT NULL,
    type text,
    country text,
    timezone text,
    currency text DEFAULT 'BRL'::text,
    locale text DEFAULT 'pt-BR'::text,
    address text,
    city text,
    postal_code text,
    state text,
    capacity integer,
    latitude numeric(10,8),
    longitude numeric(11,8),
    onboarding_completed_at timestamp with time zone,
    CONSTRAINT gm_restaurants_billing_status_check CHECK ((billing_status = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'canceled'::text]))),
    CONSTRAINT gm_restaurants_product_mode_check CHECK ((product_mode = ANY (ARRAY['demo'::text, 'pilot'::text, 'live'::text])))
);


ALTER TABLE public.gm_restaurants OWNER TO postgres;

--
-- Name: COLUMN gm_restaurants.product_mode; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_restaurants.product_mode IS 'Modo de produto: demo, pilot, live.';


--
-- Name: COLUMN gm_restaurants.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_restaurants.type IS 'Tipo de estabelecimento: RESTAURANT, BAR, HOTEL, BEACH_CLUB, CAFE, OTHER';


--
-- Name: COLUMN gm_restaurants.timezone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_restaurants.timezone IS 'Fuso horário (ex: America/Sao_Paulo, Europe/Madrid)';


--
-- Name: COLUMN gm_restaurants.currency; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_restaurants.currency IS 'Moeda (BRL, EUR, USD)';


--
-- Name: COLUMN gm_restaurants.locale; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_restaurants.locale IS 'Idioma (pt-BR, es-ES, en-US)';


--
-- Name: COLUMN gm_restaurants.capacity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_restaurants.capacity IS 'Capacidade total de clientes';


--
-- Name: COLUMN gm_restaurants.onboarding_completed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_restaurants.onboarding_completed_at IS 'Data/hora em que o onboarding foi concluído (ex: primeiro produto criado). Usado pelo FlowGate e billing.';


--
-- Name: gm_stock_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_stock_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    location_id uuid NOT NULL,
    ingredient_id uuid NOT NULL,
    order_id uuid,
    order_item_id uuid,
    action text NOT NULL,
    qty numeric NOT NULL,
    reason text,
    created_by_role text,
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT gm_stock_ledger_action_check CHECK ((action = ANY (ARRAY['IN'::text, 'OUT'::text, 'RESERVE'::text, 'RELEASE'::text, 'CONSUME'::text, 'ADJUST'::text])))
);


ALTER TABLE public.gm_stock_ledger OWNER TO postgres;

--
-- Name: TABLE gm_stock_ledger; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_stock_ledger IS 'Ledger de movimentação de estoque.';


--
-- Name: gm_stock_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_stock_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    location_id uuid NOT NULL,
    ingredient_id uuid NOT NULL,
    qty numeric DEFAULT 0 NOT NULL,
    min_qty numeric DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gm_stock_levels OWNER TO postgres;

--
-- Name: TABLE gm_stock_levels; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_stock_levels IS 'Níveis de estoque por local e ingrediente.';


--
-- Name: gm_tables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid,
    number integer NOT NULL,
    qr_code text,
    status text DEFAULT 'closed'::text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.gm_tables OWNER TO postgres;

--
-- Name: gm_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gm_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    order_id uuid,
    order_item_id uuid,
    task_type text NOT NULL,
    station text,
    priority text DEFAULT 'MEDIA'::text NOT NULL,
    message text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'OPEN'::text NOT NULL,
    assigned_to uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    acknowledged_at timestamp with time zone,
    resolved_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    auto_generated boolean DEFAULT true,
    source_event text,
    CONSTRAINT gm_tasks_priority_check CHECK ((priority = ANY (ARRAY['LOW'::text, 'MEDIA'::text, 'ALTA'::text, 'CRITICA'::text]))),
    CONSTRAINT gm_tasks_station_check CHECK ((station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text, 'SERVICE'::text]))),
    CONSTRAINT gm_tasks_status_check CHECK ((status = ANY (ARRAY['OPEN'::text, 'ACKNOWLEDGED'::text, 'RESOLVED'::text, 'DISMISSED'::text]))),
    CONSTRAINT gm_tasks_task_type_check CHECK ((task_type = ANY (ARRAY['ATRASO_ITEM'::text, 'ACUMULO_BAR'::text, 'ENTREGA_PENDENTE'::text, 'ITEM_CRITICO'::text, 'PEDIDO_ESQUECIDO'::text, 'ESTOQUE_CRITICO'::text, 'RUPTURA_PREVISTA'::text, 'EQUIPAMENTO_CHECK'::text, 'PEDIDO_NOVO'::text, 'MODO_INTERNO'::text])))
);


ALTER TABLE public.gm_tasks OWNER TO postgres;

--
-- Name: TABLE gm_tasks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.gm_tasks IS 'Tarefas automáticas geradas a partir de eventos operacionais';


--
-- Name: COLUMN gm_tasks.task_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.gm_tasks.task_type IS 'Tipo de tarefa: PEDIDO_NOVO, MODO_INTERNO, ATRASO_ITEM, etc';


--
-- Name: installed_modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.installed_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    module_id character varying NOT NULL,
    module_name character varying NOT NULL,
    version character varying DEFAULT '1.0.0'::character varying,
    installed_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status character varying DEFAULT 'active'::character varying,
    config jsonb DEFAULT '{}'::jsonb,
    dependencies text[] DEFAULT ARRAY[]::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT installed_modules_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.installed_modules OWNER TO postgres;

--
-- Name: TABLE installed_modules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.installed_modules IS 'Módulos instalados por restaurante (TPV, KDS, tasks, etc).';


--
-- Name: legal_seals_legal_sequence_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.legal_seals_legal_sequence_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.legal_seals_legal_sequence_id_seq OWNER TO postgres;

--
-- Name: legal_seals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.legal_seals (
    seal_id text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    legal_state text NOT NULL,
    seal_event_id uuid NOT NULL,
    stream_hash text NOT NULL,
    financial_state_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    sealed_at timestamp with time zone DEFAULT now() NOT NULL,
    legal_sequence_id integer DEFAULT nextval('public.legal_seals_legal_sequence_id_seq'::regclass) NOT NULL
);


ALTER TABLE public.legal_seals OWNER TO postgres;

--
-- Name: TABLE legal_seals; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.legal_seals IS 'Legal seals por entidade. CoreTransactionManager.';


--
-- Name: module_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.module_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    module_id character varying NOT NULL,
    role character varying NOT NULL,
    permissions text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.module_permissions OWNER TO postgres;

--
-- Name: restaurant_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    open boolean DEFAULT true NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT restaurant_schedules_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


ALTER TABLE public.restaurant_schedules OWNER TO postgres;

--
-- Name: TABLE restaurant_schedules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.restaurant_schedules IS 'Horários de funcionamento do restaurante por dia da semana';


--
-- Name: COLUMN restaurant_schedules.day_of_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.restaurant_schedules.day_of_week IS '0 = domingo, 1 = segunda, ..., 6 = sábado';


--
-- Name: restaurant_setup_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_setup_status (
    restaurant_id uuid NOT NULL,
    sections jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.restaurant_setup_status OWNER TO postgres;

--
-- Name: TABLE restaurant_setup_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.restaurant_setup_status IS 'Status do onboarding por seção (para rastrear progresso)';


--
-- Name: restaurant_zones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restaurant_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT restaurant_zones_type_check CHECK ((type = ANY (ARRAY['BAR'::text, 'SALON'::text, 'KITCHEN'::text, 'TERRACE'::text, 'OTHER'::text])))
);


ALTER TABLE public.restaurant_zones OWNER TO postgres;

--
-- Name: TABLE restaurant_zones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.restaurant_zones IS 'Zonas operacionais do restaurante (BAR, SALON, KITCHEN, TERRACE)';


--
-- Name: saas_tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saas_tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.saas_tenants OWNER TO postgres;

--
-- Name: event_store sequence_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_store ALTER COLUMN sequence_id SET DEFAULT nextval('public.event_store_sequence_id_seq'::regclass);


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: postgres
--

COPY _realtime.extensions (id, type, settings, tenant_external_id, inserted_at, updated_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: postgres
--

COPY _realtime.schema_migrations (version, inserted_at) FROM stdin;
20210706140551	2026-02-03 13:40:48
20220329161857	2026-02-03 13:40:48
20220410212326	2026-02-03 13:40:48
20220506102948	2026-02-03 13:40:48
20220527210857	2026-02-03 13:40:48
20220815211129	2026-02-03 13:40:48
20220815215024	2026-02-03 13:40:48
20220818141501	2026-02-03 13:40:48
20221018173709	2026-02-03 13:40:48
20221102172703	2026-02-03 13:40:48
20221223010058	2026-02-03 13:40:48
20230110180046	2026-02-03 13:40:48
20230810220907	2026-02-03 13:40:48
20230810220924	2026-02-03 13:40:48
20231024094642	2026-02-03 13:40:48
20240306114423	2026-02-03 13:40:48
20240418082835	2026-02-03 13:40:48
20240625211759	2026-02-03 13:40:48
20240704172020	2026-02-03 13:40:48
20240902173232	2026-02-03 13:40:48
20241106103258	2026-02-03 13:40:48
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: postgres
--

COPY _realtime.tenants (id, name, external_id, jwt_secret, max_concurrent_users, inserted_at, updated_at, max_events_per_second, postgres_cdc_default, max_bytes_per_second, max_channels_per_client, max_joins_per_second, suspend, jwt_jwks, notify_private_alpha, private_only) FROM stdin;
\.


--
-- Data for Name: billing_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billing_configs (id, restaurant_id, provider, currency, enabled, credentials_ref, updated_at) FROM stdin;
\.


--
-- Data for Name: event_store; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.event_store (sequence_id, event_id, stream_type, stream_id, stream_version, event_type, payload, meta, created_at, idempotency_key) FROM stdin;
\.


--
-- Data for Name: gm_cash_registers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_cash_registers (id, restaurant_id, name, status, opened_at, closed_at, opened_by, closed_by, opening_balance_cents, closing_balance_cents, total_sales_cents, created_at, updated_at) FROM stdin;
7111c3d1-8eeb-4d89-8a58-50a2890b10b7	00000000-0000-0000-0000-000000000100	Caixa Principal	open	2026-02-03 13:40:42.534656+00	\N	seed-enterprise	\N	0	\N	470200	2026-02-03 13:40:42.534656+00	2026-02-03 15:57:29.275466+00
9e3d3e07-f8b7-422a-9d44-0484861c2e7e	9ad697ab-183d-4ecf-813a-01e122bf1adc	Caixa Principal	open	2026-02-03 20:41:01.83665+00	\N	tpv-minimal	\N	0	\N	200	2026-02-03 20:41:01.83665+00	2026-02-03 20:41:07.676385+00
\.


--
-- Data for Name: gm_equipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_equipment (id, restaurant_id, location_id, name, kind, capacity_note, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: gm_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_ingredients (id, restaurant_id, name, unit, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: gm_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_locations (id, restaurant_id, name, kind, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: gm_menu_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_menu_categories (id, restaurant_id, name, sort_order, created_at) FROM stdin;
6d13d1c5-4add-43d5-b573-9bccb82d4503	00000000-0000-0000-0000-000000000100	Entradas	1	2026-02-03 13:40:42.373754+00
1675b27d-b1f7-4e82-b2ef-04c69700d863	00000000-0000-0000-0000-000000000100	Pratos Principais	2	2026-02-03 13:40:42.373754+00
7ef2d144-8a87-4724-81fc-9367dc897b41	00000000-0000-0000-0000-000000000100	Bebidas	3	2026-02-03 13:40:42.373754+00
99cb6f6d-2be5-4f95-ad01-0a439f7cd732	00000000-0000-0000-0000-000000000100	Sobremesas	4	2026-02-03 13:40:42.373754+00
\.


--
-- Data for Name: gm_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_order_items (id, order_id, product_id, name_snapshot, price_snapshot, quantity, subtotal_cents, modifiers, notes, created_by_user_id, created_by_role, device_id, created_at, updated_at, prep_time_seconds, prep_category, station, ready_at) FROM stdin;
4e5dad87-2f7c-4440-a73c-af587320cbf2	43988f53-16d7-4e1c-8cfc-8ea7e69d8052	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	1	1200	[]	\N	\N	\N	\N	2026-02-03 14:43:13.292668+00	2026-02-03 14:43:13.292668+00	720	main	KITCHEN	\N
72252ac9-d339-42dd-a18b-f96aece970e1	43988f53-16d7-4e1c-8cfc-8ea7e69d8052	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 14:43:13.292668+00	2026-02-03 14:43:13.292668+00	120	drink	BAR	\N
89470a4d-1af6-4d88-91db-c2bafde083fc	2a57620c-38bb-4e6d-b5be-fe452dc40d08	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 15:57:29.250804+00	2026-02-03 15:57:29.250804+00	120	drink	BAR	\N
cfc369e8-9020-498c-9ff9-e6a4acc67939	3f020ad3-4788-4a42-bd96-8775a63da80c	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	1	800	[]	\N	\N	\N	\N	2026-02-03 19:14:36.032061+00	2026-02-03 19:14:36.032061+00	720	main	KITCHEN	\N
cc6f3bb6-e993-4059-9858-d335e2859c10	3f020ad3-4788-4a42-bd96-8775a63da80c	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	1	850	[]	\N	\N	\N	\N	2026-02-03 19:14:36.032061+00	2026-02-03 19:14:36.032061+00	720	main	KITCHEN	\N
39dcde35-af62-4019-a4bb-f594ad5f51ea	9bc7b283-75d4-4111-8b7a-1e5fe893f5cf	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:14:36.56459+00	2026-02-03 19:14:36.56459+00	120	drink	BAR	\N
6d6c4e70-b8ad-43ba-8e98-39c94a104838	9bc7b283-75d4-4111-8b7a-1e5fe893f5cf	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	3	1050	[]	\N	\N	\N	\N	2026-02-03 19:14:36.56459+00	2026-02-03 19:14:36.56459+00	720	main	KITCHEN	\N
0f015d46-02e9-4096-9bba-b958b8d7f7c7	9bc7b283-75d4-4111-8b7a-1e5fe893f5cf	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	1	1800	[]	\N	\N	\N	\N	2026-02-03 19:14:36.56459+00	2026-02-03 19:14:36.56459+00	720	main	KITCHEN	\N
37a6b580-5c96-473a-826a-03ed240f366d	d062820f-3fca-4fdc-af17-a931dd5ec2cd	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	1	1600	[]	\N	\N	\N	\N	2026-02-03 19:14:37.07847+00	2026-02-03 19:14:37.07847+00	720	main	KITCHEN	\N
4a73bde0-47f2-43fd-8359-c984cfaad9ea	f31ea4dc-8359-4ba5-bd10-65d67c6da781	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:14:37.588784+00	2026-02-03 19:14:37.588784+00	120	drink	BAR	\N
b324e192-467f-4a58-9fb1-424db37ef79b	f31ea4dc-8359-4ba5-bd10-65d67c6da781	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	2	3200	[]	\N	\N	\N	\N	2026-02-03 19:14:37.588784+00	2026-02-03 19:14:37.588784+00	720	main	KITCHEN	\N
6b8c378c-c58e-4d34-af1e-850bab4fb245	f31ea4dc-8359-4ba5-bd10-65d67c6da781	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	3	600	[]	\N	\N	\N	\N	2026-02-03 19:14:37.588784+00	2026-02-03 19:14:37.588784+00	720	main	KITCHEN	\N
73c1fb1d-1557-4fc9-9e6a-550f58e39629	270afa45-b207-47fe-8821-c83023bc7b5b	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	2	3600	[]	\N	\N	\N	\N	2026-02-03 19:14:38.095813+00	2026-02-03 19:14:38.095813+00	720	main	KITCHEN	\N
25c686df-28a1-4323-9f1e-53377333c549	270afa45-b207-47fe-8821-c83023bc7b5b	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	3	1050	[]	\N	\N	\N	\N	2026-02-03 19:14:38.095813+00	2026-02-03 19:14:38.095813+00	720	main	KITCHEN	\N
170a8174-1dfa-4d83-98db-d880a910dd30	270afa45-b207-47fe-8821-c83023bc7b5b	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	2	400	[]	\N	\N	\N	\N	2026-02-03 19:14:38.095813+00	2026-02-03 19:14:38.095813+00	720	main	KITCHEN	\N
43ef2e77-9f98-446e-9d20-4cdc9b3bdd5a	f08b7f49-0fb3-4392-8fc2-02ac42973010	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	3	2400	[]	\N	\N	\N	\N	2026-02-03 19:14:46.249393+00	2026-02-03 19:14:46.249393+00	720	main	KITCHEN	\N
74cfd886-f8a1-405a-bd08-da1775a77ab1	65a0b643-3c24-4865-9e20-63d0dbeff3ad	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	3	2550	[]	\N	\N	\N	\N	2026-02-03 19:14:46.759892+00	2026-02-03 19:14:46.759892+00	720	main	KITCHEN	\N
c68d68ea-9389-46cf-a040-e75bc5e94db5	65a0b643-3c24-4865-9e20-63d0dbeff3ad	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:14:46.759892+00	2026-02-03 19:14:46.759892+00	720	main	KITCHEN	\N
b3bdd673-903c-4a35-851b-a7cde1c79c4b	65a0b643-3c24-4865-9e20-63d0dbeff3ad	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	2	1600	[]	\N	\N	\N	\N	2026-02-03 19:14:46.759892+00	2026-02-03 19:14:46.759892+00	720	main	KITCHEN	\N
30973f2d-4718-44a2-9257-2bb4d729c52f	4066df79-ebff-4785-a3fb-0644f82cb6d2	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	1	350	[]	\N	\N	\N	\N	2026-02-03 19:14:47.264837+00	2026-02-03 19:14:47.264837+00	720	main	KITCHEN	\N
1b4183fe-98ee-48f9-a365-63ac6df9539d	4066df79-ebff-4785-a3fb-0644f82cb6d2	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	2	1600	[]	\N	\N	\N	\N	2026-02-03 19:14:47.264837+00	2026-02-03 19:14:47.264837+00	720	main	KITCHEN	\N
dd1de3e7-3a53-4675-8b4a-167b89a23099	4066df79-ebff-4785-a3fb-0644f82cb6d2	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	3	5400	[]	\N	\N	\N	\N	2026-02-03 19:14:47.264837+00	2026-02-03 19:14:47.264837+00	720	main	KITCHEN	\N
8d297c54-a9d8-4f69-9752-94a7f4d17395	151989f6-502a-431d-bd67-b8fd2734768a	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	2	3200	[]	\N	\N	\N	\N	2026-02-03 19:14:47.76979+00	2026-02-03 19:14:47.76979+00	720	main	KITCHEN	\N
220a7b71-4dea-45c0-a504-e1f31f43eea4	151989f6-502a-431d-bd67-b8fd2734768a	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:14:47.76979+00	2026-02-03 19:14:47.76979+00	120	drink	BAR	\N
e736a8ba-236b-426c-94bf-f4798ae00d67	8cd0a812-8e6d-4ba9-bad7-bb4573c21529	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	1	1800	[]	\N	\N	\N	\N	2026-02-03 19:14:48.278379+00	2026-02-03 19:14:48.278379+00	720	main	KITCHEN	\N
7206ee3c-ade1-431e-a42f-934b83ae6715	8cd0a812-8e6d-4ba9-bad7-bb4573c21529	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	2	400	[]	\N	\N	\N	\N	2026-02-03 19:14:48.278379+00	2026-02-03 19:14:48.278379+00	720	main	KITCHEN	\N
a6072dc4-aa17-49d2-b62a-d9d997c9f9f5	e3d2b116-f55b-4418-a4b2-8265625de912	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	3	1050	[]	\N	\N	\N	\N	2026-02-03 19:14:48.783224+00	2026-02-03 19:14:48.783224+00	720	main	KITCHEN	\N
435ca6ce-9c3c-4d3a-8c4b-fa24ddf34271	23dfd8f5-95c7-4b0e-b6bc-44df1de94472	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	2	3600	[]	\N	\N	\N	\N	2026-02-03 19:14:49.288716+00	2026-02-03 19:14:49.288716+00	720	main	KITCHEN	\N
48336c76-1620-4bbc-b813-3bd873d17f9e	23dfd8f5-95c7-4b0e-b6bc-44df1de94472	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	1	1600	[]	\N	\N	\N	\N	2026-02-03 19:14:49.288716+00	2026-02-03 19:14:49.288716+00	720	main	KITCHEN	\N
3031c002-dfdf-4cd8-a9f5-9cab08b1abe1	23dfd8f5-95c7-4b0e-b6bc-44df1de94472	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:14:49.288716+00	2026-02-03 19:14:49.288716+00	720	main	KITCHEN	\N
e396bbf7-45c8-439a-873a-8e1b04b79d40	13188c5b-3668-4dc6-979b-dc8aa7042e7a	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	1	850	[]	\N	\N	\N	\N	2026-02-03 19:14:49.797138+00	2026-02-03 19:14:49.797138+00	720	main	KITCHEN	\N
eea2c75d-e6ee-4935-ac45-9a6537885a21	13188c5b-3668-4dc6-979b-dc8aa7042e7a	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:14:49.797138+00	2026-02-03 19:14:49.797138+00	720	main	KITCHEN	\N
810eff27-ec83-4d79-aa68-fe1cc901de01	0d4fe61c-45ac-4d32-a949-73d8f92f5d47	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	1	850	[]	\N	\N	\N	\N	2026-02-03 19:14:50.326529+00	2026-02-03 19:14:50.326529+00	720	main	KITCHEN	\N
49b09948-45fd-4924-8106-3d51403879b1	0d4fe61c-45ac-4d32-a949-73d8f92f5d47	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:14:50.326529+00	2026-02-03 19:14:50.326529+00	720	main	KITCHEN	\N
23e33490-3423-47da-a807-dd40e009d119	0d4fe61c-45ac-4d32-a949-73d8f92f5d47	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	2	3600	[]	\N	\N	\N	\N	2026-02-03 19:14:50.326529+00	2026-02-03 19:14:50.326529+00	720	main	KITCHEN	\N
71648ed0-587f-4656-ba76-8824633c215c	4635ab66-2c92-47eb-8e33-470ec7225a60	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	2	3600	[]	\N	\N	\N	\N	2026-02-03 19:14:50.877843+00	2026-02-03 19:14:50.877843+00	720	main	KITCHEN	\N
484446ce-a88b-4ce1-ac32-407d3b37999a	4635ab66-2c92-47eb-8e33-470ec7225a60	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	2	1700	[]	\N	\N	\N	\N	2026-02-03 19:14:50.877843+00	2026-02-03 19:14:50.877843+00	720	main	KITCHEN	\N
0fe09669-e86d-4bba-ae31-9d85397a9975	4635ab66-2c92-47eb-8e33-470ec7225a60	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	2	469000	[]	\N	\N	\N	\N	2026-02-03 19:14:50.877843+00	2026-02-03 19:14:50.877843+00	120	drink	BAR	\N
a3dc20b9-3ffb-40e6-92c6-8bc42408d4fc	13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	3	2550	[]	\N	\N	\N	\N	2026-02-03 19:14:51.39475+00	2026-02-03 19:14:51.39475+00	720	main	KITCHEN	\N
b1eb4d71-2b15-4916-bfc2-2b31d668934b	13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	2	1600	[]	\N	\N	\N	\N	2026-02-03 19:14:51.39475+00	2026-02-03 19:14:51.39475+00	720	main	KITCHEN	\N
32335f87-c1f5-4dde-b92e-90ee7b30bbd2	13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	1	1200	[]	\N	\N	\N	\N	2026-02-03 19:14:51.39475+00	2026-02-03 19:14:51.39475+00	720	main	KITCHEN	\N
0cd872b5-5a57-4e1c-b1da-a590d57d3495	b32c8d1f-89a2-484f-ba30-ec54cd99793d	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:14:51.906494+00	2026-02-03 19:14:51.906494+00	120	drink	BAR	\N
8e408ff7-84f4-4052-a875-d7329e25c7b2	b32c8d1f-89a2-484f-ba30-ec54cd99793d	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	2	700	[]	\N	\N	\N	\N	2026-02-03 19:14:51.906494+00	2026-02-03 19:14:51.906494+00	720	main	KITCHEN	\N
eecfc437-8216-4dfb-bd5a-8b4306d1337f	b32c8d1f-89a2-484f-ba30-ec54cd99793d	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	1	850	[]	\N	\N	\N	\N	2026-02-03 19:14:51.906494+00	2026-02-03 19:14:51.906494+00	720	main	KITCHEN	\N
0cc9e37c-edf8-4ccd-a83a-4509f1787963	569fa7b0-a4c3-4aa8-9801-57709381d63c	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	1	200	[]	\N	\N	\N	\N	2026-02-03 19:14:52.415808+00	2026-02-03 19:14:52.415808+00	720	main	KITCHEN	\N
9cfcac54-a1a2-4219-ab1a-a18878ccc4f2	00fc8099-517c-4cfc-b163-08fddfe5f331	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	3	4800	[]	\N	\N	\N	\N	2026-02-03 19:14:52.923603+00	2026-02-03 19:14:52.923603+00	720	main	KITCHEN	\N
2ae5bfa9-2b88-4237-ba06-ddaa9a822ee7	00fc8099-517c-4cfc-b163-08fddfe5f331	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	3	5400	[]	\N	\N	\N	\N	2026-02-03 19:14:52.923603+00	2026-02-03 19:14:52.923603+00	720	main	KITCHEN	\N
184a1cca-8fd0-4771-ac22-5b0b96532464	6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	2	400	[]	\N	\N	\N	\N	2026-02-03 19:14:53.431146+00	2026-02-03 19:14:53.431146+00	720	main	KITCHEN	\N
2364b7b2-67a5-4bba-93a8-de851aa13f00	6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	1	800	[]	\N	\N	\N	\N	2026-02-03 19:14:53.431146+00	2026-02-03 19:14:53.431146+00	720	main	KITCHEN	\N
81b8afab-6d81-4560-bdf4-c5536e6173f6	6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	3	2550	[]	\N	\N	\N	\N	2026-02-03 19:14:53.431146+00	2026-02-03 19:14:53.431146+00	720	main	KITCHEN	\N
d0481245-4f54-481d-a0b4-4737a0c58735	1042f581-118c-4ab8-b6a8-f05f957190f2	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:14:53.938467+00	2026-02-03 19:14:53.938467+00	120	drink	BAR	\N
8d66db9a-393f-4dbc-8120-77b36b06675d	1042f581-118c-4ab8-b6a8-f05f957190f2	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	1	200	[]	\N	\N	\N	\N	2026-02-03 19:14:53.938467+00	2026-02-03 19:14:53.938467+00	720	main	KITCHEN	\N
e220b27e-9781-4992-ba9a-9550108f3f43	1042f581-118c-4ab8-b6a8-f05f957190f2	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	1	1800	[]	\N	\N	\N	\N	2026-02-03 19:14:53.938467+00	2026-02-03 19:14:53.938467+00	720	main	KITCHEN	\N
baceaadd-4bd4-4bdf-8672-342072943628	f296c614-a56d-4a10-aa32-2a6e9e617473	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	2	700	[]	\N	\N	\N	\N	2026-02-03 19:14:54.454084+00	2026-02-03 19:14:54.454084+00	720	main	KITCHEN	\N
618ac8c9-e679-4cdb-b604-28acb05b5e4c	f296c614-a56d-4a10-aa32-2a6e9e617473	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:14:54.454084+00	2026-02-03 19:14:54.454084+00	720	main	KITCHEN	\N
e969a6da-2e20-478a-a602-e5fe71021d70	f027bf45-1aa5-4742-b3c3-0b7fe79d4736	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	3	4800	[]	\N	\N	\N	\N	2026-02-03 19:14:55.047932+00	2026-02-03 19:14:55.047932+00	720	main	KITCHEN	\N
2a91d8b9-eda0-4946-9b7d-2bd5afefcedd	88b59fa5-4683-474f-8ff9-9c4e25232f4f	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	3	703500	[]	\N	\N	\N	\N	2026-02-03 19:14:55.553891+00	2026-02-03 19:14:55.553891+00	120	drink	BAR	\N
4b0168be-b925-45e7-b7b3-5050634b2c14	88b59fa5-4683-474f-8ff9-9c4e25232f4f	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	1	850	[]	\N	\N	\N	\N	2026-02-03 19:14:55.553891+00	2026-02-03 19:14:55.553891+00	720	main	KITCHEN	\N
28a2643a-3b21-4df7-b627-e51aa7282154	c5210f26-04a4-42fe-8574-64699496fbee	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	2	469000	[]	\N	\N	\N	\N	2026-02-03 19:14:56.062729+00	2026-02-03 19:14:56.062729+00	120	drink	BAR	\N
438b4cd7-9ae2-4e16-b7cc-f2bf2998a4cf	c5210f26-04a4-42fe-8574-64699496fbee	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	2	1700	[]	\N	\N	\N	\N	2026-02-03 19:14:56.062729+00	2026-02-03 19:14:56.062729+00	720	main	KITCHEN	\N
fba5051d-925d-49ca-9d2d-51ddfd6faea8	2a442be9-44b2-4826-a2c1-bd4f0821e082	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	1	350	[]	\N	\N	\N	\N	2026-02-03 19:15:46.403118+00	2026-02-03 19:15:46.403118+00	720	main	KITCHEN	\N
066da256-ff9a-42e5-b9f9-72b353e13042	018ec00c-e457-4cf3-8602-d56bbe54b8b0	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	3	1050	[]	\N	\N	\N	\N	2026-02-03 19:15:46.919743+00	2026-02-03 19:15:46.919743+00	720	main	KITCHEN	\N
c0fc5568-69f1-41c4-9718-b4dcf1adbff7	018ec00c-e457-4cf3-8602-d56bbe54b8b0	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	3	2400	[]	\N	\N	\N	\N	2026-02-03 19:15:46.919743+00	2026-02-03 19:15:46.919743+00	720	main	KITCHEN	\N
8f4f6d5e-51f1-457c-bd68-b30e2ea480f5	58f4b1cf-9671-40b4-b556-6fc7bf91f180	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:15:47.426731+00	2026-02-03 19:15:47.426731+00	720	main	KITCHEN	\N
4a764a8c-378f-4dc9-a84d-ad27c48e7383	ca898357-8bfd-43ae-9f73-480060d173cb	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:15:47.936318+00	2026-02-03 19:15:47.936318+00	720	main	KITCHEN	\N
8e694dad-d7f9-4517-9efb-14336e9e6178	ca898357-8bfd-43ae-9f73-480060d173cb	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	3	2550	[]	\N	\N	\N	\N	2026-02-03 19:15:47.936318+00	2026-02-03 19:15:47.936318+00	720	main	KITCHEN	\N
6d58cdba-2958-402e-a925-a194be7e490e	ca898357-8bfd-43ae-9f73-480060d173cb	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	2	400	[]	\N	\N	\N	\N	2026-02-03 19:15:47.936318+00	2026-02-03 19:15:47.936318+00	720	main	KITCHEN	\N
5d4ba4d8-e805-4d9c-8929-d3491210c52f	b23e7dd8-9fa7-4181-b872-f65835d0ab70	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	1	1800	[]	\N	\N	\N	\N	2026-02-03 19:15:48.442625+00	2026-02-03 19:15:48.442625+00	720	main	KITCHEN	\N
a1ed4705-065d-49c2-ae6f-52b723ddfca7	9ca93181-edee-422a-bbbf-6e86f18237f7	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:15:53.893848+00	2026-02-03 19:15:53.893848+00	720	main	KITCHEN	\N
80fc3271-90ab-4f54-b00d-543daf470590	5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	3	600	[]	\N	\N	\N	\N	2026-02-03 19:15:54.399825+00	2026-02-03 19:15:54.399825+00	720	main	KITCHEN	\N
13d037a3-3cf0-4f57-b20a-67edf6b5dcbf	5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	2	469000	[]	\N	\N	\N	\N	2026-02-03 19:15:54.399825+00	2026-02-03 19:15:54.399825+00	120	drink	BAR	\N
3abac825-5458-481c-b549-6732b7b73fba	036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	2	400	[]	\N	\N	\N	\N	2026-02-03 19:15:54.961998+00	2026-02-03 19:15:54.961998+00	720	main	KITCHEN	\N
e19c1f56-6da4-4e68-9ecc-b9d423e79adc	036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	3	4800	[]	\N	\N	\N	\N	2026-02-03 19:15:54.961998+00	2026-02-03 19:15:54.961998+00	720	main	KITCHEN	\N
18a1005a-31f2-43ab-8879-3394226ffbe0	036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	3	1050	[]	\N	\N	\N	\N	2026-02-03 19:15:54.961998+00	2026-02-03 19:15:54.961998+00	720	main	KITCHEN	\N
48b9b075-406a-48b3-93ba-f1f53a64209a	01a4f9be-ca7c-424b-88cc-33d8ff533cd0	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	3	2550	[]	\N	\N	\N	\N	2026-02-03 19:15:55.513985+00	2026-02-03 19:15:55.513985+00	720	main	KITCHEN	\N
7f805385-bb7c-4f3e-8bb3-f7fa36d13e98	01a4f9be-ca7c-424b-88cc-33d8ff533cd0	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	2	3200	[]	\N	\N	\N	\N	2026-02-03 19:15:55.513985+00	2026-02-03 19:15:55.513985+00	720	main	KITCHEN	\N
09fa414c-4ade-447e-b6c1-98ba0cfcdaec	01a4f9be-ca7c-424b-88cc-33d8ff533cd0	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	2	469000	[]	\N	\N	\N	\N	2026-02-03 19:15:55.513985+00	2026-02-03 19:15:55.513985+00	120	drink	BAR	\N
44e7c045-11a8-4a84-8c72-73cedfd01511	9eeed760-ac93-4c8a-b3db-50d45abb074e	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	3	2550	[]	\N	\N	\N	\N	2026-02-03 19:15:56.021459+00	2026-02-03 19:15:56.021459+00	720	main	KITCHEN	\N
99d64c16-1f8b-42d7-98b2-4447c98dce9b	9eeed760-ac93-4c8a-b3db-50d45abb074e	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	1	1200	[]	\N	\N	\N	\N	2026-02-03 19:15:56.021459+00	2026-02-03 19:15:56.021459+00	720	main	KITCHEN	\N
908050b8-7615-4bf5-906b-6d63b3a47c85	9eeed760-ac93-4c8a-b3db-50d45abb074e	4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	Refrigerante	350	2	700	[]	\N	\N	\N	\N	2026-02-03 19:15:56.021459+00	2026-02-03 19:15:56.021459+00	720	main	KITCHEN	\N
5fdfb136-39d5-4ec4-bc78-e8c013e79bee	70aa63a8-5c9c-4a61-9f8c-9fd79d75347f	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	3	703500	[]	\N	\N	\N	\N	2026-02-03 19:15:56.532705+00	2026-02-03 19:15:56.532705+00	120	drink	BAR	\N
7ceec451-c782-4ce7-a239-95beb6e63145	70aa63a8-5c9c-4a61-9f8c-9fd79d75347f	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	3	5400	[]	\N	\N	\N	\N	2026-02-03 19:15:56.532705+00	2026-02-03 19:15:56.532705+00	720	main	KITCHEN	\N
ad2e466f-2df9-4a90-8573-9a5acb691cd6	dd3c7ce4-a9fb-4728-ae65-df74d2df34c2	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	1	850	[]	\N	\N	\N	\N	2026-02-03 19:15:57.038727+00	2026-02-03 19:15:57.038727+00	720	main	KITCHEN	\N
eb4ab6ec-794e-4352-8f2f-249d17c0c713	dd3c7ce4-a9fb-4728-ae65-df74d2df34c2	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	3	3600	[]	\N	\N	\N	\N	2026-02-03 19:15:57.038727+00	2026-02-03 19:15:57.038727+00	720	main	KITCHEN	\N
c191ad3f-cdab-4260-b33d-3c532d59505c	ca7c99c8-0a65-4bd8-8344-02226a47b91b	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	2	3600	[]	\N	\N	\N	\N	2026-02-03 19:15:57.542142+00	2026-02-03 19:15:57.542142+00	720	main	KITCHEN	\N
f02e88ff-345e-4893-b724-ef32f0be63c0	ca7c99c8-0a65-4bd8-8344-02226a47b91b	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	1	1600	[]	\N	\N	\N	\N	2026-02-03 19:15:57.542142+00	2026-02-03 19:15:57.542142+00	720	main	KITCHEN	\N
26e74510-29c8-4a90-9bc2-d4909855d373	75611800-2bd7-4867-98ae-416a07f9fdde	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	2	469000	[]	\N	\N	\N	\N	2026-02-03 19:15:58.048362+00	2026-02-03 19:15:58.048362+00	120	drink	BAR	\N
0bb1e4b4-03af-48c4-8753-a7fba3a45c2d	9c797e88-0203-440f-897f-ab33766ed066	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	2	2400	[]	\N	\N	\N	\N	2026-02-03 19:15:58.555956+00	2026-02-03 19:15:58.555956+00	720	main	KITCHEN	\N
318d39ba-81b8-4a63-a54b-019b3c16fe31	9c797e88-0203-440f-897f-ab33766ed066	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	3	2400	[]	\N	\N	\N	\N	2026-02-03 19:15:58.555956+00	2026-02-03 19:15:58.555956+00	720	main	KITCHEN	\N
c75a7ebc-6222-4231-ab7d-6c0af8f16001	b80b6115-d79f-45b6-b0cb-6449ac2e1c09	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	3	4800	[]	\N	\N	\N	\N	2026-02-03 19:15:59.063934+00	2026-02-03 19:15:59.063934+00	720	main	KITCHEN	\N
e71779c6-0dc3-4be0-886b-1961bb19cf2f	b80b6115-d79f-45b6-b0cb-6449ac2e1c09	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	1	200	[]	\N	\N	\N	\N	2026-02-03 19:15:59.063934+00	2026-02-03 19:15:59.063934+00	720	main	KITCHEN	\N
ae0341b1-94c0-4998-9ea0-3747c93a7cae	b80b6115-d79f-45b6-b0cb-6449ac2e1c09	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	3	2550	[]	\N	\N	\N	\N	2026-02-03 19:15:59.063934+00	2026-02-03 19:15:59.063934+00	720	main	KITCHEN	\N
d8c07a76-11e3-48b8-823e-584e0dbdc8a4	1e65ee70-5742-4892-a95e-4651f16e0728	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	1	200	[]	\N	\N	\N	\N	2026-02-03 19:15:59.571119+00	2026-02-03 19:15:59.571119+00	720	main	KITCHEN	\N
aa4a7c4c-2c88-441f-a2f4-1a5c5953060c	1e65ee70-5742-4892-a95e-4651f16e0728	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	1	1200	[]	\N	\N	\N	\N	2026-02-03 19:15:59.571119+00	2026-02-03 19:15:59.571119+00	720	main	KITCHEN	\N
9b4fd11e-0027-41d0-8cb6-c2d672792f74	1e65ee70-5742-4892-a95e-4651f16e0728	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:15:59.571119+00	2026-02-03 19:15:59.571119+00	120	drink	BAR	\N
e2ea1c48-0c3c-42cc-ae60-756f3b7397cd	fdaeffe0-f7b3-44e6-ab80-ef713e6177ef	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	2	1700	[]	\N	\N	\N	\N	2026-02-03 19:16:00.075217+00	2026-02-03 19:16:00.075217+00	720	main	KITCHEN	\N
cf416462-f224-4061-b45e-b386257cd47d	fdaeffe0-f7b3-44e6-ab80-ef713e6177ef	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	3	2400	[]	\N	\N	\N	\N	2026-02-03 19:16:00.075217+00	2026-02-03 19:16:00.075217+00	720	main	KITCHEN	\N
429340d5-4ba6-4cb7-9bf7-7ce327cb835c	e6d22d9a-bd0b-4454-82f0-055f05f05f32	5c5afa57-a46a-4adc-8416-e79f7334dffb	Hambúrguer Artesanal	1800	2	3600	[]	\N	\N	\N	\N	2026-02-03 19:16:00.582774+00	2026-02-03 19:16:00.582774+00	720	main	KITCHEN	\N
417f7a98-8c85-455f-8270-94ec7353a235	e6d22d9a-bd0b-4454-82f0-055f05f05f32	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	2	400	[]	\N	\N	\N	\N	2026-02-03 19:16:00.582774+00	2026-02-03 19:16:00.582774+00	720	main	KITCHEN	\N
3ad01e83-d34e-4135-afee-656ddea4fb8e	4016659b-a087-4dce-b842-1295979a9f23	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	3	2550	[]	\N	\N	\N	\N	2026-02-03 19:16:01.091128+00	2026-02-03 19:16:01.091128+00	720	main	KITCHEN	\N
2a73c875-b389-4e87-ba1f-6f593665f666	4016659b-a087-4dce-b842-1295979a9f23	8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	Tiramisú	800	3	2400	[]	\N	\N	\N	\N	2026-02-03 19:16:01.091128+00	2026-02-03 19:16:01.091128+00	720	main	KITCHEN	\N
7591c63c-b7fa-42ec-8c78-907366e86f7e	a0f1c9a6-1480-4188-ac93-684b5b76947a	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	1	850	[]	\N	\N	\N	\N	2026-02-03 19:16:01.595717+00	2026-02-03 19:16:01.595717+00	720	main	KITCHEN	\N
56ddb409-db69-417a-a43f-ec4231d6d142	a0f1c9a6-1480-4188-ac93-684b5b76947a	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:16:01.595717+00	2026-02-03 19:16:01.595717+00	120	drink	BAR	\N
a63aa8be-9454-4ea1-af54-0f9e988cd0ca	b377aed4-5f74-41ae-acf0-9b56b1b8df4b	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:16:02.100347+00	2026-02-03 19:16:02.100347+00	120	drink	BAR	\N
4048eef8-a0df-40f3-9e14-c403f00b8e9d	b635bff8-f0f2-45d1-9246-73252030731d	0cf55b09-24fc-4088-83b4-89d362957941	test12345	234500	1	234500	[]	\N	\N	\N	\N	2026-02-03 19:16:02.60731+00	2026-02-03 19:16:02.60731+00	120	drink	BAR	\N
a8c1e4c3-ef2d-4944-a2b4-e09edc73e63e	b635bff8-f0f2-45d1-9246-73252030731d	f3750df5-172b-4968-a212-4c2c490a5699	Água	200	2	400	[]	\N	\N	\N	\N	2026-02-03 19:16:02.60731+00	2026-02-03 19:16:02.60731+00	720	main	KITCHEN	\N
405e7521-b670-4cf0-a7f5-3b1747df1957	c4cb723d-d736-4e1f-b131-cb0ccbe9190f	7507f03b-9074-4557-8438-1646d57e8fcc	Pizza Margherita	1600	1	1600	[]	\N	\N	\N	\N	2026-02-03 19:16:03.113319+00	2026-02-03 19:16:03.113319+00	720	main	KITCHEN	\N
78c33849-aab5-4c80-903b-2a679919b4cf	bfacabab-54cb-46b8-95ae-59d6103b9906	1aa73167-6e9a-4ee0-b947-39f3ac48524c	Nachos	1200	3	3600	[]	\N	\N	\N	\N	2026-02-03 19:16:03.618035+00	2026-02-03 19:16:03.618035+00	720	main	KITCHEN	\N
819b71ee-9d1d-4f98-b8e3-fc9fba973e8a	c5e821ac-1b7f-4684-bba2-3ca788ff4a00	ca627025-5703-4fe6-afde-c4ac4144c0c6	Bruschetta	850	1	850	[]	\N	\N	\N	\N	2026-02-03 19:20:10.985768+00	2026-02-03 19:20:10.985768+00	720	main	KITCHEN	\N
f1d7d680-20b5-4bff-9e6f-c3f71305ff39	5e9b9416-446f-4280-a237-ca833bdf200f	38f127cd-c376-4098-adcf-53c5239be7d7	rrrr	200	1	200	[]	\N	\N	\N	\N	2026-02-03 20:41:07.662029+00	2026-02-03 20:41:07.662029+00	300	main	KITCHEN	\N
\.


--
-- Data for Name: gm_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_orders (id, restaurant_id, table_id, table_number, status, payment_status, total_cents, subtotal_cents, tax_cents, discount_cents, source, operator_id, cash_register_id, notes, metadata, sync_metadata, origin, in_prep_at, ready_at, served_at, created_at, updated_at) FROM stdin;
43988f53-16d7-4e1c-8cfc-8ea7e69d8052	00000000-0000-0000-0000-000000000100	\N	\N	CLOSED	PAID	235700	235700	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "WEB"}	WEB	\N	\N	\N	2026-02-03 14:43:13.292668+00	2026-02-03 14:43:13.31313+00
2a57620c-38bb-4e6d-b5be-fe452dc40d08	00000000-0000-0000-0000-000000000100	\N	\N	CLOSED	PAID	234500	234500	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "WEB"}	WEB	\N	\N	\N	2026-02-03 15:57:29.250804+00	2026-02-03 15:57:29.275466+00
9bc7b283-75d4-4111-8b7a-1e5fe893f5cf	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	237350	237350	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:36.56459+00	2026-02-03 19:14:36.56459+00
d062820f-3fca-4fdc-af17-a931dd5ec2cd	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	1600	1600	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:37.07847+00	2026-02-03 19:14:37.07847+00
f31ea4dc-8359-4ba5-bd10-65d67c6da781	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	238300	238300	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:37.588784+00	2026-02-03 19:14:37.588784+00
270afa45-b207-47fe-8821-c83023bc7b5b	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	5050	5050	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:38.095813+00	2026-02-03 19:14:38.095813+00
f08b7f49-0fb3-4392-8fc2-02ac42973010	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	2400	2400	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:46.249393+00	2026-02-03 19:14:46.249393+00
65a0b643-3c24-4865-9e20-63d0dbeff3ad	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	6550	6550	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:46.759892+00	2026-02-03 19:14:46.759892+00
4066df79-ebff-4785-a3fb-0644f82cb6d2	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	7350	7350	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:47.264837+00	2026-02-03 19:14:47.264837+00
151989f6-502a-431d-bd67-b8fd2734768a	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	237700	237700	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:47.76979+00	2026-02-03 19:14:47.76979+00
8cd0a812-8e6d-4ba9-bad7-bb4573c21529	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	2200	2200	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:48.278379+00	2026-02-03 19:14:48.278379+00
e3d2b116-f55b-4418-a4b2-8265625de912	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	1050	1050	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:48.783224+00	2026-02-03 19:14:48.783224+00
23dfd8f5-95c7-4b0e-b6bc-44df1de94472	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	7600	7600	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:49.288716+00	2026-02-03 19:14:49.288716+00
13188c5b-3668-4dc6-979b-dc8aa7042e7a	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	3250	3250	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:49.797138+00	2026-02-03 19:14:49.797138+00
0d4fe61c-45ac-4d32-a949-73d8f92f5d47	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	6850	6850	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:50.326529+00	2026-02-03 19:14:50.326529+00
4635ab66-2c92-47eb-8e33-470ec7225a60	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	474300	474300	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:50.877843+00	2026-02-03 19:14:50.877843+00
13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	5350	5350	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:51.39475+00	2026-02-03 19:14:51.39475+00
b32c8d1f-89a2-484f-ba30-ec54cd99793d	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	236050	236050	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:51.906494+00	2026-02-03 19:14:51.906494+00
569fa7b0-a4c3-4aa8-9801-57709381d63c	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	200	200	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:52.415808+00	2026-02-03 19:14:52.415808+00
00fc8099-517c-4cfc-b163-08fddfe5f331	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	10200	10200	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:52.923603+00	2026-02-03 19:14:52.923603+00
6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	3750	3750	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:53.431146+00	2026-02-03 19:14:53.431146+00
1042f581-118c-4ab8-b6a8-f05f957190f2	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	236500	236500	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:53.938467+00	2026-02-03 19:14:53.938467+00
f296c614-a56d-4a10-aa32-2a6e9e617473	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	3100	3100	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:54.454084+00	2026-02-03 19:14:54.454084+00
f027bf45-1aa5-4742-b3c3-0b7fe79d4736	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	4800	4800	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:55.047932+00	2026-02-03 19:14:55.047932+00
88b59fa5-4683-474f-8ff9-9c4e25232f4f	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	704350	704350	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:55.553891+00	2026-02-03 19:14:55.553891+00
c5210f26-04a4-42fe-8574-64699496fbee	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	470700	470700	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:14:56.062729+00	2026-02-03 19:14:56.062729+00
2a442be9-44b2-4826-a2c1-bd4f0821e082	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	350	350	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:46.403118+00	2026-02-03 19:15:46.403118+00
018ec00c-e457-4cf3-8602-d56bbe54b8b0	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	3450	3450	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:46.919743+00	2026-02-03 19:15:46.919743+00
58f4b1cf-9671-40b4-b556-6fc7bf91f180	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	2400	2400	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:47.426731+00	2026-02-03 19:15:47.426731+00
ca898357-8bfd-43ae-9f73-480060d173cb	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	5350	5350	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:47.936318+00	2026-02-03 19:15:47.936318+00
b23e7dd8-9fa7-4181-b872-f65835d0ab70	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	1800	1800	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:48.442625+00	2026-02-03 19:15:48.442625+00
9ca93181-edee-422a-bbbf-6e86f18237f7	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	2400	2400	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:53.893848+00	2026-02-03 19:15:53.893848+00
5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	469600	469600	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:54.399825+00	2026-02-03 19:15:54.399825+00
036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	6250	6250	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:54.961998+00	2026-02-03 19:15:54.961998+00
01a4f9be-ca7c-424b-88cc-33d8ff533cd0	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	474750	474750	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:55.513985+00	2026-02-03 19:15:55.513985+00
9eeed760-ac93-4c8a-b3db-50d45abb074e	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	4450	4450	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:56.021459+00	2026-02-03 19:15:56.021459+00
70aa63a8-5c9c-4a61-9f8c-9fd79d75347f	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	708900	708900	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:56.532705+00	2026-02-03 19:15:56.532705+00
dd3c7ce4-a9fb-4728-ae65-df74d2df34c2	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	4450	4450	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:57.038727+00	2026-02-03 19:15:57.038727+00
ca7c99c8-0a65-4bd8-8344-02226a47b91b	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	5200	5200	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:57.542142+00	2026-02-03 19:15:57.542142+00
75611800-2bd7-4867-98ae-416a07f9fdde	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	469000	469000	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:58.048362+00	2026-02-03 19:15:58.048362+00
9c797e88-0203-440f-897f-ab33766ed066	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	4800	4800	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:58.555956+00	2026-02-03 19:15:58.555956+00
b80b6115-d79f-45b6-b0cb-6449ac2e1c09	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	7550	7550	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:59.063934+00	2026-02-03 19:15:59.063934+00
1e65ee70-5742-4892-a95e-4651f16e0728	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	235900	235900	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:15:59.571119+00	2026-02-03 19:15:59.571119+00
fdaeffe0-f7b3-44e6-ab80-ef713e6177ef	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	4100	4100	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:16:00.075217+00	2026-02-03 19:16:00.075217+00
e6d22d9a-bd0b-4454-82f0-055f05f05f32	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	4000	4000	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:16:00.582774+00	2026-02-03 19:16:00.582774+00
4016659b-a087-4dce-b842-1295979a9f23	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	4950	4950	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:16:01.091128+00	2026-02-03 19:16:01.091128+00
a0f1c9a6-1480-4188-ac93-684b5b76947a	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	235350	235350	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:16:01.595717+00	2026-02-03 19:16:01.595717+00
b377aed4-5f74-41ae-acf0-9b56b1b8df4b	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	234500	234500	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:16:02.100347+00	2026-02-03 19:16:02.100347+00
b635bff8-f0f2-45d1-9246-73252030731d	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	234900	234900	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:16:02.60731+00	2026-02-03 19:16:02.60731+00
c4cb723d-d736-4e1f-b131-cb0ccbe9190f	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	1600	1600	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:16:03.113319+00	2026-02-03 19:16:03.113319+00
bfacabab-54cb-46b8-95ae-59d6103b9906	00000000-0000-0000-0000-000000000100	\N	\N	OPEN	PENDING	3600	3600	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	\N	\N	\N	2026-02-03 19:16:03.618035+00	2026-02-03 19:16:03.618035+00
3f020ad3-4788-4a42-bd96-8775a63da80c	00000000-0000-0000-0000-000000000100	\N	\N	IN_PREP	PENDING	1650	1650	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	2026-02-03 19:16:42.964944+00	\N	\N	2026-02-03 19:14:36.032061+00	2026-02-03 19:16:42.980163+00
c5e821ac-1b7f-4684-bba2-3ca788ff4a00	00000000-0000-0000-0000-000000000100	\N	\N	CLOSED	PENDING	850	850	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "TPV"}	TPV	2026-02-03 19:20:11.066615+00	2026-02-03 19:20:11.091961+00	\N	2026-02-03 19:20:10.985768+00	2026-02-03 19:20:11.103989+00
5e9b9416-446f-4280-a237-ca833bdf200f	9ad697ab-183d-4ecf-813a-01e122bf1adc	\N	\N	CLOSED	PAID	200	200	0	0	tpv	\N	\N	\N	{"payment_method": "cash"}	{"origin": "WEB"}	WEB	\N	\N	\N	2026-02-03 20:41:07.662029+00	2026-02-03 20:41:07.676385+00
\.


--
-- Data for Name: gm_payment_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_payment_audit_logs (id, restaurant_id, order_id, operator_id, amount_cents, method, result, error_code, error_message, idempotency_key, payment_id, duration_ms, client_info, created_at) FROM stdin;
cafa8a21-abac-417f-ae26-cbdf88479c6b	00000000-0000-0000-0000-000000000100	43988f53-16d7-4e1c-8cfc-8ea7e69d8052	\N	235700	cash	success	\N	\N	43988f53-16d7-4e1c-8cfc-8ea7e69d8052-1770129793310	01dcbf24-da9d-4a1a-ad24-942fcab80d05	\N	\N	2026-02-03 14:43:13.31313+00
d5cbc15c-444e-4464-886d-127d91d52ded	00000000-0000-0000-0000-000000000100	2a57620c-38bb-4e6d-b5be-fe452dc40d08	\N	234500	cash	success	\N	\N	2a57620c-38bb-4e6d-b5be-fe452dc40d08-1770134249271	ef9befac-dee2-4b02-a42d-05bf3bb28243	\N	\N	2026-02-03 15:57:29.275466+00
28238b36-b84d-4d1b-8fca-0d09357ed3c6	9ad697ab-183d-4ecf-813a-01e122bf1adc	5e9b9416-446f-4280-a237-ca833bdf200f	\N	200	cash	success	\N	\N	5e9b9416-446f-4280-a237-ca833bdf200f-1770151267673	b9007ea7-e635-435c-a8fd-72a2fec07b6f	\N	\N	2026-02-03 20:41:07.676385+00
\.


--
-- Data for Name: gm_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_payments (id, restaurant_id, order_id, cash_register_id, operator_id, amount_cents, currency, payment_method, status, idempotency_key, created_at, updated_at) FROM stdin;
01dcbf24-da9d-4a1a-ad24-942fcab80d05	00000000-0000-0000-0000-000000000100	43988f53-16d7-4e1c-8cfc-8ea7e69d8052	7111c3d1-8eeb-4d89-8a58-50a2890b10b7	\N	235700	EUR	cash	paid	43988f53-16d7-4e1c-8cfc-8ea7e69d8052-1770129793310	2026-02-03 14:43:13.31313+00	2026-02-03 14:43:13.31313+00
ef9befac-dee2-4b02-a42d-05bf3bb28243	00000000-0000-0000-0000-000000000100	2a57620c-38bb-4e6d-b5be-fe452dc40d08	7111c3d1-8eeb-4d89-8a58-50a2890b10b7	\N	234500	EUR	cash	paid	2a57620c-38bb-4e6d-b5be-fe452dc40d08-1770134249271	2026-02-03 15:57:29.275466+00	2026-02-03 15:57:29.275466+00
b9007ea7-e635-435c-a8fd-72a2fec07b6f	9ad697ab-183d-4ecf-813a-01e122bf1adc	5e9b9416-446f-4280-a237-ca833bdf200f	9e3d3e07-f8b7-422a-9d44-0484861c2e7e	\N	200	EUR	cash	paid	5e9b9416-446f-4280-a237-ca833bdf200f-1770151267673	2026-02-03 20:41:07.676385+00	2026-02-03 20:41:07.676385+00
\.


--
-- Data for Name: gm_product_bom; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_product_bom (id, restaurant_id, product_id, ingredient_id, qty_per_unit, station, preferred_location_kind, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: gm_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_products (id, restaurant_id, category_id, name, description, price_cents, photo_url, available, track_stock, stock_quantity, cost_price_cents, created_at, updated_at, prep_time_seconds, prep_category, station) FROM stdin;
ca627025-5703-4fe6-afde-c4ac4144c0c6	00000000-0000-0000-0000-000000000100	6d13d1c5-4add-43d5-b573-9bccb82d4503	Bruschetta	\N	850	\N	t	f	0	0	2026-02-03 13:40:42.374473+00	2026-02-03 13:40:42.374473+00	720	main	KITCHEN
1aa73167-6e9a-4ee0-b947-39f3ac48524c	00000000-0000-0000-0000-000000000100	6d13d1c5-4add-43d5-b573-9bccb82d4503	Nachos	\N	1200	\N	t	f	0	0	2026-02-03 13:40:42.374473+00	2026-02-03 13:40:42.374473+00	720	main	KITCHEN
5c5afa57-a46a-4adc-8416-e79f7334dffb	00000000-0000-0000-0000-000000000100	1675b27d-b1f7-4e82-b2ef-04c69700d863	Hambúrguer Artesanal	\N	1800	\N	t	f	0	0	2026-02-03 13:40:42.374473+00	2026-02-03 13:40:42.374473+00	720	main	KITCHEN
7507f03b-9074-4557-8438-1646d57e8fcc	00000000-0000-0000-0000-000000000100	1675b27d-b1f7-4e82-b2ef-04c69700d863	Pizza Margherita	\N	1600	\N	t	f	0	0	2026-02-03 13:40:42.374473+00	2026-02-03 13:40:42.374473+00	720	main	KITCHEN
f3750df5-172b-4968-a212-4c2c490a5699	00000000-0000-0000-0000-000000000100	7ef2d144-8a87-4724-81fc-9367dc897b41	Água	\N	200	\N	t	f	0	0	2026-02-03 13:40:42.374473+00	2026-02-03 13:40:42.374473+00	720	main	KITCHEN
4749cc80-39c2-4bb3-bd00-cef78b2dd4cc	00000000-0000-0000-0000-000000000100	7ef2d144-8a87-4724-81fc-9367dc897b41	Refrigerante	\N	350	\N	t	f	0	0	2026-02-03 13:40:42.374473+00	2026-02-03 13:40:42.374473+00	720	main	KITCHEN
8ae44c3f-fdb6-4e7b-a0da-d28e128f718f	00000000-0000-0000-0000-000000000100	99cb6f6d-2be5-4f95-ad01-0a439f7cd732	Tiramisú	\N	800	\N	t	f	0	0	2026-02-03 13:40:42.374473+00	2026-02-03 13:40:42.374473+00	720	main	KITCHEN
0cf55b09-24fc-4088-83b4-89d362957941	00000000-0000-0000-0000-000000000100	\N	test12345	\N	234500	\N	t	f	0	0	2026-02-03 14:42:42.048957+00	2026-02-03 14:42:42.048957+00	120	drink	BAR
38f127cd-c376-4098-adcf-53c5239be7d7	9ad697ab-183d-4ecf-813a-01e122bf1adc	\N	rrrr	\N	200	\N	t	f	0	0	2026-02-03 20:32:07.84721+00	2026-02-03 20:32:07.84721+00	300	main	KITCHEN
\.


--
-- Data for Name: gm_restaurant_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_restaurant_members (id, restaurant_id, user_id, role, created_at, updated_at) FROM stdin;
2cdd055e-d069-4e19-b73b-df475dc6f960	00000000-0000-0000-0000-000000000100	00000000-0000-0000-0000-000000000002	owner	2026-02-03 13:42:52.187497+00	2026-02-03 13:42:52.187497+00
666f3dde-5a5b-446f-82ed-7bf9b647239a	9ad697ab-183d-4ecf-813a-01e122bf1adc	e6997028-1dea-49a9-a254-fc1178bc484b	owner	2026-02-03 20:31:58.052166+00	2026-02-03 20:31:58.052166+00
\.


--
-- Data for Name: gm_restaurants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_restaurants (id, tenant_id, name, slug, description, owner_id, status, created_at, updated_at, billing_status, product_mode, type, country, timezone, currency, locale, address, city, postal_code, state, capacity, latitude, longitude, onboarding_completed_at) FROM stdin;
00000000-0000-0000-0000-000000000100	00000000-0000-0000-0000-000000000001	Restaurante Piloto	restaurante-piloto	\N	\N	active	2026-02-03 13:40:42.372661+00	2026-02-03 13:40:42.53319+00	trial	live	Restaurante	Portugal	Europe/Lisbon	EUR	pt-PT	\N	\N	\N	\N	\N	\N	\N	\N
9ad697ab-183d-4ecf-813a-01e122bf1adc	\N	trewfd	rest-7217iy	\N	e6997028-1dea-49a9-a254-fc1178bc484b	active	2026-02-03 20:31:58.045476+00	2026-02-03 20:31:58.045476+00	trial	demo	\N	\N	\N	BRL	pt-BR	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: gm_stock_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_stock_ledger (id, restaurant_id, location_id, ingredient_id, order_id, order_item_id, action, qty, reason, created_by_role, created_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: gm_stock_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_stock_levels (id, restaurant_id, location_id, ingredient_id, qty, min_qty, updated_at) FROM stdin;
\.


--
-- Data for Name: gm_tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_tables (id, restaurant_id, number, qr_code, status, created_at) FROM stdin;
af171bd1-238b-4647-aaf4-8543531aab0f	00000000-0000-0000-0000-000000000100	1	\N	closed	2026-02-03 13:40:42.375453+00
2729f6f2-4b85-4782-a31c-45b3a36caea5	00000000-0000-0000-0000-000000000100	2	\N	closed	2026-02-03 13:40:42.375453+00
481a077e-6d5d-4863-9ddf-5cb0b8bd70d5	00000000-0000-0000-0000-000000000100	3	\N	closed	2026-02-03 13:40:42.375453+00
c8b228d0-c4b3-494c-91e0-681bb8b31fe3	00000000-0000-0000-0000-000000000100	4	\N	closed	2026-02-03 13:40:42.375453+00
9a7fc96e-97bc-48a5-8e3a-24e113f2f40e	00000000-0000-0000-0000-000000000100	5	\N	closed	2026-02-03 13:40:42.375453+00
2751cf22-7fdf-4fc6-87f5-f1a9f51997a0	00000000-0000-0000-0000-000000000100	6	\N	closed	2026-02-03 13:40:42.375453+00
aae01e69-292d-4486-9ac0-fb54cbb2a572	00000000-0000-0000-0000-000000000100	7	\N	closed	2026-02-03 13:40:42.375453+00
3cbd7eba-e76a-41b8-b704-38079546aefe	00000000-0000-0000-0000-000000000100	8	\N	closed	2026-02-03 13:40:42.375453+00
b1ce1509-fbb9-4874-aaba-6a71f078ef9f	00000000-0000-0000-0000-000000000100	9	\N	closed	2026-02-03 13:40:42.375453+00
5d61e0e9-2f89-4b68-89a4-6c0e6ca0e1fe	00000000-0000-0000-0000-000000000100	10	\N	closed	2026-02-03 13:40:42.375453+00
\.


--
-- Data for Name: gm_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gm_tasks (id, restaurant_id, order_id, order_item_id, task_type, station, priority, message, context, status, assigned_to, created_at, acknowledged_at, resolved_at, updated_at, auto_generated, source_event) FROM stdin;
3b2734ad-f7de-447e-9243-cb5ed3faf9d1	00000000-0000-0000-0000-000000000100	\N	\N	MODO_INTERNO	\N	MEDIA	Restaurante em modo interno — checklist e organização	{"event_type": "restaurant_idle", "description": "Modo interno: sem pedidos ativos há Infinity min. Aproveitar para checklist do turno, limpeza, organização ou preparação.", "shiftOpenAt": "2026-02-03T13:40:42.534Z", "minutesSinceLastOrder": null}	OPEN	\N	2026-02-03 14:34:03.827071+00	\N	\N	2026-02-03 14:34:03.827071+00	t	restaurant_idle
79e5db2b-3cca-492d-bbc6-40b4632446e9	00000000-0000-0000-0000-000000000100	43988f53-16d7-4e1c-8cfc-8ea7e69d8052	\N	PEDIDO_NOVO	\N	ALTA	Preparar pedido #43988f53-16d7-4e1c-8cfc-8ea7e69d8052	{"orderId": "43988f53-16d7-4e1c-8cfc-8ea7e69d8052", "event_type": "order_created", "description": "Novo pedido criado. Mesa —. Preparar e entregar.", "orderNumber": "43988f53-16d7-4e1c-8cfc-8ea7e69d8052", "tableNumber": null}	OPEN	\N	2026-02-03 14:43:13.30796+00	\N	\N	2026-02-03 14:43:13.30796+00	t	order_created
7e8353e1-5484-49f7-b516-d8e8d7241760	00000000-0000-0000-0000-000000000100	2a57620c-38bb-4e6d-b5be-fe452dc40d08	\N	PEDIDO_NOVO	\N	ALTA	Preparar pedido #2a57620c-38bb-4e6d-b5be-fe452dc40d08	{"orderId": "2a57620c-38bb-4e6d-b5be-fe452dc40d08", "event_type": "order_created", "description": "Novo pedido criado. Mesa —. Preparar e entregar.", "orderNumber": "2a57620c-38bb-4e6d-b5be-fe452dc40d08", "tableNumber": null}	OPEN	\N	2026-02-03 15:57:29.266795+00	\N	\N	2026-02-03 15:57:29.266795+00	t	order_created
5c3a78c4-dbc9-4d27-a253-14753eabbffb	00000000-0000-0000-0000-000000000100	bfacabab-54cb-46b8-95ae-59d6103b9906	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #bfacabab-54cb-46b8-95ae-59d6103b9906	{"status": "OPEN", "orderId": "bfacabab-54cb-46b8-95ae-59d6103b9906", "event_type": "order_delayed", "description": "Pedido #bfacabab-54cb-46b8-95ae-59d6103b9906 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:49.648329+00	\N	\N	2026-02-03 20:30:49.648329+00	t	order_delayed
eed38912-fd56-4314-b72e-a4051f568291	00000000-0000-0000-0000-000000000100	c4cb723d-d736-4e1f-b131-cb0ccbe9190f	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #c4cb723d-d736-4e1f-b131-cb0ccbe9190f	{"status": "OPEN", "orderId": "c4cb723d-d736-4e1f-b131-cb0ccbe9190f", "event_type": "order_delayed", "description": "Pedido #c4cb723d-d736-4e1f-b131-cb0ccbe9190f está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:50.549097+00	\N	\N	2026-02-03 20:30:50.549097+00	t	order_delayed
8624b31b-2916-4437-8265-44649b192f91	00000000-0000-0000-0000-000000000100	b635bff8-f0f2-45d1-9246-73252030731d	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #b635bff8-f0f2-45d1-9246-73252030731d	{"status": "OPEN", "orderId": "b635bff8-f0f2-45d1-9246-73252030731d", "event_type": "order_delayed", "description": "Pedido #b635bff8-f0f2-45d1-9246-73252030731d está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:50.634177+00	\N	\N	2026-02-03 20:30:50.634177+00	t	order_delayed
7556e27a-fd74-4b8f-af78-3ab0419dc47e	00000000-0000-0000-0000-000000000100	b377aed4-5f74-41ae-acf0-9b56b1b8df4b	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #b377aed4-5f74-41ae-acf0-9b56b1b8df4b	{"status": "OPEN", "orderId": "b377aed4-5f74-41ae-acf0-9b56b1b8df4b", "event_type": "order_delayed", "description": "Pedido #b377aed4-5f74-41ae-acf0-9b56b1b8df4b está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:50.73916+00	\N	\N	2026-02-03 20:30:50.73916+00	t	order_delayed
3fe69b25-db1e-454d-8e01-e8fe7ee4ce30	00000000-0000-0000-0000-000000000100	a0f1c9a6-1480-4188-ac93-684b5b76947a	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #a0f1c9a6-1480-4188-ac93-684b5b76947a	{"status": "OPEN", "orderId": "a0f1c9a6-1480-4188-ac93-684b5b76947a", "event_type": "order_delayed", "description": "Pedido #a0f1c9a6-1480-4188-ac93-684b5b76947a está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:50.823799+00	\N	\N	2026-02-03 20:30:50.823799+00	t	order_delayed
ecb07967-af80-4029-a41a-ed62a84dbdd6	00000000-0000-0000-0000-000000000100	4016659b-a087-4dce-b842-1295979a9f23	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #4016659b-a087-4dce-b842-1295979a9f23	{"status": "OPEN", "orderId": "4016659b-a087-4dce-b842-1295979a9f23", "event_type": "order_delayed", "description": "Pedido #4016659b-a087-4dce-b842-1295979a9f23 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:50.962406+00	\N	\N	2026-02-03 20:30:50.962406+00	t	order_delayed
3128bb63-1315-4220-9651-db76b21d8389	00000000-0000-0000-0000-000000000100	e6d22d9a-bd0b-4454-82f0-055f05f05f32	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #e6d22d9a-bd0b-4454-82f0-055f05f05f32	{"status": "OPEN", "orderId": "e6d22d9a-bd0b-4454-82f0-055f05f05f32", "event_type": "order_delayed", "description": "Pedido #e6d22d9a-bd0b-4454-82f0-055f05f05f32 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.259277+00	\N	\N	2026-02-03 20:30:51.259277+00	t	order_delayed
92c9cfaa-612f-46cb-8245-fbe37ec739ca	00000000-0000-0000-0000-000000000100	fdaeffe0-f7b3-44e6-ab80-ef713e6177ef	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #fdaeffe0-f7b3-44e6-ab80-ef713e6177ef	{"status": "OPEN", "orderId": "fdaeffe0-f7b3-44e6-ab80-ef713e6177ef", "event_type": "order_delayed", "description": "Pedido #fdaeffe0-f7b3-44e6-ab80-ef713e6177ef está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.345946+00	\N	\N	2026-02-03 20:30:51.345946+00	t	order_delayed
1bc5fd6a-3b5e-43bf-a024-0103a582e1bc	00000000-0000-0000-0000-000000000100	1e65ee70-5742-4892-a95e-4651f16e0728	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #1e65ee70-5742-4892-a95e-4651f16e0728	{"status": "OPEN", "orderId": "1e65ee70-5742-4892-a95e-4651f16e0728", "event_type": "order_delayed", "description": "Pedido #1e65ee70-5742-4892-a95e-4651f16e0728 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.37896+00	\N	\N	2026-02-03 20:30:51.37896+00	t	order_delayed
6f8ffe17-dbb1-4f79-9833-4411d1e44eda	00000000-0000-0000-0000-000000000100	b80b6115-d79f-45b6-b0cb-6449ac2e1c09	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #b80b6115-d79f-45b6-b0cb-6449ac2e1c09	{"status": "OPEN", "orderId": "b80b6115-d79f-45b6-b0cb-6449ac2e1c09", "event_type": "order_delayed", "description": "Pedido #b80b6115-d79f-45b6-b0cb-6449ac2e1c09 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.407882+00	\N	\N	2026-02-03 20:30:51.407882+00	t	order_delayed
e9d50c87-d38a-4195-8612-359fa6ebe037	00000000-0000-0000-0000-000000000100	9c797e88-0203-440f-897f-ab33766ed066	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #9c797e88-0203-440f-897f-ab33766ed066	{"status": "OPEN", "orderId": "9c797e88-0203-440f-897f-ab33766ed066", "event_type": "order_delayed", "description": "Pedido #9c797e88-0203-440f-897f-ab33766ed066 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.435778+00	\N	\N	2026-02-03 20:30:51.435778+00	t	order_delayed
fa3669f3-dd5b-40fa-95ec-4f21f90d6523	00000000-0000-0000-0000-000000000100	9c797e88-0203-440f-897f-ab33766ed066	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #9c797e88-0203-440f-897f-ab33766ed066	{"status": "OPEN", "orderId": "9c797e88-0203-440f-897f-ab33766ed066", "event_type": "order_delayed", "description": "Pedido #9c797e88-0203-440f-897f-ab33766ed066 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.450465+00	\N	\N	2026-02-03 20:30:51.450465+00	t	order_delayed
51671e65-6967-4d12-a4dd-04b9b7451e0a	00000000-0000-0000-0000-000000000100	75611800-2bd7-4867-98ae-416a07f9fdde	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #75611800-2bd7-4867-98ae-416a07f9fdde	{"status": "OPEN", "orderId": "75611800-2bd7-4867-98ae-416a07f9fdde", "event_type": "order_delayed", "description": "Pedido #75611800-2bd7-4867-98ae-416a07f9fdde está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.472793+00	\N	\N	2026-02-03 20:30:51.472793+00	t	order_delayed
d52d40f7-d351-46e3-b342-d80b0867a213	00000000-0000-0000-0000-000000000100	75611800-2bd7-4867-98ae-416a07f9fdde	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #75611800-2bd7-4867-98ae-416a07f9fdde	{"status": "OPEN", "orderId": "75611800-2bd7-4867-98ae-416a07f9fdde", "event_type": "order_delayed", "description": "Pedido #75611800-2bd7-4867-98ae-416a07f9fdde está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.483629+00	\N	\N	2026-02-03 20:30:51.483629+00	t	order_delayed
8dbbc43c-8e74-4a28-80d2-2f4c0b810858	00000000-0000-0000-0000-000000000100	ca7c99c8-0a65-4bd8-8344-02226a47b91b	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #ca7c99c8-0a65-4bd8-8344-02226a47b91b	{"status": "OPEN", "orderId": "ca7c99c8-0a65-4bd8-8344-02226a47b91b", "event_type": "order_delayed", "description": "Pedido #ca7c99c8-0a65-4bd8-8344-02226a47b91b está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.516403+00	\N	\N	2026-02-03 20:30:51.516403+00	t	order_delayed
db844e98-7247-4af6-975f-0a424fb46af9	00000000-0000-0000-0000-000000000100	dd3c7ce4-a9fb-4728-ae65-df74d2df34c2	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #dd3c7ce4-a9fb-4728-ae65-df74d2df34c2	{"status": "OPEN", "orderId": "dd3c7ce4-a9fb-4728-ae65-df74d2df34c2", "event_type": "order_delayed", "description": "Pedido #dd3c7ce4-a9fb-4728-ae65-df74d2df34c2 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.560021+00	\N	\N	2026-02-03 20:30:51.560021+00	t	order_delayed
d9e51c2c-b996-440b-88b2-bd7c627d2a22	00000000-0000-0000-0000-000000000100	b23e7dd8-9fa7-4181-b872-f65835d0ab70	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #b23e7dd8-9fa7-4181-b872-f65835d0ab70	{"status": "OPEN", "orderId": "b23e7dd8-9fa7-4181-b872-f65835d0ab70", "event_type": "order_delayed", "description": "Pedido #b23e7dd8-9fa7-4181-b872-f65835d0ab70 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.466578+00	\N	\N	2026-02-03 20:30:52.466578+00	t	order_delayed
adde73c0-35cc-4de5-a117-dd024a2ced8e	00000000-0000-0000-0000-000000000100	ca898357-8bfd-43ae-9f73-480060d173cb	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #ca898357-8bfd-43ae-9f73-480060d173cb	{"status": "OPEN", "orderId": "ca898357-8bfd-43ae-9f73-480060d173cb", "event_type": "order_delayed", "description": "Pedido #ca898357-8bfd-43ae-9f73-480060d173cb está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.491588+00	\N	\N	2026-02-03 20:30:52.491588+00	t	order_delayed
eb21bc4a-15c7-47f8-84ae-bc741ac81a81	00000000-0000-0000-0000-000000000100	f027bf45-1aa5-4742-b3c3-0b7fe79d4736	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #f027bf45-1aa5-4742-b3c3-0b7fe79d4736	{"status": "OPEN", "orderId": "f027bf45-1aa5-4742-b3c3-0b7fe79d4736", "event_type": "order_delayed", "description": "Pedido #f027bf45-1aa5-4742-b3c3-0b7fe79d4736 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.631592+00	\N	\N	2026-02-03 20:30:52.631592+00	t	order_delayed
bdf270d0-46ae-4a0c-bb26-4ed2ce33491b	00000000-0000-0000-0000-000000000100	569fa7b0-a4c3-4aa8-9801-57709381d63c	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #569fa7b0-a4c3-4aa8-9801-57709381d63c	{"status": "OPEN", "orderId": "569fa7b0-a4c3-4aa8-9801-57709381d63c", "event_type": "order_delayed", "description": "Pedido #569fa7b0-a4c3-4aa8-9801-57709381d63c está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:54.027215+00	\N	\N	2026-02-03 20:30:54.027215+00	t	order_delayed
8c3a40d7-0397-4d6b-8152-10e6e1e2c0d4	00000000-0000-0000-0000-000000000100	13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	{"status": "OPEN", "orderId": "13e44a7f-b1bb-49ee-af5e-b28ff82bbc47", "event_type": "order_delayed", "description": "Pedido #13e44a7f-b1bb-49ee-af5e-b28ff82bbc47 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:54.109141+00	\N	\N	2026-02-03 20:30:54.109141+00	t	order_delayed
4e7911c6-79be-4444-a891-bf27bfe4fbd9	00000000-0000-0000-0000-000000000100	4635ab66-2c92-47eb-8e33-470ec7225a60	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #4635ab66-2c92-47eb-8e33-470ec7225a60	{"status": "OPEN", "orderId": "4635ab66-2c92-47eb-8e33-470ec7225a60", "event_type": "order_delayed", "description": "Pedido #4635ab66-2c92-47eb-8e33-470ec7225a60 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.144459+00	\N	\N	2026-02-03 20:30:54.144459+00	t	order_delayed
e3766f0e-5cef-4acd-8f10-8a48eda82e8e	00000000-0000-0000-0000-000000000100	4066df79-ebff-4785-a3fb-0644f82cb6d2	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #4066df79-ebff-4785-a3fb-0644f82cb6d2	{"status": "OPEN", "orderId": "4066df79-ebff-4785-a3fb-0644f82cb6d2", "event_type": "order_delayed", "description": "Pedido #4066df79-ebff-4785-a3fb-0644f82cb6d2 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.283279+00	\N	\N	2026-02-03 20:30:54.283279+00	t	order_delayed
0c13dc28-f192-4483-8894-b0ae7d4cde9c	00000000-0000-0000-0000-000000000100	ca7c99c8-0a65-4bd8-8344-02226a47b91b	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #ca7c99c8-0a65-4bd8-8344-02226a47b91b	{"status": "OPEN", "orderId": "ca7c99c8-0a65-4bd8-8344-02226a47b91b", "event_type": "order_delayed", "description": "Pedido #ca7c99c8-0a65-4bd8-8344-02226a47b91b está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.536859+00	\N	\N	2026-02-03 20:30:51.536859+00	t	order_delayed
51a32793-0213-4f10-a624-482019073e3c	00000000-0000-0000-0000-000000000100	036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	{"status": "OPEN", "orderId": "036a1de3-8b67-4cfa-9bf7-20f9a1b746cd", "event_type": "order_delayed", "description": "Pedido #036a1de3-8b67-4cfa-9bf7-20f9a1b746cd está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.407072+00	\N	\N	2026-02-03 20:30:52.407072+00	t	order_delayed
0f1d6ae8-6ce8-4bd5-935f-250aaa9771f1	00000000-0000-0000-0000-000000000100	5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8	{"status": "OPEN", "orderId": "5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8", "event_type": "order_delayed", "description": "Pedido #5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.437109+00	\N	\N	2026-02-03 20:30:52.437109+00	t	order_delayed
6005feab-325a-4a44-9e58-8c709d6ff381	00000000-0000-0000-0000-000000000100	58f4b1cf-9671-40b4-b556-6fc7bf91f180	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #58f4b1cf-9671-40b4-b556-6fc7bf91f180	{"status": "OPEN", "orderId": "58f4b1cf-9671-40b4-b556-6fc7bf91f180", "event_type": "order_delayed", "description": "Pedido #58f4b1cf-9671-40b4-b556-6fc7bf91f180 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.502013+00	\N	\N	2026-02-03 20:30:52.502013+00	t	order_delayed
a67d8829-26c6-46d9-81d1-6c2c76d27752	00000000-0000-0000-0000-000000000100	f296c614-a56d-4a10-aa32-2a6e9e617473	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #f296c614-a56d-4a10-aa32-2a6e9e617473	{"status": "OPEN", "orderId": "f296c614-a56d-4a10-aa32-2a6e9e617473", "event_type": "order_delayed", "description": "Pedido #f296c614-a56d-4a10-aa32-2a6e9e617473 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.656879+00	\N	\N	2026-02-03 20:30:52.656879+00	t	order_delayed
630eaaec-070b-49aa-a8e6-47b1bccd26e5	00000000-0000-0000-0000-000000000100	1042f581-118c-4ab8-b6a8-f05f957190f2	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #1042f581-118c-4ab8-b6a8-f05f957190f2	{"status": "OPEN", "orderId": "1042f581-118c-4ab8-b6a8-f05f957190f2", "event_type": "order_delayed", "description": "Pedido #1042f581-118c-4ab8-b6a8-f05f957190f2 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.696549+00	\N	\N	2026-02-03 20:30:52.696549+00	t	order_delayed
2d7aacd7-7069-4525-8670-d4703ebddea1	00000000-0000-0000-0000-000000000100	23dfd8f5-95c7-4b0e-b6bc-44df1de94472	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #23dfd8f5-95c7-4b0e-b6bc-44df1de94472	{"status": "OPEN", "orderId": "23dfd8f5-95c7-4b0e-b6bc-44df1de94472", "event_type": "order_delayed", "description": "Pedido #23dfd8f5-95c7-4b0e-b6bc-44df1de94472 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.202683+00	\N	\N	2026-02-03 20:30:54.202683+00	t	order_delayed
2e32e126-5331-4005-bd9c-ad8ad1780b39	00000000-0000-0000-0000-000000000100	8cd0a812-8e6d-4ba9-bad7-bb4573c21529	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #8cd0a812-8e6d-4ba9-bad7-bb4573c21529	{"status": "OPEN", "orderId": "8cd0a812-8e6d-4ba9-bad7-bb4573c21529", "event_type": "order_delayed", "description": "Pedido #8cd0a812-8e6d-4ba9-bad7-bb4573c21529 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.2469+00	\N	\N	2026-02-03 20:30:54.2469+00	t	order_delayed
2fde4c82-017d-4b0f-983b-81df98efff1b	00000000-0000-0000-0000-000000000100	f08b7f49-0fb3-4392-8fc2-02ac42973010	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #f08b7f49-0fb3-4392-8fc2-02ac42973010	{"status": "OPEN", "orderId": "f08b7f49-0fb3-4392-8fc2-02ac42973010", "event_type": "order_delayed", "description": "Pedido #f08b7f49-0fb3-4392-8fc2-02ac42973010 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.334557+00	\N	\N	2026-02-03 20:30:54.334557+00	t	order_delayed
e37c2d3f-a511-4159-a452-c6679d6c7229	00000000-0000-0000-0000-000000000100	270afa45-b207-47fe-8821-c83023bc7b5b	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #270afa45-b207-47fe-8821-c83023bc7b5b	{"status": "OPEN", "orderId": "270afa45-b207-47fe-8821-c83023bc7b5b", "event_type": "order_delayed", "description": "Pedido #270afa45-b207-47fe-8821-c83023bc7b5b está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.380802+00	\N	\N	2026-02-03 20:30:54.380802+00	t	order_delayed
bf5b3bea-5a70-4a11-ba98-15cba23ddccf	00000000-0000-0000-0000-000000000100	dd3c7ce4-a9fb-4728-ae65-df74d2df34c2	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #dd3c7ce4-a9fb-4728-ae65-df74d2df34c2	{"status": "OPEN", "orderId": "dd3c7ce4-a9fb-4728-ae65-df74d2df34c2", "event_type": "order_delayed", "description": "Pedido #dd3c7ce4-a9fb-4728-ae65-df74d2df34c2 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.581688+00	\N	\N	2026-02-03 20:30:51.581688+00	t	order_delayed
8367a967-6fb7-4996-9bed-db9277cdd7c1	00000000-0000-0000-0000-000000000100	01a4f9be-ca7c-424b-88cc-33d8ff533cd0	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #01a4f9be-ca7c-424b-88cc-33d8ff533cd0	{"status": "OPEN", "orderId": "01a4f9be-ca7c-424b-88cc-33d8ff533cd0", "event_type": "order_delayed", "description": "Pedido #01a4f9be-ca7c-424b-88cc-33d8ff533cd0 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.399481+00	\N	\N	2026-02-03 20:30:52.399481+00	t	order_delayed
f3cfd765-5d23-4049-b06a-d9689aa8d3e2	00000000-0000-0000-0000-000000000100	036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	{"status": "OPEN", "orderId": "036a1de3-8b67-4cfa-9bf7-20f9a1b746cd", "event_type": "order_delayed", "description": "Pedido #036a1de3-8b67-4cfa-9bf7-20f9a1b746cd está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.41968+00	\N	\N	2026-02-03 20:30:52.41968+00	t	order_delayed
4f887aba-baad-4ab9-a078-eaa2e05433e3	00000000-0000-0000-0000-000000000100	ca898357-8bfd-43ae-9f73-480060d173cb	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #ca898357-8bfd-43ae-9f73-480060d173cb	{"status": "OPEN", "orderId": "ca898357-8bfd-43ae-9f73-480060d173cb", "event_type": "order_delayed", "description": "Pedido #ca898357-8bfd-43ae-9f73-480060d173cb está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.482575+00	\N	\N	2026-02-03 20:30:52.482575+00	t	order_delayed
85eb5745-fce3-442c-99c2-bb67969364ef	00000000-0000-0000-0000-000000000100	018ec00c-e457-4cf3-8602-d56bbe54b8b0	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #018ec00c-e457-4cf3-8602-d56bbe54b8b0	{"status": "OPEN", "orderId": "018ec00c-e457-4cf3-8602-d56bbe54b8b0", "event_type": "order_delayed", "description": "Pedido #018ec00c-e457-4cf3-8602-d56bbe54b8b0 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.549735+00	\N	\N	2026-02-03 20:30:52.549735+00	t	order_delayed
5239fa6f-9ab1-4b25-9754-64d40dc5353c	00000000-0000-0000-0000-000000000100	88b59fa5-4683-474f-8ff9-9c4e25232f4f	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #88b59fa5-4683-474f-8ff9-9c4e25232f4f	{"status": "OPEN", "orderId": "88b59fa5-4683-474f-8ff9-9c4e25232f4f", "event_type": "order_delayed", "description": "Pedido #88b59fa5-4683-474f-8ff9-9c4e25232f4f está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.613229+00	\N	\N	2026-02-03 20:30:52.613229+00	t	order_delayed
a74efffa-23d9-4605-abbb-3a0a3742743f	00000000-0000-0000-0000-000000000100	f296c614-a56d-4a10-aa32-2a6e9e617473	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #f296c614-a56d-4a10-aa32-2a6e9e617473	{"status": "OPEN", "orderId": "f296c614-a56d-4a10-aa32-2a6e9e617473", "event_type": "order_delayed", "description": "Pedido #f296c614-a56d-4a10-aa32-2a6e9e617473 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.666239+00	\N	\N	2026-02-03 20:30:52.666239+00	t	order_delayed
12e46817-cdae-4d38-8219-6777bc1bb481	00000000-0000-0000-0000-000000000100	e3d2b116-f55b-4418-a4b2-8265625de912	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #e3d2b116-f55b-4418-a4b2-8265625de912	{"status": "OPEN", "orderId": "e3d2b116-f55b-4418-a4b2-8265625de912", "event_type": "order_delayed", "description": "Pedido #e3d2b116-f55b-4418-a4b2-8265625de912 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.215488+00	\N	\N	2026-02-03 20:30:54.215488+00	t	order_delayed
e6f6acc3-046c-453e-8dcb-e8faa3ae167b	00000000-0000-0000-0000-000000000100	65a0b643-3c24-4865-9e20-63d0dbeff3ad	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #65a0b643-3c24-4865-9e20-63d0dbeff3ad	{"status": "OPEN", "orderId": "65a0b643-3c24-4865-9e20-63d0dbeff3ad", "event_type": "order_delayed", "description": "Pedido #65a0b643-3c24-4865-9e20-63d0dbeff3ad está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.323857+00	\N	\N	2026-02-03 20:30:54.323857+00	t	order_delayed
3f1784e3-3e02-4e8b-b668-4ebc707397f0	00000000-0000-0000-0000-000000000100	3f020ad3-4788-4a42-bd96-8775a63da80c	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #3f020ad3-4788-4a42-bd96-8775a63da80c	{"status": "IN_PREP", "orderId": "3f020ad3-4788-4a42-bd96-8775a63da80c", "event_type": "order_delayed", "description": "Pedido #3f020ad3-4788-4a42-bd96-8775a63da80c está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:58.948088+00	\N	\N	2026-02-03 20:30:58.948088+00	t	order_delayed
2338ab48-7273-4995-a0b3-c1d13882dbfc	00000000-0000-0000-0000-000000000100	70aa63a8-5c9c-4a61-9f8c-9fd79d75347f	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #70aa63a8-5c9c-4a61-9f8c-9fd79d75347f	{"status": "OPEN", "orderId": "70aa63a8-5c9c-4a61-9f8c-9fd79d75347f", "event_type": "order_delayed", "description": "Pedido #70aa63a8-5c9c-4a61-9f8c-9fd79d75347f está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.600389+00	\N	\N	2026-02-03 20:30:51.600389+00	t	order_delayed
9d2403e5-01f2-4615-b378-bcc037c45da7	00000000-0000-0000-0000-000000000100	c5210f26-04a4-42fe-8574-64699496fbee	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #c5210f26-04a4-42fe-8574-64699496fbee	{"status": "OPEN", "orderId": "c5210f26-04a4-42fe-8574-64699496fbee", "event_type": "order_delayed", "description": "Pedido #c5210f26-04a4-42fe-8574-64699496fbee está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.588221+00	\N	\N	2026-02-03 20:30:52.588221+00	t	order_delayed
9e3b44ca-7ab0-4704-809b-d3bcb0ebaeb4	00000000-0000-0000-0000-000000000100	f027bf45-1aa5-4742-b3c3-0b7fe79d4736	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #f027bf45-1aa5-4742-b3c3-0b7fe79d4736	{"status": "OPEN", "orderId": "f027bf45-1aa5-4742-b3c3-0b7fe79d4736", "event_type": "order_delayed", "description": "Pedido #f027bf45-1aa5-4742-b3c3-0b7fe79d4736 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.643794+00	\N	\N	2026-02-03 20:30:52.643794+00	t	order_delayed
d3d359e5-35a5-444e-ab98-6af4fa7ff0dc	00000000-0000-0000-0000-000000000100	1042f581-118c-4ab8-b6a8-f05f957190f2	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #1042f581-118c-4ab8-b6a8-f05f957190f2	{"status": "OPEN", "orderId": "1042f581-118c-4ab8-b6a8-f05f957190f2", "event_type": "order_delayed", "description": "Pedido #1042f581-118c-4ab8-b6a8-f05f957190f2 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.681238+00	\N	\N	2026-02-03 20:30:52.681238+00	t	order_delayed
69dc0316-95b4-4e50-93ef-a322f3036a21	00000000-0000-0000-0000-000000000100	00fc8099-517c-4cfc-b163-08fddfe5f331	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #00fc8099-517c-4cfc-b163-08fddfe5f331	{"status": "OPEN", "orderId": "00fc8099-517c-4cfc-b163-08fddfe5f331", "event_type": "order_delayed", "description": "Pedido #00fc8099-517c-4cfc-b163-08fddfe5f331 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:53.922145+00	\N	\N	2026-02-03 20:30:53.922145+00	t	order_delayed
feeb0b82-7774-42ee-a65f-36c34e1984e3	00000000-0000-0000-0000-000000000100	13188c5b-3668-4dc6-979b-dc8aa7042e7a	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #13188c5b-3668-4dc6-979b-dc8aa7042e7a	{"status": "OPEN", "orderId": "13188c5b-3668-4dc6-979b-dc8aa7042e7a", "event_type": "order_delayed", "description": "Pedido #13188c5b-3668-4dc6-979b-dc8aa7042e7a está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.182643+00	\N	\N	2026-02-03 20:30:54.182643+00	t	order_delayed
423f5cc6-5fde-4f58-9302-c44ce95509d1	00000000-0000-0000-0000-000000000100	e3d2b116-f55b-4418-a4b2-8265625de912	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #e3d2b116-f55b-4418-a4b2-8265625de912	{"status": "OPEN", "orderId": "e3d2b116-f55b-4418-a4b2-8265625de912", "event_type": "order_delayed", "description": "Pedido #e3d2b116-f55b-4418-a4b2-8265625de912 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:54.22185+00	\N	\N	2026-02-03 20:30:54.22185+00	t	order_delayed
351a6e4d-49ca-4604-b595-704b900d0020	00000000-0000-0000-0000-000000000100	f31ea4dc-8359-4ba5-bd10-65d67c6da781	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #f31ea4dc-8359-4ba5-bd10-65d67c6da781	{"status": "OPEN", "orderId": "f31ea4dc-8359-4ba5-bd10-65d67c6da781", "event_type": "order_delayed", "description": "Pedido #f31ea4dc-8359-4ba5-bd10-65d67c6da781 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.398987+00	\N	\N	2026-02-03 20:30:54.398987+00	t	order_delayed
6b8a1ffb-1651-4dcf-b2dd-6e4cbf6c4e26	00000000-0000-0000-0000-000000000100	d062820f-3fca-4fdc-af17-a931dd5ec2cd	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #d062820f-3fca-4fdc-af17-a931dd5ec2cd	{"status": "OPEN", "orderId": "d062820f-3fca-4fdc-af17-a931dd5ec2cd", "event_type": "order_delayed", "description": "Pedido #d062820f-3fca-4fdc-af17-a931dd5ec2cd está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.578561+00	\N	\N	2026-02-03 20:30:54.578561+00	t	order_delayed
aa70a1e0-2362-4939-82d2-6690a1bf66ec	00000000-0000-0000-0000-000000000100	70aa63a8-5c9c-4a61-9f8c-9fd79d75347f	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #70aa63a8-5c9c-4a61-9f8c-9fd79d75347f	{"status": "OPEN", "orderId": "70aa63a8-5c9c-4a61-9f8c-9fd79d75347f", "event_type": "order_delayed", "description": "Pedido #70aa63a8-5c9c-4a61-9f8c-9fd79d75347f está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:51.724027+00	\N	\N	2026-02-03 20:30:51.724027+00	t	order_delayed
eedd5297-c343-4139-a106-faae0f21c1d7	00000000-0000-0000-0000-000000000100	9eeed760-ac93-4c8a-b3db-50d45abb074e	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #9eeed760-ac93-4c8a-b3db-50d45abb074e	{"status": "OPEN", "orderId": "9eeed760-ac93-4c8a-b3db-50d45abb074e", "event_type": "order_delayed", "description": "Pedido #9eeed760-ac93-4c8a-b3db-50d45abb074e está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.150663+00	\N	\N	2026-02-03 20:30:52.150663+00	t	order_delayed
c3b6f37e-6ab4-4403-ac8d-db152287298f	00000000-0000-0000-0000-000000000100	01a4f9be-ca7c-424b-88cc-33d8ff533cd0	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #01a4f9be-ca7c-424b-88cc-33d8ff533cd0	{"status": "OPEN", "orderId": "01a4f9be-ca7c-424b-88cc-33d8ff533cd0", "event_type": "order_delayed", "description": "Pedido #01a4f9be-ca7c-424b-88cc-33d8ff533cd0 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.385061+00	\N	\N	2026-02-03 20:30:52.385061+00	t	order_delayed
7f8e2e0d-d3bc-465b-85c4-ccc96011bceb	00000000-0000-0000-0000-000000000100	5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8	{"status": "OPEN", "orderId": "5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8", "event_type": "order_delayed", "description": "Pedido #5114f1a6-d4fd-4a4a-ac7a-4928a4f186d8 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.430042+00	\N	\N	2026-02-03 20:30:52.430042+00	t	order_delayed
6746a74c-86b1-498a-aa13-b30bbd370fbd	00000000-0000-0000-0000-000000000100	9ca93181-edee-422a-bbbf-6e86f18237f7	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #9ca93181-edee-422a-bbbf-6e86f18237f7	{"status": "OPEN", "orderId": "9ca93181-edee-422a-bbbf-6e86f18237f7", "event_type": "order_delayed", "description": "Pedido #9ca93181-edee-422a-bbbf-6e86f18237f7 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.449445+00	\N	\N	2026-02-03 20:30:52.449445+00	t	order_delayed
52fd8f5f-ac90-42fd-8874-6f05ef68d5ef	00000000-0000-0000-0000-000000000100	b23e7dd8-9fa7-4181-b872-f65835d0ab70	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #b23e7dd8-9fa7-4181-b872-f65835d0ab70	{"status": "OPEN", "orderId": "b23e7dd8-9fa7-4181-b872-f65835d0ab70", "event_type": "order_delayed", "description": "Pedido #b23e7dd8-9fa7-4181-b872-f65835d0ab70 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.474095+00	\N	\N	2026-02-03 20:30:52.474095+00	t	order_delayed
fb45f340-a783-4bea-8216-2cf065c91b7e	00000000-0000-0000-0000-000000000100	58f4b1cf-9671-40b4-b556-6fc7bf91f180	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #58f4b1cf-9671-40b4-b556-6fc7bf91f180	{"status": "OPEN", "orderId": "58f4b1cf-9671-40b4-b556-6fc7bf91f180", "event_type": "order_delayed", "description": "Pedido #58f4b1cf-9671-40b4-b556-6fc7bf91f180 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.513531+00	\N	\N	2026-02-03 20:30:52.513531+00	t	order_delayed
a2dc1e9e-d06c-4584-ad53-7d787fe36534	00000000-0000-0000-0000-000000000100	018ec00c-e457-4cf3-8602-d56bbe54b8b0	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #018ec00c-e457-4cf3-8602-d56bbe54b8b0	{"status": "OPEN", "orderId": "018ec00c-e457-4cf3-8602-d56bbe54b8b0", "event_type": "order_delayed", "description": "Pedido #018ec00c-e457-4cf3-8602-d56bbe54b8b0 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.528526+00	\N	\N	2026-02-03 20:30:52.528526+00	t	order_delayed
643b24c5-b73c-49a5-909b-5f1e4c9e4f71	00000000-0000-0000-0000-000000000100	2a442be9-44b2-4826-a2c1-bd4f0821e082	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #2a442be9-44b2-4826-a2c1-bd4f0821e082	{"status": "OPEN", "orderId": "2a442be9-44b2-4826-a2c1-bd4f0821e082", "event_type": "order_delayed", "description": "Pedido #2a442be9-44b2-4826-a2c1-bd4f0821e082 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.572166+00	\N	\N	2026-02-03 20:30:52.572166+00	t	order_delayed
cc839a90-27a6-4746-ae51-00d74cc8e5d9	00000000-0000-0000-0000-000000000100	6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29	{"status": "OPEN", "orderId": "6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29", "event_type": "order_delayed", "description": "Pedido #6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.742872+00	\N	\N	2026-02-03 20:30:52.742872+00	t	order_delayed
1d1286a8-9b48-4de3-97b6-75b2caeacbc2	00000000-0000-0000-0000-000000000100	00fc8099-517c-4cfc-b163-08fddfe5f331	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #00fc8099-517c-4cfc-b163-08fddfe5f331	{"status": "OPEN", "orderId": "00fc8099-517c-4cfc-b163-08fddfe5f331", "event_type": "order_delayed", "description": "Pedido #00fc8099-517c-4cfc-b163-08fddfe5f331 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:53.141601+00	\N	\N	2026-02-03 20:30:53.141601+00	t	order_delayed
89d61e01-0769-468a-be2c-0b9fade693b2	00000000-0000-0000-0000-000000000100	13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	{"status": "OPEN", "orderId": "13e44a7f-b1bb-49ee-af5e-b28ff82bbc47", "event_type": "order_delayed", "description": "Pedido #13e44a7f-b1bb-49ee-af5e-b28ff82bbc47 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:54.102456+00	\N	\N	2026-02-03 20:30:54.102456+00	t	order_delayed
eb266742-0268-4e01-b08d-188e6fe02d18	00000000-0000-0000-0000-000000000100	13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #13e44a7f-b1bb-49ee-af5e-b28ff82bbc47	{"status": "OPEN", "orderId": "13e44a7f-b1bb-49ee-af5e-b28ff82bbc47", "event_type": "order_delayed", "description": "Pedido #13e44a7f-b1bb-49ee-af5e-b28ff82bbc47 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:54.113035+00	\N	\N	2026-02-03 20:30:54.113035+00	t	order_delayed
8e6d9358-fbe3-40e9-996a-8674da752e64	00000000-0000-0000-0000-000000000100	0d4fe61c-45ac-4d32-a949-73d8f92f5d47	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #0d4fe61c-45ac-4d32-a949-73d8f92f5d47	{"status": "OPEN", "orderId": "0d4fe61c-45ac-4d32-a949-73d8f92f5d47", "event_type": "order_delayed", "description": "Pedido #0d4fe61c-45ac-4d32-a949-73d8f92f5d47 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.161377+00	\N	\N	2026-02-03 20:30:54.161377+00	t	order_delayed
cad3249a-572c-49be-9fda-56594843597d	00000000-0000-0000-0000-000000000100	0d4fe61c-45ac-4d32-a949-73d8f92f5d47	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #0d4fe61c-45ac-4d32-a949-73d8f92f5d47	{"status": "OPEN", "orderId": "0d4fe61c-45ac-4d32-a949-73d8f92f5d47", "event_type": "order_delayed", "description": "Pedido #0d4fe61c-45ac-4d32-a949-73d8f92f5d47 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:54.171807+00	\N	\N	2026-02-03 20:30:54.171807+00	t	order_delayed
2b878b76-d5ad-452b-adaa-b504ffc9cea2	00000000-0000-0000-0000-000000000100	8cd0a812-8e6d-4ba9-bad7-bb4573c21529	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #8cd0a812-8e6d-4ba9-bad7-bb4573c21529	{"status": "OPEN", "orderId": "8cd0a812-8e6d-4ba9-bad7-bb4573c21529", "event_type": "order_delayed", "description": "Pedido #8cd0a812-8e6d-4ba9-bad7-bb4573c21529 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.239497+00	\N	\N	2026-02-03 20:30:54.239497+00	t	order_delayed
d117af82-3962-44be-aa06-6f76fad55223	00000000-0000-0000-0000-000000000100	151989f6-502a-431d-bd67-b8fd2734768a	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #151989f6-502a-431d-bd67-b8fd2734768a	{"status": "OPEN", "orderId": "151989f6-502a-431d-bd67-b8fd2734768a", "event_type": "order_delayed", "description": "Pedido #151989f6-502a-431d-bd67-b8fd2734768a está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.257754+00	\N	\N	2026-02-03 20:30:54.257754+00	t	order_delayed
205184f7-3f40-4ba3-a97d-0df51082951c	00000000-0000-0000-0000-000000000100	036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #036a1de3-8b67-4cfa-9bf7-20f9a1b746cd	{"status": "OPEN", "orderId": "036a1de3-8b67-4cfa-9bf7-20f9a1b746cd", "event_type": "order_delayed", "description": "Pedido #036a1de3-8b67-4cfa-9bf7-20f9a1b746cd está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.412692+00	\N	\N	2026-02-03 20:30:52.412692+00	t	order_delayed
fcb0d70b-ed6b-4578-836e-a3d143db56ea	00000000-0000-0000-0000-000000000100	9ca93181-edee-422a-bbbf-6e86f18237f7	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #9ca93181-edee-422a-bbbf-6e86f18237f7	{"status": "OPEN", "orderId": "9ca93181-edee-422a-bbbf-6e86f18237f7", "event_type": "order_delayed", "description": "Pedido #9ca93181-edee-422a-bbbf-6e86f18237f7 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 74}	OPEN	\N	2026-02-03 20:30:52.456593+00	\N	\N	2026-02-03 20:30:52.456593+00	t	order_delayed
651e9aa6-944b-4625-bc72-117729f93723	00000000-0000-0000-0000-000000000100	2a442be9-44b2-4826-a2c1-bd4f0821e082	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #2a442be9-44b2-4826-a2c1-bd4f0821e082	{"status": "OPEN", "orderId": "2a442be9-44b2-4826-a2c1-bd4f0821e082", "event_type": "order_delayed", "description": "Pedido #2a442be9-44b2-4826-a2c1-bd4f0821e082 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.564133+00	\N	\N	2026-02-03 20:30:52.564133+00	t	order_delayed
5c9d5386-bc3d-4b8b-acdc-5ec28c14a56e	00000000-0000-0000-0000-000000000100	c5210f26-04a4-42fe-8574-64699496fbee	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #c5210f26-04a4-42fe-8574-64699496fbee	{"status": "OPEN", "orderId": "c5210f26-04a4-42fe-8574-64699496fbee", "event_type": "order_delayed", "description": "Pedido #c5210f26-04a4-42fe-8574-64699496fbee está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.594915+00	\N	\N	2026-02-03 20:30:52.594915+00	t	order_delayed
0cc8593b-409e-418c-a496-6ed30af4628f	00000000-0000-0000-0000-000000000100	88b59fa5-4683-474f-8ff9-9c4e25232f4f	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #88b59fa5-4683-474f-8ff9-9c4e25232f4f	{"status": "OPEN", "orderId": "88b59fa5-4683-474f-8ff9-9c4e25232f4f", "event_type": "order_delayed", "description": "Pedido #88b59fa5-4683-474f-8ff9-9c4e25232f4f está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.6216+00	\N	\N	2026-02-03 20:30:52.6216+00	t	order_delayed
0c9f1a1b-9187-48e0-a1d5-5a16c9afa3d0	00000000-0000-0000-0000-000000000100	6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29	{"status": "OPEN", "orderId": "6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29", "event_type": "order_delayed", "description": "Pedido #6d8d899d-ef8e-4a9c-9aeb-ca50a12b7c29 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:52.708425+00	\N	\N	2026-02-03 20:30:52.708425+00	t	order_delayed
efcfadc2-03e7-4afc-97aa-d2c1b35e57a5	00000000-0000-0000-0000-000000000100	b32c8d1f-89a2-484f-ba30-ec54cd99793d	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #b32c8d1f-89a2-484f-ba30-ec54cd99793d	{"status": "OPEN", "orderId": "b32c8d1f-89a2-484f-ba30-ec54cd99793d", "event_type": "order_delayed", "description": "Pedido #b32c8d1f-89a2-484f-ba30-ec54cd99793d está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:54.064317+00	\N	\N	2026-02-03 20:30:54.064317+00	t	order_delayed
2d5a2ced-9090-494b-82a4-526b1770f5fd	00000000-0000-0000-0000-000000000100	4635ab66-2c92-47eb-8e33-470ec7225a60	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #4635ab66-2c92-47eb-8e33-470ec7225a60	{"status": "OPEN", "orderId": "4635ab66-2c92-47eb-8e33-470ec7225a60", "event_type": "order_delayed", "description": "Pedido #4635ab66-2c92-47eb-8e33-470ec7225a60 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 75}	OPEN	\N	2026-02-03 20:30:54.128624+00	\N	\N	2026-02-03 20:30:54.128624+00	t	order_delayed
b5280a29-c10d-4b3c-9603-116034a5ab65	00000000-0000-0000-0000-000000000100	13188c5b-3668-4dc6-979b-dc8aa7042e7a	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #13188c5b-3668-4dc6-979b-dc8aa7042e7a	{"status": "OPEN", "orderId": "13188c5b-3668-4dc6-979b-dc8aa7042e7a", "event_type": "order_delayed", "description": "Pedido #13188c5b-3668-4dc6-979b-dc8aa7042e7a está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.191463+00	\N	\N	2026-02-03 20:30:54.191463+00	t	order_delayed
d1ac3984-8312-43d8-95f9-beed1d1ae4ae	00000000-0000-0000-0000-000000000100	23dfd8f5-95c7-4b0e-b6bc-44df1de94472	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #23dfd8f5-95c7-4b0e-b6bc-44df1de94472	{"status": "OPEN", "orderId": "23dfd8f5-95c7-4b0e-b6bc-44df1de94472", "event_type": "order_delayed", "description": "Pedido #23dfd8f5-95c7-4b0e-b6bc-44df1de94472 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.209533+00	\N	\N	2026-02-03 20:30:54.209533+00	t	order_delayed
6634323e-6a13-4d0a-9d8d-fd573a05af68	00000000-0000-0000-0000-000000000100	65a0b643-3c24-4865-9e20-63d0dbeff3ad	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #65a0b643-3c24-4865-9e20-63d0dbeff3ad	{"status": "OPEN", "orderId": "65a0b643-3c24-4865-9e20-63d0dbeff3ad", "event_type": "order_delayed", "description": "Pedido #65a0b643-3c24-4865-9e20-63d0dbeff3ad está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.311478+00	\N	\N	2026-02-03 20:30:54.311478+00	t	order_delayed
46ee51ea-8c70-4f5e-86db-c9fc70464847	00000000-0000-0000-0000-000000000100	f08b7f49-0fb3-4392-8fc2-02ac42973010	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #f08b7f49-0fb3-4392-8fc2-02ac42973010	{"status": "OPEN", "orderId": "f08b7f49-0fb3-4392-8fc2-02ac42973010", "event_type": "order_delayed", "description": "Pedido #f08b7f49-0fb3-4392-8fc2-02ac42973010 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.348838+00	\N	\N	2026-02-03 20:30:54.348838+00	t	order_delayed
09f448fc-73e1-4535-a577-a3f4c8a84a51	00000000-0000-0000-0000-000000000100	d062820f-3fca-4fdc-af17-a931dd5ec2cd	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #d062820f-3fca-4fdc-af17-a931dd5ec2cd	{"status": "OPEN", "orderId": "d062820f-3fca-4fdc-af17-a931dd5ec2cd", "event_type": "order_delayed", "description": "Pedido #d062820f-3fca-4fdc-af17-a931dd5ec2cd está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.536019+00	\N	\N	2026-02-03 20:30:54.536019+00	t	order_delayed
573752a2-08ba-43ab-abb3-851d167c3833	00000000-0000-0000-0000-000000000100	151989f6-502a-431d-bd67-b8fd2734768a	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #151989f6-502a-431d-bd67-b8fd2734768a	{"status": "OPEN", "orderId": "151989f6-502a-431d-bd67-b8fd2734768a", "event_type": "order_delayed", "description": "Pedido #151989f6-502a-431d-bd67-b8fd2734768a está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.265839+00	\N	\N	2026-02-03 20:30:54.265839+00	t	order_delayed
da9c1632-e988-401e-8314-36c9eff3fcb3	00000000-0000-0000-0000-000000000100	270afa45-b207-47fe-8821-c83023bc7b5b	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #270afa45-b207-47fe-8821-c83023bc7b5b	{"status": "OPEN", "orderId": "270afa45-b207-47fe-8821-c83023bc7b5b", "event_type": "order_delayed", "description": "Pedido #270afa45-b207-47fe-8821-c83023bc7b5b está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.365461+00	\N	\N	2026-02-03 20:30:54.365461+00	t	order_delayed
cb779048-1071-42b8-8c72-16f634648fb7	00000000-0000-0000-0000-000000000100	f31ea4dc-8359-4ba5-bd10-65d67c6da781	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #f31ea4dc-8359-4ba5-bd10-65d67c6da781	{"status": "OPEN", "orderId": "f31ea4dc-8359-4ba5-bd10-65d67c6da781", "event_type": "order_delayed", "description": "Pedido #f31ea4dc-8359-4ba5-bd10-65d67c6da781 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.411053+00	\N	\N	2026-02-03 20:30:54.411053+00	t	order_delayed
045c9e7c-9686-4e08-9e7d-3ecce6b0555c	00000000-0000-0000-0000-000000000100	4066df79-ebff-4785-a3fb-0644f82cb6d2	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #4066df79-ebff-4785-a3fb-0644f82cb6d2	{"status": "OPEN", "orderId": "4066df79-ebff-4785-a3fb-0644f82cb6d2", "event_type": "order_delayed", "description": "Pedido #4066df79-ebff-4785-a3fb-0644f82cb6d2 está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:54.296457+00	\N	\N	2026-02-03 20:30:54.296457+00	t	order_delayed
74684b70-dee4-430c-a9d0-76d61252d00a	00000000-0000-0000-0000-000000000100	9bc7b283-75d4-4111-8b7a-1e5fe893f5cf	\N	ATRASO_ITEM	\N	ALTA	Pedido atrasado #9bc7b283-75d4-4111-8b7a-1e5fe893f5cf	{"status": "OPEN", "orderId": "9bc7b283-75d4-4111-8b7a-1e5fe893f5cf", "event_type": "order_delayed", "description": "Pedido #9bc7b283-75d4-4111-8b7a-1e5fe893f5cf está atrasado. Verificar status e tomar ação.", "tableNumber": null, "delayMinutes": 76}	OPEN	\N	2026-02-03 20:30:55.380815+00	\N	\N	2026-02-03 20:30:55.380815+00	t	order_delayed
72a81872-bc14-40f5-ac83-a550ad390e0c	9ad697ab-183d-4ecf-813a-01e122bf1adc	5e9b9416-446f-4280-a237-ca833bdf200f	\N	PEDIDO_NOVO	\N	ALTA	Preparar pedido #5e9b9416-446f-4280-a237-ca833bdf200f	{"orderId": "5e9b9416-446f-4280-a237-ca833bdf200f", "event_type": "order_created", "description": "Novo pedido criado. Mesa —. Preparar e entregar.", "orderNumber": "5e9b9416-446f-4280-a237-ca833bdf200f", "tableNumber": null}	OPEN	\N	2026-02-03 20:41:07.671283+00	\N	\N	2026-02-03 20:41:07.671283+00	t	order_created
c69f2411-d737-4f1d-8273-76fd7728b830	9ad697ab-183d-4ecf-813a-01e122bf1adc	\N	\N	MODO_INTERNO	\N	MEDIA	Restaurante em modo interno — checklist e organização	{"event_type": "restaurant_idle", "description": "Modo interno: sem pedidos ativos há 15 min. Aproveitar para checklist do turno, limpeza, organização ou preparação.", "shiftOpenAt": "2026-02-03T20:41:01.836Z", "minutesSinceLastOrder": 15}	OPEN	\N	2026-02-03 20:56:10.748009+00	\N	\N	2026-02-03 20:56:10.748009+00	t	restaurant_idle
\.


--
-- Data for Name: installed_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.installed_modules (id, restaurant_id, module_id, module_name, version, installed_at, updated_at, status, config, dependencies, metadata) FROM stdin;
e6557f6c-9870-4f23-afde-bf53d03cc76b	00000000-0000-0000-0000-000000000100	tpv	TPV (Point of Sale)	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
da0083af-1503-4a8b-b1b5-13a6ffed3209	00000000-0000-0000-0000-000000000100	kds	KDS (Kitchen Display)	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
2b683c70-addf-4ee2-a2da-9a55e145609b	00000000-0000-0000-0000-000000000100	tasks	Tarefas	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
fbeebaa8-1ff0-4fd3-98be-2bb4c308beec	00000000-0000-0000-0000-000000000100	appstaff	AppStaff	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
d5e57753-8861-4e42-9d79-62725c045810	00000000-0000-0000-0000-000000000100	health	Saúde	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
aae71253-c2ec-4b16-9652-0b59baf5fd9d	00000000-0000-0000-0000-000000000100	alerts	Alertas	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
43f80695-afe1-4573-adac-077b2b22608a	00000000-0000-0000-0000-000000000100	config	Configurar restaurante	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
32d0fa4d-5b74-4cbe-857d-0ea898e85d48	00000000-0000-0000-0000-000000000100	dashboard	Dashboard	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
5706d76d-bd90-4f1c-81fb-245690bd7936	00000000-0000-0000-0000-000000000100	restaurant-web	Presença Online	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
715a9a77-d709-4198-9e35-e89fbcaf1f8a	00000000-0000-0000-0000-000000000100	menu	Cardápio	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
0a623667-a010-43be-9647-e5a7f35ac0a2	00000000-0000-0000-0000-000000000100	system-tree	Entender o sistema	1.0.0	2026-02-03 13:40:42.535492+00	2026-02-03 13:40:42.535492+00	active	{}	{}	{}
\.


--
-- Data for Name: legal_seals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.legal_seals (seal_id, entity_type, entity_id, legal_state, seal_event_id, stream_hash, financial_state_snapshot, sealed_at, legal_sequence_id) FROM stdin;
\.


--
-- Data for Name: module_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.module_permissions (id, restaurant_id, module_id, role, permissions, created_at) FROM stdin;
\.


--
-- Data for Name: restaurant_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.restaurant_schedules (id, restaurant_id, day_of_week, open, start_time, end_time, created_at, updated_at) FROM stdin;
4421aa71-4ce2-450d-954a-e4a50f5c89c4	00000000-0000-0000-0000-000000000100	1	t	09:00:00	22:00:00	2026-02-03 13:40:42.536999+00	2026-02-03 13:40:42.536999+00
d9a414b4-7d60-4cca-a11a-de623c00c139	00000000-0000-0000-0000-000000000100	2	t	09:00:00	22:00:00	2026-02-03 13:40:42.536999+00	2026-02-03 13:40:42.536999+00
74b8b3f8-a11f-4d1c-a379-8b558a182d13	00000000-0000-0000-0000-000000000100	3	t	09:00:00	22:00:00	2026-02-03 13:40:42.536999+00	2026-02-03 13:40:42.536999+00
8b9ec248-62ae-4b5a-895a-8829766b4566	00000000-0000-0000-0000-000000000100	4	t	09:00:00	22:00:00	2026-02-03 13:40:42.536999+00	2026-02-03 13:40:42.536999+00
11c77125-892c-4ee2-a5e1-293c326a60fd	00000000-0000-0000-0000-000000000100	5	t	09:00:00	22:00:00	2026-02-03 13:40:42.536999+00	2026-02-03 13:40:42.536999+00
762b815c-88e2-4eee-a4d4-3fd74764fed1	00000000-0000-0000-0000-000000000100	6	t	09:00:00	22:00:00	2026-02-03 13:40:42.536999+00	2026-02-03 13:40:42.536999+00
8bf2071a-d1d9-42b0-877e-ee1e683aeb3f	00000000-0000-0000-0000-000000000100	0	f	00:00:00	00:00:00	2026-02-03 13:40:42.537909+00	2026-02-03 13:40:42.537909+00
\.


--
-- Data for Name: restaurant_setup_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.restaurant_setup_status (restaurant_id, sections, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000100	{"menu": true, "people": true, "publish": true, "identity": false, "location": true, "payments": true, "schedule": true}	2026-02-03 15:42:00.009+00
9ad697ab-183d-4ecf-813a-01e122bf1adc	{"menu": true, "people": true, "publish": true, "identity": false, "location": true, "payments": true, "schedule": true}	2026-02-03 21:03:26.119+00
\.


--
-- Data for Name: restaurant_zones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.restaurant_zones (id, restaurant_id, name, type, created_at) FROM stdin;
\.


--
-- Data for Name: saas_tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saas_tenants (id, name, slug, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	Tenant Dev	tenant-dev	2026-02-03 13:40:42.371763+00	2026-02-03 13:40:42.371763+00
\.


--
-- Name: event_store_sequence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_store_sequence_id_seq', 1, false);


--
-- Name: legal_seals_legal_sequence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.legal_seals_legal_sequence_id_seq', 1, false);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: postgres
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: postgres
--

ALTER TABLE ONLY _realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: postgres
--

ALTER TABLE ONLY _realtime.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: billing_configs billing_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_configs
    ADD CONSTRAINT billing_configs_pkey PRIMARY KEY (id);


--
-- Name: billing_configs billing_configs_restaurant_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_configs
    ADD CONSTRAINT billing_configs_restaurant_id_provider_key UNIQUE (restaurant_id, provider);


--
-- Name: event_store event_store_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_store
    ADD CONSTRAINT event_store_pkey PRIMARY KEY (event_id);


--
-- Name: event_store event_store_stream_type_stream_id_stream_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_store
    ADD CONSTRAINT event_store_stream_type_stream_id_stream_version_key UNIQUE (stream_type, stream_id, stream_version);


--
-- Name: gm_cash_registers gm_cash_registers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_cash_registers
    ADD CONSTRAINT gm_cash_registers_pkey PRIMARY KEY (id);


--
-- Name: gm_equipment gm_equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_equipment
    ADD CONSTRAINT gm_equipment_pkey PRIMARY KEY (id);


--
-- Name: gm_equipment gm_equipment_restaurant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_equipment
    ADD CONSTRAINT gm_equipment_restaurant_id_name_key UNIQUE (restaurant_id, name);


--
-- Name: gm_ingredients gm_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_ingredients
    ADD CONSTRAINT gm_ingredients_pkey PRIMARY KEY (id);


--
-- Name: gm_ingredients gm_ingredients_restaurant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_ingredients
    ADD CONSTRAINT gm_ingredients_restaurant_id_name_key UNIQUE (restaurant_id, name);


--
-- Name: gm_locations gm_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_locations
    ADD CONSTRAINT gm_locations_pkey PRIMARY KEY (id);


--
-- Name: gm_locations gm_locations_restaurant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_locations
    ADD CONSTRAINT gm_locations_restaurant_id_name_key UNIQUE (restaurant_id, name);


--
-- Name: gm_menu_categories gm_menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_menu_categories
    ADD CONSTRAINT gm_menu_categories_pkey PRIMARY KEY (id);


--
-- Name: gm_order_items gm_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_order_items
    ADD CONSTRAINT gm_order_items_pkey PRIMARY KEY (id);


--
-- Name: gm_orders gm_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_orders
    ADD CONSTRAINT gm_orders_pkey PRIMARY KEY (id);


--
-- Name: gm_payment_audit_logs gm_payment_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_payment_audit_logs
    ADD CONSTRAINT gm_payment_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: gm_payments gm_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_payments
    ADD CONSTRAINT gm_payments_pkey PRIMARY KEY (id);


--
-- Name: gm_product_bom gm_product_bom_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_product_bom
    ADD CONSTRAINT gm_product_bom_pkey PRIMARY KEY (id);


--
-- Name: gm_product_bom gm_product_bom_restaurant_id_product_id_ingredient_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_product_bom
    ADD CONSTRAINT gm_product_bom_restaurant_id_product_id_ingredient_id_key UNIQUE (restaurant_id, product_id, ingredient_id);


--
-- Name: gm_products gm_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_products
    ADD CONSTRAINT gm_products_pkey PRIMARY KEY (id);


--
-- Name: gm_restaurant_members gm_restaurant_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_restaurant_members
    ADD CONSTRAINT gm_restaurant_members_pkey PRIMARY KEY (id);


--
-- Name: gm_restaurants gm_restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_restaurants
    ADD CONSTRAINT gm_restaurants_pkey PRIMARY KEY (id);


--
-- Name: gm_restaurants gm_restaurants_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_restaurants
    ADD CONSTRAINT gm_restaurants_slug_key UNIQUE (slug);


--
-- Name: gm_stock_ledger gm_stock_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_ledger
    ADD CONSTRAINT gm_stock_ledger_pkey PRIMARY KEY (id);


--
-- Name: gm_stock_levels gm_stock_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_levels
    ADD CONSTRAINT gm_stock_levels_pkey PRIMARY KEY (id);


--
-- Name: gm_stock_levels gm_stock_levels_restaurant_id_location_id_ingredient_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_levels
    ADD CONSTRAINT gm_stock_levels_restaurant_id_location_id_ingredient_id_key UNIQUE (restaurant_id, location_id, ingredient_id);


--
-- Name: gm_tables gm_tables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_tables
    ADD CONSTRAINT gm_tables_pkey PRIMARY KEY (id);


--
-- Name: gm_tables gm_tables_restaurant_id_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_tables
    ADD CONSTRAINT gm_tables_restaurant_id_number_key UNIQUE (restaurant_id, number);


--
-- Name: gm_tasks gm_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_tasks
    ADD CONSTRAINT gm_tasks_pkey PRIMARY KEY (id);


--
-- Name: installed_modules installed_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.installed_modules
    ADD CONSTRAINT installed_modules_pkey PRIMARY KEY (id);


--
-- Name: installed_modules installed_modules_restaurant_id_module_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.installed_modules
    ADD CONSTRAINT installed_modules_restaurant_id_module_id_key UNIQUE (restaurant_id, module_id);


--
-- Name: legal_seals legal_seals_entity_type_entity_id_legal_state_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_seals
    ADD CONSTRAINT legal_seals_entity_type_entity_id_legal_state_key UNIQUE (entity_type, entity_id, legal_state);


--
-- Name: legal_seals legal_seals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_seals
    ADD CONSTRAINT legal_seals_pkey PRIMARY KEY (seal_id);


--
-- Name: module_permissions module_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_permissions
    ADD CONSTRAINT module_permissions_pkey PRIMARY KEY (id);


--
-- Name: module_permissions module_permissions_restaurant_id_module_id_role_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_permissions
    ADD CONSTRAINT module_permissions_restaurant_id_module_id_role_key UNIQUE (restaurant_id, module_id, role);


--
-- Name: restaurant_schedules restaurant_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_schedules
    ADD CONSTRAINT restaurant_schedules_pkey PRIMARY KEY (id);


--
-- Name: restaurant_schedules restaurant_schedules_restaurant_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_schedules
    ADD CONSTRAINT restaurant_schedules_restaurant_id_day_of_week_key UNIQUE (restaurant_id, day_of_week);


--
-- Name: restaurant_setup_status restaurant_setup_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_setup_status
    ADD CONSTRAINT restaurant_setup_status_pkey PRIMARY KEY (restaurant_id);


--
-- Name: restaurant_zones restaurant_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_zones
    ADD CONSTRAINT restaurant_zones_pkey PRIMARY KEY (id);


--
-- Name: restaurant_zones restaurant_zones_restaurant_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_zones
    ADD CONSTRAINT restaurant_zones_restaurant_id_name_key UNIQUE (restaurant_id, name);


--
-- Name: saas_tenants saas_tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saas_tenants
    ADD CONSTRAINT saas_tenants_pkey PRIMARY KEY (id);


--
-- Name: saas_tenants saas_tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saas_tenants
    ADD CONSTRAINT saas_tenants_slug_key UNIQUE (slug);


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: postgres
--

CREATE INDEX extensions_tenant_external_id_index ON _realtime.extensions USING btree (tenant_external_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: postgres
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON _realtime.extensions USING btree (tenant_external_id, type);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: postgres
--

CREATE UNIQUE INDEX tenants_external_id_index ON _realtime.tenants USING btree (external_id);


--
-- Name: idx_billing_configs_restaurant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_billing_configs_restaurant_id ON public.billing_configs USING btree (restaurant_id);


--
-- Name: idx_bom_ingredient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bom_ingredient ON public.gm_product_bom USING btree (ingredient_id);


--
-- Name: idx_bom_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bom_product ON public.gm_product_bom USING btree (product_id);


--
-- Name: idx_bom_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bom_restaurant ON public.gm_product_bom USING btree (restaurant_id);


--
-- Name: idx_equipment_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipment_location ON public.gm_equipment USING btree (location_id) WHERE (location_id IS NOT NULL);


--
-- Name: idx_equipment_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_equipment_restaurant ON public.gm_equipment USING btree (restaurant_id);


--
-- Name: idx_event_store_idempotency; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_event_store_idempotency ON public.event_store USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: idx_event_store_stream; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_store_stream ON public.event_store USING btree (stream_type, stream_id);


--
-- Name: idx_gm_cash_registers_one_open; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_gm_cash_registers_one_open ON public.gm_cash_registers USING btree (restaurant_id) WHERE (status = 'open'::text);


--
-- Name: idx_gm_payments_idempotency; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_gm_payments_idempotency ON public.gm_payments USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: idx_gm_restaurant_members_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gm_restaurant_members_restaurant ON public.gm_restaurant_members USING btree (restaurant_id);


--
-- Name: idx_gm_restaurant_members_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gm_restaurant_members_user ON public.gm_restaurant_members USING btree (user_id);


--
-- Name: idx_ingredients_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ingredients_restaurant ON public.gm_ingredients USING btree (restaurant_id);


--
-- Name: idx_installed_modules_module_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_installed_modules_module_id ON public.installed_modules USING btree (module_id);


--
-- Name: idx_installed_modules_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_installed_modules_restaurant ON public.installed_modules USING btree (restaurant_id);


--
-- Name: idx_installed_modules_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_installed_modules_status ON public.installed_modules USING btree (status);


--
-- Name: idx_ledger_ingredient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_ingredient ON public.gm_stock_ledger USING btree (ingredient_id);


--
-- Name: idx_ledger_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_location ON public.gm_stock_ledger USING btree (location_id);


--
-- Name: idx_ledger_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_order ON public.gm_stock_ledger USING btree (order_id) WHERE (order_id IS NOT NULL);


--
-- Name: idx_ledger_restaurant_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_restaurant_time ON public.gm_stock_ledger USING btree (restaurant_id, created_at DESC);


--
-- Name: idx_legal_seals_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_legal_seals_entity ON public.legal_seals USING btree (entity_type, entity_id);


--
-- Name: idx_locations_kind; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_kind ON public.gm_locations USING btree (restaurant_id, kind);


--
-- Name: idx_locations_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_locations_restaurant ON public.gm_locations USING btree (restaurant_id);


--
-- Name: idx_module_permissions_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_module_permissions_module ON public.module_permissions USING btree (module_id);


--
-- Name: idx_module_permissions_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_module_permissions_restaurant ON public.module_permissions USING btree (restaurant_id);


--
-- Name: idx_one_open_order_per_table; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_one_open_order_per_table ON public.gm_orders USING btree (table_id) WHERE ((status = 'OPEN'::text) AND (table_id IS NOT NULL));


--
-- Name: INDEX idx_one_open_order_per_table; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX public.idx_one_open_order_per_table IS 'Constitutional constraint: One OPEN order per table. Prevents race condition (TPV + Web simultaneous order creation).';


--
-- Name: idx_order_items_author; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_author ON public.gm_order_items USING btree (order_id, created_by_user_id, created_by_role);


--
-- Name: idx_order_items_device; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_device ON public.gm_order_items USING btree (device_id) WHERE (device_id IS NOT NULL);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.gm_order_items USING btree (order_id);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.gm_orders USING btree (created_at DESC);


--
-- Name: idx_orders_restaurant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_restaurant_status ON public.gm_orders USING btree (restaurant_id, status);


--
-- Name: idx_orders_table_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_table_id ON public.gm_orders USING btree (table_id) WHERE (table_id IS NOT NULL);


--
-- Name: idx_payment_audit_restaurant_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_audit_restaurant_date ON public.gm_payment_audit_logs USING btree (restaurant_id, created_at);


--
-- Name: idx_products_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_restaurant ON public.gm_products USING btree (restaurant_id);


--
-- Name: idx_restaurant_schedules_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurant_schedules_day ON public.restaurant_schedules USING btree (restaurant_id, day_of_week);


--
-- Name: idx_restaurant_schedules_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurant_schedules_restaurant ON public.restaurant_schedules USING btree (restaurant_id);


--
-- Name: idx_restaurant_setup_status_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurant_setup_status_restaurant ON public.restaurant_setup_status USING btree (restaurant_id);


--
-- Name: idx_restaurant_zones_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurant_zones_restaurant ON public.restaurant_zones USING btree (restaurant_id);


--
-- Name: idx_restaurant_zones_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_restaurant_zones_type ON public.restaurant_zones USING btree (restaurant_id, type);


--
-- Name: idx_stock_ingredient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_ingredient ON public.gm_stock_levels USING btree (ingredient_id);


--
-- Name: idx_stock_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_location ON public.gm_stock_levels USING btree (location_id);


--
-- Name: idx_stock_low; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_low ON public.gm_stock_levels USING btree (restaurant_id, location_id) WHERE ((qty <= min_qty) AND (min_qty > (0)::numeric));


--
-- Name: idx_stock_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_restaurant ON public.gm_stock_levels USING btree (restaurant_id);


--
-- Name: idx_tables_restaurant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tables_restaurant ON public.gm_tables USING btree (restaurant_id);


--
-- Name: idx_tasks_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_created_at ON public.gm_tasks USING btree (created_at DESC) WHERE (status = 'OPEN'::text);


--
-- Name: idx_tasks_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_order ON public.gm_tasks USING btree (order_id) WHERE (status = 'OPEN'::text);


--
-- Name: idx_tasks_order_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_order_item ON public.gm_tasks USING btree (order_item_id) WHERE (status = 'OPEN'::text);


--
-- Name: idx_tasks_restaurant_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_restaurant_status ON public.gm_tasks USING btree (restaurant_id, status);


--
-- Name: idx_tasks_station_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_station_priority ON public.gm_tasks USING btree (station, priority) WHERE (status = 'OPEN'::text);


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: postgres
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE;


--
-- Name: billing_configs billing_configs_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billing_configs
    ADD CONSTRAINT billing_configs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_cash_registers gm_cash_registers_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_cash_registers
    ADD CONSTRAINT gm_cash_registers_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_equipment gm_equipment_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_equipment
    ADD CONSTRAINT gm_equipment_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.gm_locations(id) ON DELETE SET NULL;


--
-- Name: gm_equipment gm_equipment_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_equipment
    ADD CONSTRAINT gm_equipment_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_ingredients gm_ingredients_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_ingredients
    ADD CONSTRAINT gm_ingredients_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_locations gm_locations_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_locations
    ADD CONSTRAINT gm_locations_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_menu_categories gm_menu_categories_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_menu_categories
    ADD CONSTRAINT gm_menu_categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_order_items gm_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_order_items
    ADD CONSTRAINT gm_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.gm_orders(id) ON DELETE CASCADE;


--
-- Name: gm_order_items gm_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_order_items
    ADD CONSTRAINT gm_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.gm_products(id);


--
-- Name: gm_orders gm_orders_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_orders
    ADD CONSTRAINT gm_orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_orders gm_orders_table_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_orders
    ADD CONSTRAINT gm_orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.gm_tables(id);


--
-- Name: gm_payment_audit_logs gm_payment_audit_logs_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_payment_audit_logs
    ADD CONSTRAINT gm_payment_audit_logs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_payments gm_payments_cash_register_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_payments
    ADD CONSTRAINT gm_payments_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES public.gm_cash_registers(id);


--
-- Name: gm_payments gm_payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_payments
    ADD CONSTRAINT gm_payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.gm_orders(id) ON DELETE CASCADE;


--
-- Name: gm_payments gm_payments_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_payments
    ADD CONSTRAINT gm_payments_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_product_bom gm_product_bom_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_product_bom
    ADD CONSTRAINT gm_product_bom_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.gm_ingredients(id) ON DELETE CASCADE;


--
-- Name: gm_product_bom gm_product_bom_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_product_bom
    ADD CONSTRAINT gm_product_bom_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.gm_products(id) ON DELETE CASCADE;


--
-- Name: gm_product_bom gm_product_bom_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_product_bom
    ADD CONSTRAINT gm_product_bom_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_products gm_products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_products
    ADD CONSTRAINT gm_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.gm_menu_categories(id);


--
-- Name: gm_products gm_products_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_products
    ADD CONSTRAINT gm_products_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_restaurant_members gm_restaurant_members_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_restaurant_members
    ADD CONSTRAINT gm_restaurant_members_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_restaurants gm_restaurants_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_restaurants
    ADD CONSTRAINT gm_restaurants_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.saas_tenants(id);


--
-- Name: gm_stock_ledger gm_stock_ledger_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_ledger
    ADD CONSTRAINT gm_stock_ledger_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.gm_ingredients(id) ON DELETE CASCADE;


--
-- Name: gm_stock_ledger gm_stock_ledger_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_ledger
    ADD CONSTRAINT gm_stock_ledger_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.gm_locations(id) ON DELETE CASCADE;


--
-- Name: gm_stock_ledger gm_stock_ledger_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_ledger
    ADD CONSTRAINT gm_stock_ledger_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.gm_orders(id) ON DELETE SET NULL;


--
-- Name: gm_stock_ledger gm_stock_ledger_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_ledger
    ADD CONSTRAINT gm_stock_ledger_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.gm_order_items(id) ON DELETE SET NULL;


--
-- Name: gm_stock_ledger gm_stock_ledger_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_ledger
    ADD CONSTRAINT gm_stock_ledger_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_stock_levels gm_stock_levels_ingredient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_levels
    ADD CONSTRAINT gm_stock_levels_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.gm_ingredients(id) ON DELETE CASCADE;


--
-- Name: gm_stock_levels gm_stock_levels_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_levels
    ADD CONSTRAINT gm_stock_levels_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.gm_locations(id) ON DELETE CASCADE;


--
-- Name: gm_stock_levels gm_stock_levels_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_stock_levels
    ADD CONSTRAINT gm_stock_levels_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_tables gm_tables_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_tables
    ADD CONSTRAINT gm_tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: gm_tasks gm_tasks_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_tasks
    ADD CONSTRAINT gm_tasks_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.gm_orders(id) ON DELETE CASCADE;


--
-- Name: gm_tasks gm_tasks_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_tasks
    ADD CONSTRAINT gm_tasks_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.gm_order_items(id) ON DELETE CASCADE;


--
-- Name: gm_tasks gm_tasks_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gm_tasks
    ADD CONSTRAINT gm_tasks_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: installed_modules installed_modules_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.installed_modules
    ADD CONSTRAINT installed_modules_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: module_permissions module_permissions_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.module_permissions
    ADD CONSTRAINT module_permissions_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurant_schedules restaurant_schedules_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_schedules
    ADD CONSTRAINT restaurant_schedules_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurant_setup_status restaurant_setup_status_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_setup_status
    ADD CONSTRAINT restaurant_setup_status_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurant_zones restaurant_zones_restaurant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restaurant_zones
    ADD CONSTRAINT restaurant_zones_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Kr3sT0M6wztiNIEUBOpjgrMeWIWIvuzocVkkX9KVaWHUOreerdLzoUfoBB8U3Oy

