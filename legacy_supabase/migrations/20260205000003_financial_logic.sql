-- Migration: Financial Logic & RPCs
-- Date: 2026-02-05

-- 1. Update create_order_atomic to capture cost
CREATE OR REPLACE FUNCTION public.create_order_atomic(
        p_restaurant_id UUID,
        p_items JSONB,
        p_payment_method TEXT DEFAULT 'cash'
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id UUID;
v_total_amount INTEGER := 0;
v_total_cost INTEGER := 0; -- New
v_item JSONB;
v_item_total INTEGER;
v_product_cost INTEGER; -- New
v_short_id TEXT;
v_count INTEGER;
BEGIN
-- 1. Calculate Totals & Validation
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP
    v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
    v_total_amount := v_total_amount + v_item_total;

    -- Lookup cost from product
    SELECT COALESCE(cost_price_cents, 0) INTO v_product_cost
    FROM public.gm_products
    WHERE id = (v_item->>'product_id')::UUID;

    v_total_cost := v_total_cost + (v_product_cost * (v_item->>'quantity')::INTEGER);
END LOOP;

-- 2. Generate Short ID
SELECT count(*) + 1 INTO v_count
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id;
v_short_id := '#' || v_count::TEXT;

-- 3. Insert Order
INSERT INTO public.gm_orders (
        restaurant_id,
        short_id,
        status,
        total_amount,
        total_cost_cents, -- New
        gross_margin_cents, -- New
        payment_status,
        payment_method
    )
VALUES (
        p_restaurant_id,
        v_short_id,
        'pending',
        v_total_amount,
        v_total_cost, -- New
        (v_total_amount - v_total_cost), -- New
        'pending',
        p_payment_method
    )
RETURNING id INTO v_order_id;

-- 4. Insert Order Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP

    -- Re-fetch cost (safe in transaction)
    SELECT COALESCE(cost_price_cents, 0) INTO v_product_cost
    FROM public.gm_products
    WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price,
            cost_snapshot_cents -- New
        )
    VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'name',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::INTEGER,
            (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER,
            v_product_cost -- New
        );
END LOOP;

RETURN jsonb_build_object(
    'id', v_order_id,
    'short_id', v_short_id,
    'total_amount', v_total_amount,
    'status', 'pending'
);
END;
$$;

-- 2. Financial Metrics RPC
CREATE OR REPLACE FUNCTION public.get_financial_metrics(
    p_restaurant_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
) RETURNS TABLE (
    total_revenue INTEGER,
    total_cost INTEGER,
    gross_profit INTEGER,
    order_count INTEGER,
    margin_percent NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(total_amount), 0)::INTEGER as total_revenue,
        COALESCE(SUM(total_cost_cents), 0)::INTEGER as total_cost,
        COALESCE(SUM(gross_margin_cents), 0)::INTEGER as gross_profit,
        COUNT(*)::INTEGER as order_count,
        CASE
            WHEN SUM(total_amount) > 0 THEN
                ROUND((SUM(gross_margin_cents)::NUMERIC / NULLIF(SUM(total_amount), 0)::NUMERIC) * 100, 2)
            ELSE 0
        END as margin_percent
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND status != 'canceled'; -- Exclude canceled orders? Or PENDING? Usually only PAID or COMPLETED.
    -- For now, excluding canceled. Ideally only 'paid' payment_status, but P&L can be accrual based.
    -- Let's stick to status != canceled for MVP.
END;
$$;
