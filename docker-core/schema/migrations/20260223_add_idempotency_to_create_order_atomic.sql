-- =============================================================================
-- Migration: Add idempotency to create_order_atomic
-- Date: 2026-02-23
-- =============================================================================
-- Goal:
--   Close offline/sync dedup gap by allowing ORDER_CREATE retries to be
--   idempotent at Core level with p_idempotency_key.
--
-- Notes:
--   - Replaces existing function signature with an extra optional argument.
--   - Maintains backward compatibility for callers not sending the key.
--   - On duplicate key, returns existing order payload (idempotent response).
-- =============================================================================

ALTER TABLE public.gm_orders
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_orders_restaurant_idempotency
    ON public.gm_orders(restaurant_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_total_cents INTEGER := 0;
    v_total_tax_cents INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_item_tax INTEGER;
    v_prod_id UUID;
    v_qty INTEGER;
    v_prod_name TEXT;
    v_unit_price INTEGER;
    v_table_id UUID;
    v_table_number INTEGER;
    v_prep_time_seconds INTEGER;
    v_prep_category TEXT;
    v_station TEXT;
    v_effective_tax_rate INTEGER;
    v_existing_order_id UUID;
    v_existing_total_cents INTEGER;
    v_existing_subtotal_cents INTEGER;
    v_existing_tax_cents INTEGER;
    v_existing_status TEXT;
BEGIN
    -- 0. Idempotency fast-path
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, total_cents, subtotal_cents, tax_cents, status
          INTO v_existing_order_id, v_existing_total_cents, v_existing_subtotal_cents, v_existing_tax_cents, v_existing_status
          FROM public.gm_orders
         WHERE restaurant_id = p_restaurant_id
           AND idempotency_key = p_idempotency_key
         ORDER BY created_at DESC
         LIMIT 1;

        IF v_existing_order_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'id', v_existing_order_id,
                'total_cents', COALESCE(v_existing_total_cents, 0),
                'subtotal_cents', COALESCE(v_existing_subtotal_cents, 0),
                'tax_cents', COALESCE(v_existing_tax_cents, 0),
                'status', COALESCE(v_existing_status, 'OPEN'),
                'idempotent', true
            );
        END IF;
    END IF;

    -- Tax rate fallback for order-level tax fields (23% IVA)
    v_effective_tax_rate := 2300;

    -- Extract table info from sync_metadata if provided
    IF p_sync_metadata IS NOT NULL THEN
        v_table_id := (p_sync_metadata->>'table_id')::UUID;
        v_table_number := (p_sync_metadata->>'table_number')::INTEGER;
    END IF;

    -- 1. Calculate Total Amount + Tax
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;
        v_item_total := v_qty * v_unit_price;

        -- Tax-inclusive calculation: tax = total - (total * 10000 / (10000 + rate))
        v_item_tax := v_item_total - (v_item_total * 10000 / (10000 + v_effective_tax_rate));

        v_total_cents := v_total_cents + v_item_total;
        v_total_tax_cents := v_total_tax_cents + v_item_tax;
    END LOOP;

    -- 2. Insert Order (Atomic)
    INSERT INTO public.gm_orders (
        restaurant_id,
        table_id,
        table_number,
        status,
        total_cents,
        subtotal_cents,
        tax_cents,
        payment_status,
        sync_metadata,
        origin,
        metadata,
        idempotency_key
    )
    VALUES (
        p_restaurant_id,
        v_table_id,
        v_table_number,
        'OPEN',
        v_total_cents,
        v_total_cents - v_total_tax_cents,
        v_total_tax_cents,
        'PENDING',
        p_sync_metadata,
        COALESCE((p_sync_metadata->>'origin')::TEXT, 'CAIXA'),
        jsonb_build_object('payment_method', p_payment_method),
        p_idempotency_key
    )
    RETURNING id INTO v_order_id;

    -- 3. Insert Order Items (with tax snapshot + prep time + authorship)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_prod_name := v_item->>'name';
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;
        v_item_total := v_qty * v_unit_price;

        -- Fetch prep_time and station from product
        SELECT prep_time_seconds, prep_category, station
        INTO v_prep_time_seconds, v_prep_category, v_station
        FROM public.gm_products
        WHERE id = v_prod_id;

        v_prep_time_seconds := COALESCE(v_prep_time_seconds, 300);
        v_prep_category := COALESCE(v_prep_category, 'main');
        v_station := COALESCE(v_station, 'KITCHEN');

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
            device_id
        )
        VALUES (
            v_order_id,
            v_prod_id,
            v_prod_name,
            v_unit_price,
            v_qty,
            v_item_total,
            v_prep_time_seconds,
            v_prep_category,
            v_station,
            (v_item->>'created_by_user_id')::UUID,
            v_item->>'created_by_role',
            v_item->>'device_id'
        );
    END LOOP;

    -- 4. Return Created Order
    RETURN jsonb_build_object(
        'id', v_order_id,
        'total_cents', v_total_cents,
        'subtotal_cents', v_total_cents - v_total_tax_cents,
        'tax_cents', v_total_tax_cents,
        'status', 'OPEN',
        'idempotent', false
    );
EXCEPTION
    WHEN unique_violation THEN
        -- Idempotency race: second concurrent insert with same key
        IF p_idempotency_key IS NOT NULL THEN
            SELECT id, total_cents, subtotal_cents, tax_cents, status
              INTO v_existing_order_id, v_existing_total_cents, v_existing_subtotal_cents, v_existing_tax_cents, v_existing_status
              FROM public.gm_orders
             WHERE restaurant_id = p_restaurant_id
               AND idempotency_key = p_idempotency_key
             ORDER BY created_at DESC
             LIMIT 1;

            IF v_existing_order_id IS NOT NULL THEN
                RETURN jsonb_build_object(
                    'id', v_existing_order_id,
                    'total_cents', COALESCE(v_existing_total_cents, 0),
                    'subtotal_cents', COALESCE(v_existing_subtotal_cents, 0),
                    'tax_cents', COALESCE(v_existing_tax_cents, 0),
                    'status', COALESCE(v_existing_status, 'OPEN'),
                    'idempotent', true
                );
            END IF;
        END IF;

        RAISE EXCEPTION 'TABLE_HAS_ACTIVE_ORDER: Esta mesa já possui um pedido aberto';
END;
$$;

COMMENT ON FUNCTION public.create_order_atomic IS
'Official Core RPC: Creates order atomically with IVA tax calculation. Tax-inclusive pricing (EU standard). Enforces constitutional constraints. Supports idempotent retries via p_idempotency_key.';
