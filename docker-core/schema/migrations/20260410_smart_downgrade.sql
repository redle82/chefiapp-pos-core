-- =============================================================================
-- Smart Downgrade — Graceful degradation before full pause
-- =============================================================================
-- New billing_status: past_due_limited, past_due_readonly
-- Transition: past_due → past_due_limited → past_due_readonly → paused
-- =============================================================================

-- 1. Extend billing_status CHECK
ALTER TABLE public.gm_restaurants
  DROP CONSTRAINT IF EXISTS gm_restaurants_billing_status_check;

ALTER TABLE public.gm_restaurants
  ADD CONSTRAINT gm_restaurants_billing_status_check
  CHECK (billing_status = ANY (ARRAY[
    'trial', 'active', 'past_due', 'past_due_limited', 'past_due_readonly',
    'incomplete', 'paused', 'canceled', 'trial_expired'
  ]));

COMMENT ON COLUMN public.gm_restaurants.billing_status IS 'SaaS subscription. past_due→limited→readonly→paused = smart downgrade.';

-- 2. Ensure gm_billing_events exists and add churn event logging support
-- (stripe_event_id used for dedup; churn uses synthetic id)

-- 3. Update churn_detect_failed_payment — Smart downgrade by attempt_count
-- attempt 1 → past_due, 2 → past_due_limited, 3 → past_due_readonly, 4+ → paused
CREATE OR REPLACE FUNCTION public.churn_detect_failed_payment(
  p_restaurant_id UUID,
  p_failure_reason TEXT DEFAULT NULL,
  p_limited_after INTEGER DEFAULT 2,
  p_readonly_after INTEGER DEFAULT 3,
  p_pause_after INTEGER DEFAULT 4
)
RETURNS TABLE(attempt_id UUID, attempt_count INTEGER, next_retry_at TIMESTAMPTZ, escalated BOOLEAN, new_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row RECORD;
  v_attempt_count INTEGER;
  v_next_retry TIMESTAMPTZ;
  v_escalated BOOLEAN := false;
  v_status_before TEXT;
  v_new_status TEXT;
  v_event_id TEXT;
BEGIN
  SELECT billing_status INTO v_status_before
  FROM public.gm_restaurants WHERE id = p_restaurant_id;
  IF v_status_before IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.gm_churn_recovery_attempts (
    restaurant_id, billing_status_before, failure_reason,
    attempt_count, last_attempt_at, next_retry_at, recovered, updated_at
  )
  VALUES (
    p_restaurant_id, COALESCE(v_status_before, 'active'), p_failure_reason,
    1, NOW(), NOW() + INTERVAL '1 day', false, NOW()
  )
  ON CONFLICT (restaurant_id) DO UPDATE SET
    failure_reason = COALESCE(EXCLUDED.failure_reason, gm_churn_recovery_attempts.failure_reason),
    attempt_count = gm_churn_recovery_attempts.attempt_count + 1,
    last_attempt_at = NOW(),
    updated_at = NOW(),
    next_retry_at = CASE
      WHEN gm_churn_recovery_attempts.attempt_count + 1 = 1 THEN NOW() + INTERVAL '1 day'
      WHEN gm_churn_recovery_attempts.attempt_count + 1 = 2 THEN NOW() + INTERVAL '3 days'
      WHEN gm_churn_recovery_attempts.attempt_count + 1 >= 3 THEN NOW() + INTERVAL '5 days'
      ELSE gm_churn_recovery_attempts.next_retry_at
    END
  RETURNING id, attempt_count, next_retry_at INTO v_row;

  v_attempt_count := v_row.attempt_count;

  -- Smart downgrade: past_due → past_due_limited → past_due_readonly → paused
  IF v_attempt_count >= p_pause_after THEN
    v_new_status := 'paused';
    v_escalated := true;
  ELSIF v_attempt_count >= p_readonly_after THEN
    v_new_status := 'past_due_readonly';
  ELSIF v_attempt_count >= p_limited_after THEN
    v_new_status := 'past_due_limited';
  ELSE
    v_new_status := 'past_due';
  END IF;

  UPDATE public.gm_restaurants
  SET billing_status = v_new_status, updated_at = NOW()
  WHERE id = p_restaurant_id;

  -- Log transition to gm_billing_events (synthetic stripe_event_id for dedup)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_billing_events') THEN
    v_event_id := 'churn-' || p_restaurant_id::TEXT || '-' || v_attempt_count::TEXT || '-' || to_char(NOW(), 'YYYYMMDDHH24MISS');
    INSERT INTO public.gm_billing_events (
      restaurant_id, stripe_event_id, event_type,
      previous_status, new_status, payload, processed_at
    )
    VALUES (
      p_restaurant_id, v_event_id, 'churn_downgrade',
      v_status_before, v_new_status,
      jsonb_build_object('attempt_count', v_attempt_count, 'failure_reason', p_failure_reason),
      NOW()
    )
    ON CONFLICT (stripe_event_id) DO NOTHING;
  END IF;

  RETURN QUERY SELECT v_row.id, v_attempt_count, v_row.next_retry_at, v_escalated, v_new_status;
END;
$$;

-- 4a. RPC: Apply smart downgrade from current attempt (idempotent, no increment)
CREATE OR REPLACE FUNCTION public.churn_apply_smart_downgrade(
  p_restaurant_id UUID,
  p_limited_after INTEGER DEFAULT 2,
  p_readonly_after INTEGER DEFAULT 3,
  p_pause_after INTEGER DEFAULT 4
)
RETURNS TABLE(applied BOOLEAN, new_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_status_before TEXT;
  v_new_status TEXT;
  v_event_id TEXT;
BEGIN
  SELECT attempt_count INTO v_attempt_count
  FROM public.gm_churn_recovery_attempts
  WHERE restaurant_id = p_restaurant_id AND recovered = false;
  IF NOT FOUND OR v_attempt_count IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT;
    RETURN;
  END IF;
  SELECT billing_status INTO v_status_before FROM public.gm_restaurants WHERE id = p_restaurant_id;
  IF v_status_before IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT;
    RETURN;
  END IF;
  IF v_attempt_count >= p_pause_after THEN
    v_new_status := 'paused';
  ELSIF v_attempt_count >= p_readonly_after THEN
    v_new_status := 'past_due_readonly';
  ELSIF v_attempt_count >= p_limited_after THEN
    v_new_status := 'past_due_limited';
  ELSE
    v_new_status := 'past_due';
  END IF;
  IF v_status_before = v_new_status THEN
    RETURN QUERY SELECT true, v_new_status;
    RETURN;
  END IF;
  UPDATE public.gm_restaurants SET billing_status = v_new_status, updated_at = NOW() WHERE id = p_restaurant_id;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gm_billing_events') THEN
    v_event_id := 'churn-apply-' || p_restaurant_id::TEXT || '-' || to_char(NOW(), 'YYYYMMDDHH24MISS');
    INSERT INTO public.gm_billing_events (restaurant_id, stripe_event_id, event_type, previous_status, new_status, payload, processed_at)
    VALUES (p_restaurant_id, v_event_id, 'churn_apply_downgrade', v_status_before, v_new_status, jsonb_build_object('attempt_count', v_attempt_count), NOW())
    ON CONFLICT (stripe_event_id) DO NOTHING;
  END IF;
  RETURN QUERY SELECT true, v_new_status;
END;
$$;
GRANT EXECUTE ON FUNCTION public.churn_apply_smart_downgrade(UUID, INTEGER, INTEGER, INTEGER) TO service_role;

-- 4b. Update require_active_subscription — Extended matrix
-- past_due: order+shift allowed, other writes blocked
-- past_due_limited, past_due_readonly, paused: all writes blocked
CREATE OR REPLACE FUNCTION public.require_active_subscription(
    p_restaurant_id UUID,
    p_write_operation BOOLEAN DEFAULT true,
    p_operation_type TEXT DEFAULT 'write'
) RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT billing_status INTO v_status
    FROM public.gm_restaurants
    WHERE id = p_restaurant_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'SUBSCRIPTION_BLOCKED: Restaurant not found [restaurant_id=%]', p_restaurant_id;
    END IF;

    -- Tier 1: Full access
    IF v_status IN ('trial', 'active') THEN
        RETURN;
    END IF;

    -- Read-only: always allowed (dashboard, reports)
    IF NOT p_write_operation OR COALESCE(p_operation_type, 'write') = 'read' THEN
        IF v_status IN ('past_due', 'past_due_limited', 'past_due_readonly', 'paused') THEN
            RETURN;
        END IF;
        -- incomplete, canceled, trial_expired block reads
        RAISE EXCEPTION 'SUBSCRIPTION_BLOCKED: status=% [restaurant_id=%]', v_status, p_restaurant_id;
    END IF;

    -- past_due: order and shift allowed, other writes blocked
    IF v_status = 'past_due' THEN
        IF p_operation_type IN ('order', 'shift') THEN
            RETURN;
        END IF;
        RAISE EXCEPTION 'SUBSCRIPTION_READONLY: past_due blocks non-order/shift writes [restaurant_id=%, op=%]', p_restaurant_id, p_operation_type;
    END IF;

    -- past_due_limited, past_due_readonly, paused: block create_order, create_shift, all writes
    IF v_status IN ('past_due_limited', 'past_due_readonly', 'paused') THEN
        RAISE EXCEPTION 'SUBSCRIPTION_BLOCKED: status=% blocks writes [restaurant_id=%, op=%]', v_status, p_restaurant_id, p_operation_type;
    END IF;

    -- incomplete, canceled, trial_expired
    RAISE EXCEPTION 'SUBSCRIPTION_BLOCKED: status=% [restaurant_id=%]', v_status, p_restaurant_id;
END;
$$;

COMMENT ON FUNCTION public.require_active_subscription IS
  'Billing guard: Smart downgrade matrix. past_due: order/shift allowed. past_due_limited/readonly/paused: all writes blocked.';

-- 5. Update create_shift to pass operation type 'shift'
CREATE OR REPLACE FUNCTION public.create_shift(
    p_restaurant_id UUID,
    p_employee_id UUID,
    p_role TEXT DEFAULT 'staff'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shift_id UUID;
BEGIN
    PERFORM public.require_active_subscription(p_restaurant_id, true, 'shift');
    INSERT INTO public.shift_logs (restaurant_id, employee_id, role, start_time, status)
    VALUES (p_restaurant_id, p_employee_id, p_role, NOW(), 'active')
    RETURNING id INTO v_shift_id;
    RETURN jsonb_build_object('success', true, 'shift_id', v_shift_id, 'restaurant_id', p_restaurant_id, 'employee_id', p_employee_id, 'role', p_role, 'start_time', NOW());
END;
$$;

-- 6. Wrapper for order ops (past_due allows TPV/KDS)
CREATE OR REPLACE FUNCTION public._billing_guard_order(p_restaurant_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN PERFORM public.require_active_subscription(p_restaurant_id, true, 'order'); END; $$;

-- 7. Patch create_order_atomic — use _billing_guard_order (past_due allows order)
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
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, total_cents, subtotal_cents, tax_cents, status
          INTO v_existing_order_id, v_existing_total_cents, v_existing_subtotal_cents, v_existing_tax_cents, v_existing_status
          FROM public.gm_orders
         WHERE restaurant_id = p_restaurant_id AND idempotency_key = p_idempotency_key
         ORDER BY created_at DESC LIMIT 1;
        IF v_existing_order_id IS NOT NULL THEN
            RETURN jsonb_build_object('id', v_existing_order_id, 'total_cents', COALESCE(v_existing_total_cents,0), 'subtotal_cents', COALESCE(v_existing_subtotal_cents,0), 'tax_cents', COALESCE(v_existing_tax_cents,0), 'status', COALESCE(v_existing_status,'OPEN'), 'idempotent', true);
        END IF;
    END IF;
    PERFORM public._billing_guard_order(p_restaurant_id);
    v_effective_tax_rate := 2300;
    IF p_sync_metadata IS NOT NULL THEN
        v_table_id := (p_sync_metadata->>'table_id')::UUID;
        v_table_number := (p_sync_metadata->>'table_number')::INTEGER;
    END IF;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;
        v_item_total := v_qty * v_unit_price;
        v_item_tax := v_item_total - (v_item_total * 10000 / (10000 + v_effective_tax_rate));
        v_total_cents := v_total_cents + v_item_total;
        v_total_tax_cents := v_total_tax_cents + v_item_tax;
    END LOOP;
    INSERT INTO public.gm_orders (restaurant_id, table_id, table_number, status, total_cents, subtotal_cents, tax_cents, payment_status, sync_metadata, origin, metadata, idempotency_key)
    VALUES (p_restaurant_id, v_table_id, v_table_number, 'OPEN', v_total_cents, v_total_cents - v_total_tax_cents, v_total_tax_cents, 'PENDING', p_sync_metadata, COALESCE((p_sync_metadata->>'origin')::TEXT,'CAIXA'), jsonb_build_object('payment_method', p_payment_method), p_idempotency_key)
    RETURNING id INTO v_order_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'product_id')::UUID;
        v_prod_name := v_item->>'name';
        v_qty := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::INTEGER;
        v_item_total := v_qty * v_unit_price;
        SELECT prep_time_seconds, prep_category, station INTO v_prep_time_seconds, v_prep_category, v_station FROM public.gm_products WHERE id = v_prod_id;
        v_prep_time_seconds := COALESCE(v_prep_time_seconds, 300);
        v_prep_category := COALESCE(v_prep_category, 'main');
        v_station := COALESCE(v_station, 'KITCHEN');
        INSERT INTO public.gm_order_items (order_id, product_id, name_snapshot, price_snapshot, quantity, subtotal_cents, prep_time_seconds, prep_category, station, created_by_user_id, created_by_role, device_id)
        VALUES (v_order_id, v_prod_id, v_prod_name, v_unit_price, v_qty, v_item_total, v_prep_time_seconds, v_prep_category, v_station, (v_item->>'created_by_user_id')::UUID, v_item->>'created_by_role', v_item->>'device_id');
    END LOOP;
    RETURN jsonb_build_object('id', v_order_id, 'total_cents', v_total_cents, 'subtotal_cents', v_total_cents - v_total_tax_cents, 'tax_cents', v_total_tax_cents, 'status', 'OPEN', 'idempotent', false);
EXCEPTION WHEN unique_violation THEN
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, total_cents, subtotal_cents, tax_cents, status INTO v_existing_order_id, v_existing_total_cents, v_existing_subtotal_cents, v_existing_tax_cents, v_existing_status
          FROM public.gm_orders WHERE restaurant_id = p_restaurant_id AND idempotency_key = p_idempotency_key ORDER BY created_at DESC LIMIT 1;
        IF v_existing_order_id IS NOT NULL THEN
            RETURN jsonb_build_object('id', v_existing_order_id, 'total_cents', COALESCE(v_existing_total_cents,0), 'subtotal_cents', COALESCE(v_existing_subtotal_cents,0), 'tax_cents', COALESCE(v_existing_tax_cents,0), 'status', COALESCE(v_existing_status,'OPEN'), 'idempotent', true);
        END IF;
    END IF;
    RAISE EXCEPTION 'TABLE_HAS_ACTIVE_ORDER: Esta mesa já possui um pedido aberto';
END;
$$;

-- 8. Patch update_order_status — use _billing_guard_order (KDS)
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_restaurant_id UUID,
    p_new_status TEXT,
    p_actor_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_id UUID;
    v_old_status TEXT;
BEGIN
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'ACTOR_REQUIRED: p_actor_user_id is required for order status transitions';
    END IF;
    IF NOT public.gm_has_role(p_restaurant_id, p_actor_user_id, 'manager') THEN
        RAISE EXCEPTION 'UNAUTHORIZED: actor lacks required role for order status transitions';
    END IF;
    PERFORM public._billing_guard_order(p_restaurant_id);
    IF p_new_status NOT IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Status inválido: %', p_new_status;
    END IF;
    SELECT status INTO v_old_status FROM public.gm_orders WHERE id = p_order_id AND restaurant_id = p_restaurant_id;
    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;
    UPDATE public.gm_orders SET status = p_new_status WHERE id = p_order_id AND restaurant_id = p_restaurant_id
    RETURNING id INTO v_updated_id;
    RETURN jsonb_build_object('success', true, 'order_id', v_updated_id, 'old_status', v_old_status, 'new_status', p_new_status);
END;
$$;
