-- Onda 3 · E2 — Reaplicar validação de entrada + audit após 20260228110000 (hardening).
-- A migração 20260228110000 redefiniu create_order_atomic sem audit; esta restaura validação + audit.
-- Ref: docs/architecture/THREAT_MODEL.md, RATE_LIMITING_AND_INPUT_VALIDATION.md

-- ==============================================================================
-- 1. create_order_atomic — validação + autorização + audit
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_total_cents INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_short_id TEXT;
    v_count INTEGER;
    v_idx INT;
    v_len INT;
BEGIN
    -- E2: Input validation (OWASP 5.1.x)
    IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' THEN
        RAISE EXCEPTION 'Invalid input: p_items must be a non-null JSON array.';
    END IF;
    v_len := jsonb_array_length(p_items);
    IF v_len < 1 OR v_len > 500 THEN
        RAISE EXCEPTION 'Invalid input: p_items must have between 1 and 500 elements, got %.', v_len;
    END IF;
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_idx := v_idx + 1;
        IF v_item->>'product_id' IS NULL OR v_item->>'product_id' = '' THEN
            RAISE EXCEPTION 'Invalid input: item % missing or empty product_id.', v_idx;
        END IF;
        IF v_item->>'name' IS NULL OR length(trim(v_item->>'name')) < 1 OR length(v_item->>'name') > 500 THEN
            RAISE EXCEPTION 'Invalid input: item % name must be 1-500 chars.', v_idx;
        END IF;
        IF v_item->>'quantity' IS NULL OR v_item->>'quantity' = '' OR v_item->>'quantity' !~ '^[0-9]+$' OR (v_item->>'quantity')::INTEGER < 1 OR (v_item->>'quantity')::INTEGER > 9999 THEN
            RAISE EXCEPTION 'Invalid input: item % quantity must be integer 1-9999.', v_idx;
        END IF;
        IF v_item->>'unit_price' IS NULL OR v_item->>'unit_price' = '' OR v_item->>'unit_price' !~ '^[0-9]+$' OR (v_item->>'unit_price')::INTEGER < 0 THEN
            RAISE EXCEPTION 'Invalid input: item % unit_price must be non-negative integer.', v_idx;
        END IF;
    END LOOP;
    IF p_payment_method IS NULL OR p_payment_method NOT IN ('cash', 'card', 'other', 'split') THEN
        RAISE EXCEPTION 'Invalid input: p_payment_method must be one of cash, card, other, split.';
    END IF;

    IF auth.uid() IS NOT NULL AND auth.role() = 'authenticated' THEN
        IF NOT (
            EXISTS (SELECT 1 FROM public.gm_restaurants WHERE id = p_restaurant_id AND owner_id = auth.uid())
            OR public.is_user_member_of_restaurant(p_restaurant_id)
        ) THEN
            RAISE EXCEPTION 'Access Denied: You are not a member of this restaurant.';
        END IF;
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_cents := v_total_cents + v_item_total;
    END LOOP;

    SELECT count(*) + 1 INTO v_count
    FROM public.gm_orders WHERE restaurant_id = p_restaurant_id;
    v_short_id := '#' || v_count::TEXT;

    INSERT INTO public.gm_orders (restaurant_id, short_id, status, total_cents, payment_status, payment_method, sync_metadata)
    VALUES (p_restaurant_id, v_short_id, 'PENDING', v_total_cents, 'PENDING', p_payment_method, p_sync_metadata)
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.gm_order_items (order_id, product_id, name_snapshot, quantity, price_snapshot, subtotal_cents)
        VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'name',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::INTEGER,
            (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER
        );
    END LOOP;

    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.gm_audit_logs (tenant_id, actor_id, action, resource_entity, resource_id, metadata, event_type, actor_type, result)
        VALUES (
            p_restaurant_id,
            auth.uid(),
            'ORDER_CREATED',
            'order',
            v_order_id::text,
            jsonb_build_object('short_id', v_short_id, 'total_cents', v_total_cents),
            'order_created',
            'user',
            'success'
        );
    END IF;

    RETURN jsonb_build_object('id', v_order_id, 'short_id', v_short_id, 'total_cents', v_total_cents, 'status', 'PENDING');
END;
$$;

COMMENT ON FUNCTION public.create_order_atomic(UUID, JSONB, TEXT, JSONB) IS
  'E2 Onda 3: input validation + audit. THREAT_MODEL mitigation.';
