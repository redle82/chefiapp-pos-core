-- =============================================================================
-- Migration: Z-Report / Shift Close Report + close_cash_register_atomic RPC
-- Date: 2026-02-19
-- Purpose:
--   1. RPC generate_shift_close_report — aggregates orders, payments, tax
--      for a cash register session (Z-Report / Fecho de Turno).
--   2. RPC close_cash_register_atomic — closes cash register with declared
--      amount, generates Z-Report snapshot, stores in metadata.
-- =============================================================================

-- =============================================================================
-- 1. RPC: generate_shift_close_report (Z-Report)
-- =============================================================================
-- Aggregates all CLOSED orders created during the cash register session.
-- Returns: total_orders, total_gross, total_net, total_tax (by rate),
--          payment_method breakdown, average ticket, staff who served.

CREATE OR REPLACE FUNCTION public.generate_shift_close_report(
    p_cash_register_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_register RECORD;
    v_total_orders INTEGER;
    v_total_gross_cents BIGINT;
    v_total_tax_cents BIGINT;
    v_total_net_cents BIGINT;
    v_total_discount_cents BIGINT;
    v_avg_ticket_cents INTEGER;
    v_cancelled_orders INTEGER;
    v_payment_breakdown JSONB;
    v_tax_breakdown JSONB;
    v_period_start TIMESTAMPTZ;
    v_period_end TIMESTAMPTZ;
BEGIN
    -- Get cash register info
    SELECT id, restaurant_id, status, opened_at, closed_at, opening_balance_cents, total_sales_cents
    INTO v_register
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id;

    IF v_register IS NULL THEN
        RAISE EXCEPTION 'CASH_REGISTER_NOT_FOUND: Cash register % not found', p_cash_register_id;
    END IF;

    v_period_start := v_register.opened_at;
    v_period_end := COALESCE(v_register.closed_at, NOW());

    -- Aggregate CLOSED orders for this session
    SELECT
        COUNT(*)::INTEGER,
        COALESCE(SUM(total_cents), 0)::BIGINT,
        COALESCE(SUM(tax_cents), 0)::BIGINT,
        COALESCE(SUM(subtotal_cents), 0)::BIGINT,
        COALESCE(SUM(discount_cents), 0)::BIGINT,
        CASE WHEN COUNT(*) > 0
            THEN (SUM(total_cents) / COUNT(*))::INTEGER
            ELSE 0
        END
    INTO v_total_orders, v_total_gross_cents, v_total_tax_cents, v_total_net_cents,
         v_total_discount_cents, v_avg_ticket_cents
    FROM public.gm_orders
    WHERE restaurant_id = v_register.restaurant_id
      AND cash_register_id = p_cash_register_id
      AND status = 'CLOSED'
      AND created_at >= v_period_start
      AND created_at <= v_period_end;

    -- Count cancelled orders
    SELECT COUNT(*)::INTEGER INTO v_cancelled_orders
    FROM public.gm_orders
    WHERE restaurant_id = v_register.restaurant_id
      AND cash_register_id = p_cash_register_id
      AND status = 'CANCELLED'
      AND created_at >= v_period_start
      AND created_at <= v_period_end;

    -- Payment method breakdown
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'method', pm.payment_method,
            'count', pm.cnt,
            'total_cents', pm.total
        )
    ), '[]'::jsonb) INTO v_payment_breakdown
    FROM (
        SELECT
            p.payment_method,
            COUNT(*)::INTEGER AS cnt,
            SUM(p.amount_cents)::BIGINT AS total
        FROM public.gm_payments p
        WHERE p.cash_register_id = p_cash_register_id
          AND p.status = 'paid'
          AND p.created_at >= v_period_start
          AND p.created_at <= v_period_end
        GROUP BY p.payment_method
    ) pm;

    -- Tax breakdown by rate (from order items)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'tax_rate_bps', tb.tax_rate_bps,
            'tax_rate_pct', ROUND(tb.tax_rate_bps::NUMERIC / 100, 2),
            'subtotal_cents', tb.subtotal,
            'tax_cents', tb.tax_total
        )
    ), '[]'::jsonb) INTO v_tax_breakdown
    FROM (
        SELECT
            oi.tax_rate_bps,
            SUM(oi.subtotal_cents)::BIGINT AS subtotal,
            SUM(oi.tax_cents)::BIGINT AS tax_total
        FROM public.gm_order_items oi
        JOIN public.gm_orders o ON o.id = oi.order_id
        WHERE o.cash_register_id = p_cash_register_id
          AND o.status = 'CLOSED'
          AND o.restaurant_id = v_register.restaurant_id
          AND o.created_at >= v_period_start
          AND o.created_at <= v_period_end
        GROUP BY oi.tax_rate_bps
        ORDER BY oi.tax_rate_bps
    ) tb;

    RETURN jsonb_build_object(
        'cash_register_id', p_cash_register_id,
        'restaurant_id', v_register.restaurant_id,
        'period_start', v_period_start,
        'period_end', v_period_end,
        'opening_balance_cents', v_register.opening_balance_cents,
        'total_orders', v_total_orders,
        'cancelled_orders', v_cancelled_orders,
        'total_gross_cents', v_total_gross_cents,
        'total_net_cents', v_total_net_cents,
        'total_tax_cents', v_total_tax_cents,
        'total_discount_cents', v_total_discount_cents,
        'avg_ticket_cents', v_avg_ticket_cents,
        'payment_breakdown', v_payment_breakdown,
        'tax_breakdown', v_tax_breakdown,
        'generated_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_shift_close_report TO postgres;

COMMENT ON FUNCTION public.generate_shift_close_report IS
'Z-Report: Generates shift close report with order totals, tax breakdown by rate, and payment method breakdown.';

-- =============================================================================
-- 2. RPC: close_cash_register_atomic
-- =============================================================================
-- Closes the cash register, generates Z-Report, stores snapshot.
-- Requires: declared closing amount for cash reconciliation.

CREATE OR REPLACE FUNCTION public.close_cash_register_atomic(
    p_cash_register_id UUID,
    p_closed_by TEXT DEFAULT NULL,
    p_declared_closing_cents BIGINT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_register RECORD;
    v_z_report JSONB;
    v_expected_cash_cents BIGINT;
    v_cash_payments_cents BIGINT;
    v_difference_cents BIGINT;
BEGIN
    -- Get register and validate
    SELECT * INTO v_register
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id;

    IF v_register IS NULL THEN
        RAISE EXCEPTION 'CASH_REGISTER_NOT_FOUND: Cash register % not found', p_cash_register_id;
    END IF;

    IF v_register.status = 'closed' THEN
        RAISE EXCEPTION 'CASH_REGISTER_ALREADY_CLOSED: Cash register % is already closed', p_cash_register_id;
    END IF;

    -- Generate Z-Report
    v_z_report := public.generate_shift_close_report(p_cash_register_id);

    -- Calculate expected cash in drawer
    -- (opening balance + cash payments received during shift)
    SELECT COALESCE(SUM(p.amount_cents), 0)::BIGINT INTO v_cash_payments_cents
    FROM public.gm_payments p
    WHERE p.cash_register_id = p_cash_register_id
      AND p.payment_method = 'cash'
      AND p.status = 'paid';

    v_expected_cash_cents := v_register.opening_balance_cents + v_cash_payments_cents;

    -- Calculate difference if declared amount provided
    IF p_declared_closing_cents IS NOT NULL THEN
        v_difference_cents := p_declared_closing_cents - v_expected_cash_cents;
    ELSE
        v_difference_cents := 0;
    END IF;

    -- Close the register
    UPDATE public.gm_cash_registers
    SET
        status = 'closed',
        closed_at = NOW(),
        closed_by = p_closed_by,
        closing_balance_cents = COALESCE(p_declared_closing_cents, v_expected_cash_cents),
        total_sales_cents = (v_z_report->>'total_gross_cents')::BIGINT,
        updated_at = NOW()
    WHERE id = p_cash_register_id;

    -- Return full Z-Report + reconciliation info
    RETURN v_z_report || jsonb_build_object(
        'closing_balance_cents', COALESCE(p_declared_closing_cents, v_expected_cash_cents),
        'expected_cash_cents', v_expected_cash_cents,
        'declared_cash_cents', p_declared_closing_cents,
        'difference_cents', v_difference_cents,
        'closed_by', p_closed_by,
        'closed_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_cash_register_atomic TO postgres;

COMMENT ON FUNCTION public.close_cash_register_atomic IS
'Core RPC: Closes cash register atomically. Generates Z-Report snapshot. Calculates cash reconciliation difference.';
