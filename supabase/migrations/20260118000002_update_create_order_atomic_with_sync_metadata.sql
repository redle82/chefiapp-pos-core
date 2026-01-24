-- Migration: Update create_order_atomic to accept sync_metadata
-- Purpose: Support offline sync idempotency by storing localId
-- Date: 2026-01-18
-- Drop existing function with cascade to handle signature changes
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT, JSONB) CASCADE;
-- Recreate with sync_metadata parameter
CREATE OR REPLACE FUNCTION public.create_order_atomic(
        p_restaurant_id UUID,
        p_items JSONB,
        p_payment_method TEXT DEFAULT 'cash',
        p_sync_metadata JSONB DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order_id UUID;
v_total_cents INTEGER := 0;
v_item JSONB;
v_item_total INTEGER;
v_short_id TEXT;
v_count INTEGER;
BEGIN -- 1. Calculate Total Amount & Prepare Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
v_total_cents := v_total_cents + v_item_total;
END LOOP;
-- 2. Generate Short ID
SELECT count(*) + 1 INTO v_count
FROM public.gm_orders
WHERE restaurant_id = p_restaurant_id;
v_short_id := '#' || v_count::TEXT;
-- 3. Insert Order (with sync_metadata if provided)
INSERT INTO public.gm_orders (
        restaurant_id,
        short_id,
        status,
        total_cents,
        payment_status,
        payment_method,
        sync_metadata
    )
VALUES (
        p_restaurant_id,
        v_short_id,
        'pending',
        v_total_cents,
        'pending',
        p_payment_method,
        p_sync_metadata
    )
RETURNING id INTO v_order_id;
-- 4. Insert Order Items
FOR v_item IN
SELECT *
FROM jsonb_array_elements(p_items) LOOP
INSERT INTO public.gm_order_items (
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price
    )
VALUES (
        v_order_id,
        (v_item->>'product_id')::UUID,
        v_item->>'name',
        (v_item->>'quantity')::INTEGER,
        (v_item->>'unit_price')::INTEGER,
        (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER
    );
END LOOP;
-- 5. Return the created order
RETURN jsonb_build_object(
    'id',
    v_order_id,
    'short_id',
    v_short_id,
    'total_amount',
    v_total_cents,
    'status',
    'pending'
);
END;
$$;