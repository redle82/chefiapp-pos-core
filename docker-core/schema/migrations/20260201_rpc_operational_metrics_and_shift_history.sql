-- 20260201_rpc_operational_metrics_and_shift_history.sql
-- RPCs para dashboard: métricas operacionais e histórico de turnos (caixa).
-- Elimina 404 em get_operational_metrics e get_shift_history no PostgREST (porta 3001).
-- Referência: docs/implementation/API_ERROR_CONTRACT.md, merchant-portal useOperationalMetrics / useShiftHistory.

-- =============================================================================
-- 1. get_operational_metrics(p_restaurant_id, p_from, p_to) → JSONB
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_operational_metrics(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.get_operational_metrics IS 'Dashboard RPC: métricas operacionais por restaurante e período.';

-- =============================================================================
-- 2. get_shift_history(p_restaurant_id, p_from, p_to) → SETOF (turnos de caixa)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_shift_history(
    p_restaurant_id UUID,
    p_from TIMESTAMPTZ,
    p_to TIMESTAMPTZ
) RETURNS TABLE (
    shift_id UUID,
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    total_sales_cents BIGINT,
    orders_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.get_shift_history IS 'Dashboard RPC: histórico de turnos de caixa (gm_cash_registers) por restaurante e período.';
