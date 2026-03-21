CREATE OR REPLACE FUNCTION public.process_inventory_deduction(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_item RECORD;
    v_updated INTEGER := 0;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.quantity
        FROM public.gm_order_items oi
        WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL
    LOOP
        UPDATE public.gm_products
        SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - v_item.quantity),
            updated_at = NOW()
        WHERE id = v_item.product_id AND track_stock = true;
        IF FOUND THEN
            v_updated := v_updated + 1;
        END IF;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'items_updated', v_updated);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
