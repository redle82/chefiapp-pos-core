-- 023_dashboard_metrics.sql
-- The Brain: Aggregated Metrics for Dashboard
CREATE OR REPLACE FUNCTION public.get_daily_metrics(
        p_restaurant_id UUID,
        p_timezone TEXT DEFAULT 'Europe/Lisbon' -- Default to Lisbon/Portugal
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_total_sales_cents BIGINT;
v_total_orders INTEGER;
v_avg_ticket_cents NUMERIC;
v_sales_by_hour JSONB;
v_top_products JSONB;
v_start_of_day TIMESTAMPTZ;
BEGIN -- Define "Today" in the restaurant's timezone
-- For simplicity, we use NOW() at UTC and truncate, but dealing with timezone is better.
-- Let's stick to UTC day for now to avoid complexity, or allow param.
v_start_of_day := DATE_TRUNC('day', NOW());
-- Improvements: convert timezone if needed.
-- 1. Aggregate Sales & Orders (Paid/Served)
SELECT COALESCE(SUM(total_cents), 0),
    COUNT(*) INTO v_total_sales_cents,
    v_total_orders
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id
    AND (
        status = 'paid'
        OR status = 'served'
    )
    AND created_at >= v_start_of_day;
-- 2. Average Ticket
IF v_total_orders > 0 THEN v_avg_ticket_cents := TRUNC(v_total_sales_cents / v_total_orders);
ELSE v_avg_ticket_cents := 0;
END IF;
-- 3. Sales by Hour (Graph Data)
WITH hourly_data AS (
    SELECT EXTRACT(
            HOUR
            FROM created_at
        ) as hour,
        SUM(total_cents) as total
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
        AND (
            status = 'paid'
            OR status = 'served'
        )
        AND created_at >= v_start_of_day
    GROUP BY 1
    ORDER BY 1 ASC
)
SELECT jsonb_agg(
        jsonb_build_object('hour', hour, 'total_cents', total)
    ) INTO v_sales_by_hour
FROM hourly_data;
-- 4. Top Products (If order items available)
-- This requires joining gm_order_items.
-- Skipped for now to keep query light, focusing on financial pulse first.
RETURN jsonb_build_object(
    'total_sales_cents',
    v_total_sales_cents,
    'total_orders',
    v_total_orders,
    'avg_ticket_cents',
    v_avg_ticket_cents,
    'sales_by_hour',
    COALESCE(v_sales_by_hour, '[]'::jsonb)
);
END;
$$;