CREATE OR REPLACE FUNCTION public.get_operational_metrics(p_restaurant_id uuid, p_from timestamp with time zone, p_to timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;
