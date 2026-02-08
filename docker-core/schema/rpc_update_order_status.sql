-- =============================================================================
-- RPC: update_order_status (FASE 6 - Ação Única)
-- =============================================================================
-- Atualiza status do pedido de forma segura.
-- Valida status e restaurante antes de atualizar.

CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_new_status TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_id UUID;
BEGIN
    -- Validar status
    IF p_new_status NOT IN ('OPEN', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Status inválido: %', p_new_status;
    END IF;

    -- Atualizar status
    UPDATE public.gm_orders
    SET 
        status = p_new_status,
        updated_at = NOW(),
        in_prep_at = CASE WHEN p_new_status = 'IN_PREP' AND in_prep_at IS NULL THEN NOW() ELSE in_prep_at END,
        ready_at = CASE WHEN p_new_status = 'READY' AND ready_at IS NULL THEN NOW() ELSE ready_at END
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id
    RETURNING id INTO v_updated_id;

    -- Verificar se atualizou
    IF v_updated_id IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;

    -- Retornar sucesso
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_updated_id,
        'new_status', p_new_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status TO postgres;

COMMENT ON FUNCTION public.update_order_status IS 'FASE 6: Atualiza status do pedido de forma segura. Valida status e restaurante.';
