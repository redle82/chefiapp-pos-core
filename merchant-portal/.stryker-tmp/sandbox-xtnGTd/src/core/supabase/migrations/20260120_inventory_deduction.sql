-- Migration: Create inventory deduction RPC
-- Date: 2026-01-20
-- Description: Function to minimize inventory based on sold items and their recipes
-- corrected to match gm_stock_movements schema (no restaurant_id, absolute qty)

CREATE OR REPLACE FUNCTION process_inventory_deduction(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    r_item RECORD;
    r_recipe RECORD;
    v_deduction_qty NUMERIC;
BEGIN
    -- Loop through order items
    FOR r_item IN
        SELECT product_id, quantity, product_name
        FROM gm_order_items
        WHERE order_id = p_order_id
    LOOP
        -- Find recipe for this product (menu_item)
        -- We loop because a single menu item might use multiple ingredients
        FOR r_recipe IN
            SELECT inventory_item_id, quantity
            FROM gm_recipes
            WHERE menu_item_id = r_item.product_id
        LOOP
            v_deduction_qty := (r_recipe.quantity * r_item.quantity);

            -- 1. Deduct Stock
            UPDATE gm_inventory_items
            SET stock_quantity = stock_quantity - v_deduction_qty,
                updated_at = NOW()
            WHERE id = r_recipe.inventory_item_id;

            -- 2. Log Movement
            INSERT INTO gm_stock_movements (
                inventory_item_id,
                quantity, -- Absolute value
                type,     -- 'SALE'
                reason,
                created_at,
                created_by
            ) VALUES (
                r_recipe.inventory_item_id,
                v_deduction_qty,
                'SALE',
                'Sale: ' || r_item.product_name,
                NOW(),
                auth.uid()
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
