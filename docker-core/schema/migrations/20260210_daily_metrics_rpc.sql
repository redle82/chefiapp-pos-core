-- =============================================================================
-- RPC: get_daily_metrics — Métricas diárias agregadas para Dashboard Executivo.
-- Alinhado com schema Core: gm_orders.status='CLOSED', payment_status='PAID'.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_daily_metrics(
    p_restaurant_id UUID,
    p_timezone TEXT DEFAULT 'Europe/Lisbon'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_sales_cents BIGINT;
    v_total_orders INTEGER;
    v_avg_ticket_cents NUMERIC;
    v_sales_by_hour JSONB;
    v_start_of_day TIMESTAMPTZ;
BEGIN
    -- "Today" in UTC (timezone param reserved for future use)
    v_start_of_day := DATE_TRUNC('day', NOW());

    -- 1. Aggregate Sales & Orders (CLOSED + PAID — consistent with get_operational_metrics)
    SELECT COALESCE(SUM(total_cents), 0),
           COUNT(*)
    INTO v_total_sales_cents, v_total_orders
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
      AND status = 'CLOSED'
      AND payment_status IN ('PAID', 'PARTIALLY_PAID')
      AND created_at >= v_start_of_day;

    -- 2. Average Ticket
    IF v_total_orders > 0 THEN
        v_avg_ticket_cents := TRUNC(v_total_sales_cents / v_total_orders);
    ELSE
        v_avg_ticket_cents := 0;
    END IF;

    -- 3. Sales by Hour (Graph Data)
    WITH hourly_data AS (
        SELECT EXTRACT(HOUR FROM created_at)::INTEGER as hour,
               SUM(total_cents) as total_cents
        FROM public.gm_orders
        WHERE restaurant_id = p_restaurant_id
          AND status = 'CLOSED'
          AND payment_status IN ('PAID', 'PARTIALLY_PAID')
          AND created_at >= v_start_of_day
        GROUP BY 1
        ORDER BY 1 ASC
    )
    SELECT COALESCE(
        jsonb_agg(jsonb_build_object('hour', hour, 'total_cents', total_cents)),
        '[]'::jsonb
    )
    INTO v_sales_by_hour
    FROM hourly_data;

    RETURN jsonb_build_object(
        'total_sales_cents', v_total_sales_cents,
        'total_orders', v_total_orders,
        'avg_ticket_cents', v_avg_ticket_cents,
        'sales_by_hour', v_sales_by_hour
    );
END;
$$;

COMMENT ON FUNCTION public.get_daily_metrics IS 'Dashboard RPC: métricas diárias (receita, pedidos, ticket médio, faturamento/hora).';
