CREATE OR REPLACE FUNCTION public.mark_item_ready(p_item_id uuid, p_restaurant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_item_order_id UUID;
    v_all_items_ready BOOLEAN;
    v_updated_order_id UUID;
BEGIN
    UPDATE public.gm_order_items
    SET ready_at = NOW(), updated_at = NOW()
    WHERE id = p_item_id
      AND EXISTS (
          SELECT 1
          FROM public.gm_orders o
          WHERE o.id = gm_order_items.order_id
            AND o.restaurant_id = p_restaurant_id
      )
    RETURNING order_id INTO v_item_order_id;
    IF v_item_order_id IS NULL THEN
        RAISE EXCEPTION 'ITEM_NOT_FOUND: Item não encontrado ou não pertence ao restaurante';
    END IF;
    SELECT COUNT(*) = COUNT(CASE WHEN ready_at IS NOT NULL THEN 1 END)
    INTO v_all_items_ready
    FROM public.gm_order_items
    WHERE order_id = v_item_order_id;
    IF v_all_items_ready THEN
        UPDATE public.gm_orders
        SET status = 'READY',
            ready_at = CASE WHEN ready_at IS NULL THEN NOW() ELSE ready_at END,
            updated_at = NOW()
        WHERE id = v_item_order_id
          AND restaurant_id = p_restaurant_id
        RETURNING id INTO v_updated_order_id;
    END IF;
    RETURN jsonb_build_object(
        'success', true,
        'item_id', p_item_id,
        'order_id', v_item_order_id,
        'all_items_ready', v_all_items_ready,
        'order_status_updated', v_updated_order_id IS NOT NULL
    );
END;
$function$;
