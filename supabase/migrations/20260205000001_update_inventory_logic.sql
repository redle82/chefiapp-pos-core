-- 20260205000001_update_inventory_logic.sql
-- 🧠 LOGIC: Update Order Creation with Recipe Support

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
    v_prod_name TEXT;
    v_is_offline_sync BOOLEAN;
    
    -- Inventory Variables
    v_recipe_record RECORD;
    v_has_recipe BOOLEAN;
    v_current_stock NUMERIC;
BEGIN
    v_is_offline_sync := p_sync_metadata IS NOT NULL;

    -- 1. Calculate Total Amount
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

    -- 4. Insert Order Items & Handle Inventory
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

        -- INVENTORY LOGIC: Check for Recipe
        SELECT EXISTS (
            SELECT 1 FROM public.gm_product_recipes WHERE product_id = v_prod_id
        ) INTO v_has_recipe;

        IF v_has_recipe THEN
            -- A. Deduct from Ingredients (Recipe)
            FOR v_recipe_record IN 
                SELECT inventory_item_id, quantity_required 
                FROM public.gm_product_recipes 
                WHERE product_id = v_prod_id
            LOOP
                UPDATE public.gm_inventory_items
                SET stock_quantity = stock_quantity - (v_recipe_record.quantity_required * v_qty),
                    updated_at = NOW()
                WHERE id = v_recipe_record.inventory_item_id
                RETURNING stock_quantity, name INTO v_current_stock, v_prod_name; -- Reuse variable for name

                -- Check Insufficient Stock (Ingredients)
                IF v_current_stock < 0 AND NOT v_is_offline_sync THEN
                    -- Note: Ideally we'd rollback, but raising exception triggers auto-rollback in Postgres
                    -- Use the item name fetched from update if possible, actually UPDATE RETURNING name won't work well if we don't select it.
                    -- Let's trust the system to rollback.
                    -- Ideally, check beforehand? No, concurrency.
                    -- For now, allow negative stock or block? 
                    -- Requirement said "Insufficient Stock" check.
                    RAISE EXCEPTION 'INSUFFICIENT_STOCK_INGREDIENT: Item % needs stock (Current: %)', v_recipe_record.inventory_item_id, v_current_stock;
                END IF;
            END LOOP;

        ELSE
            -- B. Deduct from Product (Simple Stock)
            -- Only if track_stock is TRUE
            UPDATE public.gm_products
            SET stock_quantity = stock_quantity - v_qty
            WHERE id = v_prod_id AND track_stock = TRUE
            RETURNING stock_quantity INTO v_current_stock;

            IF FOUND AND v_current_stock < 0 AND NOT v_is_offline_sync THEN
                RAISE EXCEPTION 'INSUFFICIENT_STOCK_PRODUCT: % (Current: %)', v_prod_name, v_current_stock;
            END IF;
        END IF;

    END LOOP;

    RETURN jsonb_build_object(
        'id', v_order_id,
        'short_id', v_short_id,
        'total_amount', v_total_amount,
        'status', 'pending'
    );
END;
$$;
