-- =============================================================================
-- RPC: mark_item_ready
-- =============================================================================
-- Marca um item individual como pronto.
-- Quando todos os itens estão prontos, o pedido automaticamente fica READY.
--
-- FASE 1: Fechamento Operacional
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mark_item_ready(
    p_item_id UUID,
    p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item_order_id UUID;
    v_all_items_ready BOOLEAN;
    v_updated_order_id UUID;
BEGIN
    -- 1. Marcar item como pronto
    UPDATE public.gm_order_items
    SET 
        ready_at = NOW(),
        updated_at = NOW()
    WHERE id = p_item_id
      AND EXISTS (
          SELECT 1 
          FROM public.gm_orders o
          WHERE o.id = gm_order_items.order_id
            AND o.restaurant_id = p_restaurant_id
      )
    RETURNING order_id INTO v_item_order_id;

    -- Verificar se item foi atualizado
    IF v_item_order_id IS NULL THEN
        RAISE EXCEPTION 'ITEM_NOT_FOUND: Item não encontrado ou não pertence ao restaurante';
    END IF;

    -- 2. Verificar se todos os itens do pedido estão prontos
    SELECT COUNT(*) = COUNT(CASE WHEN ready_at IS NOT NULL THEN 1 END)
    INTO v_all_items_ready
    FROM public.gm_order_items
    WHERE order_id = v_item_order_id;

    -- 3. Se todos os itens estão prontos, marcar pedido como READY
    IF v_all_items_ready THEN
        UPDATE public.gm_orders
        SET 
            status = 'READY',
            ready_at = CASE WHEN ready_at IS NULL THEN NOW() ELSE ready_at END,
            updated_at = NOW()
        WHERE id = v_item_order_id
          AND restaurant_id = p_restaurant_id
        RETURNING id INTO v_updated_order_id;
    END IF;

    -- 4. Retornar resultado
    RETURN jsonb_build_object(
        'success', true,
        'item_id', p_item_id,
        'order_id', v_item_order_id,
        'all_items_ready', v_all_items_ready,
        'order_status_updated', v_updated_order_id IS NOT NULL
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_item_ready TO postgres;

COMMENT ON FUNCTION public.mark_item_ready IS 'FASE 1: Marca item individual como pronto. Pedido fica READY quando todos os itens estão prontos.';
