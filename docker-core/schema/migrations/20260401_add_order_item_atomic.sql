-- =============================================================================
-- Migration: add_order_item_atomic RPC
-- Date: 2026-04-01
-- Purpose: Atomic add item to OPEN order with SELECT FOR UPDATE, status check,
--   total_cents recalculation, and optional idempotency.
-- =============================================================================

-- Add idempotency_key to gm_order_items for add-item idempotency
ALTER TABLE public.gm_order_items
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_order_items_order_idempotency
    ON public.gm_order_items(order_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

COMMENT ON COLUMN public.gm_order_items.idempotency_key IS
    'Idempotency key for add_order_item_atomic. Prevents duplicate items on retry.';

-- =============================================================================
-- RPC: add_order_item_atomic
-- =============================================================================
CREATE OR REPLACE FUNCTION public.add_order_item_atomic(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_product_id UUID,
    p_quantity INTEGER,
    p_name_snapshot TEXT,
    p_price_snapshot INTEGER,
    p_idempotency_key TEXT DEFAULT NULL,
    p_created_by_user_id UUID DEFAULT NULL,
    p_created_by_role TEXT DEFAULT NULL,
    p_device_id TEXT DEFAULT NULL,
    p_modifiers JSONB DEFAULT '[]'::jsonb,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_status TEXT;
    v_item_id UUID;
    v_subtotal INTEGER;
    v_new_total_cents INTEGER;
    v_prep_time_seconds INTEGER;
    v_prep_category TEXT;
    v_station TEXT;
    v_existing_item_id UUID;
BEGIN
    v_subtotal := p_quantity * p_price_snapshot;

    -- 0. Idempotency fast-path
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_item_id
        FROM public.gm_order_items
        WHERE order_id = p_order_id AND idempotency_key = p_idempotency_key
        LIMIT 1;

        IF v_existing_item_id IS NOT NULL THEN
            SELECT COALESCE(SUM(subtotal_cents), 0) INTO v_new_total_cents
            FROM public.gm_order_items WHERE order_id = p_order_id;

            RETURN jsonb_build_object(
                'id', v_existing_item_id,
                'order_id', p_order_id,
                'total_cents', v_new_total_cents,
                'idempotent', true
            );
        END IF;
    END IF;

    -- 1. Lock order and verify status OPEN
    SELECT status INTO v_order_status
    FROM public.gm_orders
    WHERE id = p_order_id AND restaurant_id = p_restaurant_id
    FOR UPDATE;

    IF v_order_status IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;

    IF v_order_status != 'OPEN' THEN
        RAISE EXCEPTION 'ORDER_NOT_OPEN: Pedido não está aberto para adicionar itens (status: %)', v_order_status;
    END IF;

    -- 2. Fetch prep_time, prep_category, station from product
    SELECT prep_time_seconds, prep_category, station
    INTO v_prep_time_seconds, v_prep_category, v_station
    FROM public.gm_products
    WHERE id = p_product_id;

    v_prep_time_seconds := COALESCE(v_prep_time_seconds, 300);
    v_prep_category := COALESCE(v_prep_category, 'main');
    v_station := COALESCE(v_station, 'KITCHEN');

    -- 3. Insert order item
    INSERT INTO public.gm_order_items (
        order_id,
        product_id,
        name_snapshot,
        price_snapshot,
        quantity,
        subtotal_cents,
        prep_time_seconds,
        prep_category,
        station,
        created_by_user_id,
        created_by_role,
        device_id,
        modifiers,
        notes,
        idempotency_key
    )
    VALUES (
        p_order_id,
        p_product_id,
        p_name_snapshot,
        p_price_snapshot,
        p_quantity,
        v_subtotal,
        v_prep_time_seconds,
        v_prep_category,
        v_station,
        p_created_by_user_id,
        p_created_by_role,
        p_device_id,
        COALESCE(p_modifiers, '[]'::jsonb),
        p_notes,
        p_idempotency_key
    )
    RETURNING id INTO v_item_id;

    -- 4. total_cents recalculated by trigger trg_recalc_order_total_on_items
    SELECT COALESCE(SUM(subtotal_cents), 0) INTO v_new_total_cents
    FROM public.gm_order_items
    WHERE order_id = p_order_id;

    RETURN jsonb_build_object(
        'id', v_item_id,
        'order_id', p_order_id,
        'total_cents', v_new_total_cents,
        'idempotent', false
    );
EXCEPTION
    WHEN unique_violation THEN
        IF p_idempotency_key IS NOT NULL THEN
            SELECT id INTO v_existing_item_id
            FROM public.gm_order_items
            WHERE order_id = p_order_id AND idempotency_key = p_idempotency_key
            LIMIT 1;

            IF v_existing_item_id IS NOT NULL THEN
                SELECT COALESCE(SUM(subtotal_cents), 0) INTO v_new_total_cents
                FROM public.gm_order_items WHERE order_id = p_order_id;

                RETURN jsonb_build_object(
                    'id', v_existing_item_id,
                    'order_id', p_order_id,
                    'total_cents', v_new_total_cents,
                    'idempotent', true
                );
            END IF;
        END IF;
        RAISE;
END;
$$;

COMMENT ON FUNCTION public.add_order_item_atomic IS
    'Adds item to OPEN order atomically. SELECT FOR UPDATE, status check, total_cents recalculation. Idempotent via p_idempotency_key.';

GRANT EXECUTE ON FUNCTION public.add_order_item_atomic TO postgres;
