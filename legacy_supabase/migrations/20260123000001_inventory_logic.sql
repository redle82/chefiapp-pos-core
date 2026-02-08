-- Migration: Update create_order_atomic with Inventory Logic
-- Date: 2026-01-23

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE 
    v_order_id UUID;
    v_total_amount INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_short_id TEXT;
    v_count INTEGER;
    v_prod_id UUID;
    v_qty INTEGER;
    v_new_stock NUMERIC;
    v_prod_name TEXT;
    v_is_offline_sync BOOLEAN;
BEGIN
    v_is_offline_sync := p_sync_metadata IS NOT NULL;

    -- 1. Calculate Total Amount & Prepare Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) 
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_amount := v_total_amount + v_item_total;
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
        total_cents,
        payment_status,
        payment_method,
        sync_metadata
    )
    VALUES (
        p_restaurant_id,
        v_short_id,
        'pending',
        v_total_amount,
        'pending',
        p_payment_method,
        p_sync_metadata
    )
    RETURNING id INTO v_order_id;

    -- 4. Insert Order Items & Handle Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) 
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_prod_name := v_item->>'name';
        v_qty := (v_item->>'quantity')::INTEGER;

        -- Insert Item
        INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            name_snapshot,
            quantity,
            price_snapshot,
            subtotal_cents
        )
        VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_qty,
            (v_item->>'unit_price')::INTEGER,
            v_qty * (v_item->>'unit_price')::INTEGER
        );

        -- Decrement Stock (if tracked)
        UPDATE public.gm_products
        SET stock_quantity = stock_quantity - v_qty
        WHERE id = v_prod_id AND track_stock = TRUE
        RETURNING stock_quantity INTO v_new_stock;

        -- Check Insufficient Stock (Only for online sales)
        IF FOUND AND v_new_stock < 0 AND NOT v_is_offline_sync THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: % (Current: %)', v_prod_name, v_new_stock;
        END IF;

    END LOOP;

    -- 5. Return the created order
    RETURN jsonb_build_object(
        'id', v_order_id,
        'short_id', v_short_id,
        'total_amount', v_total_amount,
        'status', 'pending'
    );
END;
$$;
