-- =============================================================================
-- Migration: Stock BOM Deduction Idempotency Guard
-- Date: 2026-02-18
-- Purpose:
--   1. Prevent double-deduction for the same order.
--   2. Keep deduct_stock_by_bom safe under retries.
-- =============================================================================

-- =============================================================================
-- 1. Guard table for idempotency
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_stock_deduction_events (
    order_id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.gm_stock_deduction_events IS
'Idempotency guard for stock deductions by order.';

-- =============================================================================
-- 2. Idempotent deduct_stock_by_bom
-- =============================================================================

CREATE OR REPLACE FUNCTION public.deduct_stock_by_bom(
    p_order_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_bom RECORD;
    v_location_id UUID;
    v_current_qty NUMERIC;
    v_min_qty NUMERIC;
    v_deduction NUMERIC;
    v_deductions_count INTEGER := 0;
    v_low_stock_alerts JSONB := '[]'::jsonb;
    v_guard_rowcount INTEGER := 0;
BEGIN
    -- Get order info
    SELECT id, restaurant_id, status
    INTO v_order
    FROM public.gm_orders
    WHERE id = p_order_id;

    IF v_order IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Order % not found', p_order_id;
    END IF;

    -- Only deduct for CLOSED orders (safety check)
    IF v_order.status != 'CLOSED' THEN
        RAISE EXCEPTION 'ORDER_NOT_CLOSED: Cannot deduct stock for order with status %', v_order.status;
    END IF;

    -- Idempotency guard
    INSERT INTO public.gm_stock_deduction_events (order_id, restaurant_id)
    VALUES (p_order_id, v_order.restaurant_id)
    ON CONFLICT (order_id) DO NOTHING;

    GET DIAGNOSTICS v_guard_rowcount = ROW_COUNT;
    IF v_guard_rowcount = 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'order_id', p_order_id,
            'deductions_count', 0,
            'low_stock_alerts', v_low_stock_alerts,
            'already_deducted', true
        );
    END IF;

    -- Iterate order items
    FOR v_item IN
        SELECT oi.id AS item_id, oi.product_id, oi.quantity
        FROM public.gm_order_items oi
        WHERE oi.order_id = p_order_id
          AND oi.product_id IS NOT NULL
    LOOP
        -- Iterate BOM entries for this product
        FOR v_bom IN
            SELECT b.ingredient_id, b.qty_per_unit, b.station, b.preferred_location_kind
            FROM public.gm_product_bom b
            WHERE b.product_id = v_item.product_id
              AND b.restaurant_id = v_order.restaurant_id
        LOOP
            v_deduction := v_bom.qty_per_unit * v_item.quantity;

            -- Find best stock location: prefer by kind, fallback to any with stock
            SELECT sl.id, sl.location_id, sl.qty
            INTO v_location_id, v_location_id, v_current_qty
            FROM public.gm_stock_levels sl
            JOIN public.gm_locations loc ON loc.id = sl.location_id
            WHERE sl.restaurant_id = v_order.restaurant_id
              AND sl.ingredient_id = v_bom.ingredient_id
              AND sl.qty > 0
            ORDER BY
                CASE WHEN loc.kind = COALESCE(v_bom.preferred_location_kind, v_bom.station) THEN 0 ELSE 1 END,
                sl.qty DESC
            LIMIT 1;

            -- If we found stock, deduct
            IF v_location_id IS NOT NULL THEN
                -- Deduct from stock_levels
                UPDATE public.gm_stock_levels
                SET qty = qty - v_deduction,
                    updated_at = NOW()
                WHERE restaurant_id = v_order.restaurant_id
                  AND location_id = v_location_id
                  AND ingredient_id = v_bom.ingredient_id;

                -- Log to ledger
                INSERT INTO public.gm_stock_ledger (
                    restaurant_id, location_id, ingredient_id,
                    order_id, order_item_id,
                    action, qty, reason,
                    created_by_role
                ) VALUES (
                    v_order.restaurant_id, v_location_id, v_bom.ingredient_id,
                    p_order_id, v_item.item_id,
                    'CONSUME', v_deduction,
                    'Order closed: auto BOM deduction',
                    'system'
                );

                v_deductions_count := v_deductions_count + 1;

                -- Check for low stock alert after deduction
                SELECT sl2.qty, sl2.min_qty
                INTO v_current_qty, v_min_qty
                FROM public.gm_stock_levels sl2
                WHERE sl2.restaurant_id = v_order.restaurant_id
                  AND sl2.location_id = v_location_id
                  AND sl2.ingredient_id = v_bom.ingredient_id;

                IF v_current_qty <= v_min_qty AND v_min_qty > 0 THEN
                    v_low_stock_alerts := v_low_stock_alerts || jsonb_build_object(
                        'ingredient_id', v_bom.ingredient_id,
                        'location_id', v_location_id,
                        'current_qty', v_current_qty,
                        'min_qty', v_min_qty
                    );
                END IF;

            ELSE
                -- No stock found — log as zero-stock consume anyway for audit
                -- Find any location for this restaurant
                SELECT loc.id INTO v_location_id
                FROM public.gm_locations loc
                WHERE loc.restaurant_id = v_order.restaurant_id
                ORDER BY
                    CASE WHEN loc.kind = COALESCE(v_bom.preferred_location_kind, v_bom.station) THEN 0 ELSE 1 END
                LIMIT 1;

                IF v_location_id IS NOT NULL THEN
                    INSERT INTO public.gm_stock_ledger (
                        restaurant_id, location_id, ingredient_id,
                        order_id, order_item_id,
                        action, qty, reason,
                        created_by_role
                    ) VALUES (
                        v_order.restaurant_id, v_location_id, v_bom.ingredient_id,
                        p_order_id, v_item.item_id,
                        'CONSUME', v_deduction,
                        'Order closed: auto BOM deduction (NO STOCK AVAILABLE)',
                        'system'
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'deductions_count', v_deductions_count,
        'low_stock_alerts', v_low_stock_alerts,
        'already_deducted', false
    );
END;
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
        GRANT EXECUTE ON FUNCTION public.deduct_stock_by_bom TO postgres;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.deduct_stock_by_bom IS
'Core RPC: Deducts ingredients from stock based on product BOM when order closes. Idempotent by order, logs to gm_stock_ledger and flags low-stock alerts.';
