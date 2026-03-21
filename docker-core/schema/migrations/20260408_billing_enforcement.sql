-- =============================================================================
-- Migration: Billing Enforcement — Server-side subscription guard
-- Date: 2026-04-08
-- Purpose:
--   1. Expand billing_status CHECK to 7 values (add incomplete, paused, trial_expired)
--   2. Create gm_billing_events reconciliation table
--   3. Create require_active_subscription() guard function (3-tier: allow/readonly/block)
--   4. Inject billing guard into all write RPCs
--   5. Create create_shift RPC wrapper with guard
--   6. Update sync_stripe_subscription_from_event with expanded status mapping + event logging
-- Ref: docs/audit/ENDPOINT_RISK_AUDIT.md, billing-core, SYSTEM_TRUTH_CODEX.md
-- =============================================================================

-- =============================================================================
-- 1. Expand billing_status CHECK constraint
-- =============================================================================
-- Current: trial, active, past_due, canceled (4 values)
-- Target:  trial, active, past_due, incomplete, paused, canceled, trial_expired (7 values)

ALTER TABLE public.gm_restaurants
  DROP CONSTRAINT IF EXISTS gm_restaurants_billing_status_check;

ALTER TABLE public.gm_restaurants
  ADD CONSTRAINT gm_restaurants_billing_status_check
  CHECK (billing_status = ANY (ARRAY[
    'trial', 'active', 'past_due', 'incomplete', 'paused', 'canceled', 'trial_expired'
  ]));

-- Ensure NOT NULL with safe default
DO $$
BEGIN
  -- Backfill any NULLs before adding NOT NULL
  UPDATE public.gm_restaurants SET billing_status = 'trial' WHERE billing_status IS NULL;

  -- Add NOT NULL if not already set
  ALTER TABLE public.gm_restaurants ALTER COLUMN billing_status SET NOT NULL;
  ALTER TABLE public.gm_restaurants ALTER COLUMN billing_status SET DEFAULT 'trial';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'billing_status NOT NULL already set or skipped: %', SQLERRM;
END;
$$;

-- =============================================================================
-- 2. gm_billing_events — Reconciliation / audit log
-- =============================================================================
-- Every Stripe event that changes billing_status is recorded here.
-- stripe_event_id is unique to ensure idempotent processing.

CREATE TABLE IF NOT EXISTS public.gm_billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE SET NULL,
    stripe_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    payload JSONB DEFAULT '{}'::JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_billing_events_stripe_event
    ON public.gm_billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_gm_billing_events_restaurant
    ON public.gm_billing_events(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gm_billing_events_type
    ON public.gm_billing_events(event_type, created_at DESC);

COMMENT ON TABLE public.gm_billing_events IS
  'Billing reconciliation log. Every Stripe event that changes billing_status is recorded. stripe_event_id is unique for idempotency.';

-- =============================================================================
-- 3. require_active_subscription() — Core billing guard
-- =============================================================================
-- 3-tier decision:
--   trial / active             → RETURN (allowed)
--   past_due + write_operation → RAISE SUBSCRIPTION_READONLY
--   past_due + read-only       → RETURN (allowed in readonly mode)
--   incomplete / paused / canceled / trial_expired → RAISE SUBSCRIPTION_BLOCKED
--
-- p_write_operation: true for mutations (create_order, update_order, close_cash),
--                    false for read-only queries that want to respect billing.

CREATE OR REPLACE FUNCTION public.require_active_subscription(
    p_restaurant_id UUID,
    p_write_operation BOOLEAN DEFAULT true
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

    -- Restaurant not found — hard block
    IF v_status IS NULL THEN
        RAISE EXCEPTION 'SUBSCRIPTION_BLOCKED: Restaurant not found or billing_status is NULL [restaurant_id=%]', p_restaurant_id;
    END IF;

    -- Tier 1: Allowed
    IF v_status IN ('trial', 'active') THEN
        RETURN;
    END IF;

    -- Tier 2: Readonly (past_due allows reads, blocks writes)
    IF v_status = 'past_due' THEN
        IF p_write_operation THEN
            RAISE EXCEPTION 'SUBSCRIPTION_READONLY: Subscription is past_due — write operations are blocked. Please update your payment method. [restaurant_id=%, status=%]', p_restaurant_id, v_status;
        END IF;
        -- Read-only operation allowed for past_due
        RETURN;
    END IF;

    -- Tier 3: Hard block (incomplete, paused, canceled, trial_expired)
    RAISE EXCEPTION 'SUBSCRIPTION_BLOCKED: Subscription is % — all operations are blocked. Please reactivate your subscription. [restaurant_id=%, status=%]', v_status, p_restaurant_id, v_status;
END;
$$;

COMMENT ON FUNCTION public.require_active_subscription IS
  'Billing guard: 3-tier decision (allow/readonly/block). Inject PERFORM require_active_subscription(restaurant_id) into write RPCs. Ref: billing-core enforcement.';

GRANT EXECUTE ON FUNCTION public.require_active_subscription TO postgres;
GRANT EXECUTE ON FUNCTION public.require_active_subscription TO service_role;

-- =============================================================================
-- 4. create_shift — New RPC wrapper for shift_logs with billing guard
-- =============================================================================
-- Previously shift_logs was INSERT-only (no RPC). This wrapper enforces billing.

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
    -- Billing guard: block if subscription not active
    PERFORM public.require_active_subscription(p_restaurant_id);

    INSERT INTO public.shift_logs (
        restaurant_id,
        employee_id,
        role,
        start_time,
        status
    ) VALUES (
        p_restaurant_id,
        p_employee_id,
        p_role,
        NOW(),
        'active'
    )
    RETURNING id INTO v_shift_id;

    RETURN jsonb_build_object(
        'success', true,
        'shift_id', v_shift_id,
        'restaurant_id', p_restaurant_id,
        'employee_id', p_employee_id,
        'role', p_role,
        'start_time', NOW()
    );
END;
$$;

COMMENT ON FUNCTION public.create_shift IS
  'Core RPC: Creates a shift log entry with billing guard enforcement.';

GRANT EXECUTE ON FUNCTION public.create_shift TO postgres;
GRANT EXECUTE ON FUNCTION public.create_shift TO service_role;

-- =============================================================================
-- 5. Inject billing guard into create_order_atomic
-- =============================================================================
-- Guard injected: after idempotency fast-path, before tax calculation.

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

    -- ** BILLING GUARD: block writes if subscription not active **
    PERFORM public.require_active_subscription(p_restaurant_id);

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
'Official Core RPC: Creates order atomically with IVA tax calculation. Tax-inclusive pricing (EU standard). Enforces billing guard + constitutional constraints. Supports idempotent retries via p_idempotency_key.';

-- =============================================================================
-- 6. Inject billing guard into update_order_status
-- =============================================================================
-- Guard injected: after RBAC check, before status validation.

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
    -- RBAC: actor is required (no bypass)
    IF p_actor_user_id IS NULL THEN
        RAISE EXCEPTION 'ACTOR_REQUIRED: p_actor_user_id is required for order status transitions';
    END IF;

    IF NOT public.gm_has_role(p_restaurant_id, p_actor_user_id, 'manager') THEN
        RAISE EXCEPTION 'UNAUTHORIZED: actor lacks required role for order status transitions';
    END IF;

    -- ** BILLING GUARD: block writes if subscription not active **
    PERFORM public.require_active_subscription(p_restaurant_id);

    -- Validate status value
    IF p_new_status NOT IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Status inválido: %', p_new_status;
    END IF;

    -- Get current status for return info
    SELECT status INTO v_old_status
    FROM public.gm_orders
    WHERE id = p_order_id AND restaurant_id = p_restaurant_id;

    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Pedido não encontrado ou não pertence ao restaurante';
    END IF;

    -- Update status (trigger will validate transition + set timestamps)
    UPDATE public.gm_orders
    SET status = p_new_status
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id
    RETURNING id INTO v_updated_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_updated_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$;

COMMENT ON FUNCTION public.update_order_status IS
'Core RPC: Updates order status. ACTOR_REQUIRED + BILLING_GUARD enforced.';

-- =============================================================================
-- 7. Inject billing guard into close_cash_register_atomic
-- =============================================================================
-- Guard injected: after v_register fetch, using v_register.restaurant_id.

CREATE OR REPLACE FUNCTION public.close_cash_register_atomic(
    p_cash_register_id UUID,
    p_closed_by TEXT DEFAULT NULL,
    p_declared_closing_cents BIGINT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_register RECORD;
    v_z_report JSONB;
    v_expected_cash_cents BIGINT;
    v_cash_payments_cents BIGINT;
    v_difference_cents BIGINT;
BEGIN
    -- Get register and validate
    SELECT * INTO v_register
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id;

    IF v_register IS NULL THEN
        RAISE EXCEPTION 'CASH_REGISTER_NOT_FOUND: Cash register % not found', p_cash_register_id;
    END IF;

    IF v_register.status = 'closed' THEN
        RAISE EXCEPTION 'CASH_REGISTER_ALREADY_CLOSED: Cash register % is already closed', p_cash_register_id;
    END IF;

    -- ** BILLING GUARD: block writes if subscription not active **
    PERFORM public.require_active_subscription(v_register.restaurant_id);

    -- Generate Z-Report
    v_z_report := public.generate_shift_close_report(p_cash_register_id);

    -- Calculate expected cash in drawer
    SELECT COALESCE(SUM(p.amount_cents), 0)::BIGINT INTO v_cash_payments_cents
    FROM public.gm_payments p
    WHERE p.cash_register_id = p_cash_register_id
      AND p.payment_method = 'cash'
      AND p.status = 'paid';

    v_expected_cash_cents := v_register.opening_balance_cents + v_cash_payments_cents;

    IF p_declared_closing_cents IS NOT NULL THEN
        v_difference_cents := p_declared_closing_cents - v_expected_cash_cents;
    ELSE
        v_difference_cents := 0;
    END IF;

    -- Close the register
    UPDATE public.gm_cash_registers
    SET
        status = 'closed',
        closed_at = NOW(),
        closed_by = p_closed_by,
        closing_balance_cents = COALESCE(p_declared_closing_cents, v_expected_cash_cents),
        total_sales_cents = (v_z_report->>'total_gross_cents')::BIGINT,
        updated_at = NOW()
    WHERE id = p_cash_register_id;

    -- Persist Z-report to gm_z_reports (audit trail)
    INSERT INTO public.gm_z_reports (
        restaurant_id,
        cash_register_id,
        report_date,
        report_type,
        z_report,
        closed_by,
        closed_at,
        notes
    ) VALUES (
        v_register.restaurant_id,
        p_cash_register_id,
        CURRENT_DATE,
        'shift',
        v_z_report || jsonb_build_object(
            'closing_balance_cents', COALESCE(p_declared_closing_cents, v_expected_cash_cents),
            'expected_cash_cents', v_expected_cash_cents,
            'declared_cash_cents', p_declared_closing_cents,
            'difference_cents', v_difference_cents,
            'closed_by', p_closed_by,
            'closed_at', NOW()
        ),
        p_closed_by,
        NOW(),
        NULL
    );

    -- Return full Z-Report + reconciliation info
    RETURN v_z_report || jsonb_build_object(
        'closing_balance_cents', COALESCE(p_declared_closing_cents, v_expected_cash_cents),
        'expected_cash_cents', v_expected_cash_cents,
        'declared_cash_cents', p_declared_closing_cents,
        'difference_cents', v_difference_cents,
        'closed_by', p_closed_by,
        'closed_at', NOW()
    );
END;
$$;

COMMENT ON FUNCTION public.close_cash_register_atomic IS
'Core RPC: Closes cash register atomically. BILLING_GUARD enforced. Generates Z-Report, persists to gm_z_reports, returns snapshot.';

-- =============================================================================
-- 8. Inject billing guard into generate_tasks_if_idle
-- =============================================================================
-- Guard injected: at function beginning (before any logic).

CREATE OR REPLACE FUNCTION public.generate_tasks_if_idle(
  p_restaurant_id UUID,
  p_idle_minutes_threshold INTEGER DEFAULT 5,
  p_message TEXT DEFAULT 'Modo interno: sem pedidos ativos. Checklist e organização.'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_orders INTEGER;
  v_idle_minutes NUMERIC;
  v_shift_open BOOLEAN;
  v_last_order_at TIMESTAMPTZ;
  v_task_id UUID;
BEGIN
  -- ** BILLING GUARD: block writes if subscription not active **
  PERFORM public.require_active_subscription(p_restaurant_id);

  -- KDS_LOAD: pedidos ativos
  SELECT COUNT(*) INTO v_active_orders
  FROM public.gm_orders
  WHERE restaurant_id = p_restaurant_id
    AND status IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY');

  IF v_active_orders > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'active_orders',
      'active_orders', v_active_orders,
      'generated', 0
    );
  END IF;

  -- shiftOpen: caixa aberta
  SELECT EXISTS (
    SELECT 1 FROM public.gm_cash_registers
    WHERE restaurant_id = p_restaurant_id
      AND status = 'open'
  ) INTO v_shift_open;

  IF NOT v_shift_open THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'shift_closed',
      'generated', 0
    );
  END IF;

  -- idleMinutesSinceLastOrder
  SELECT MAX(created_at) INTO v_last_order_at
  FROM public.gm_orders
  WHERE restaurant_id = p_restaurant_id;

  IF v_last_order_at IS NULL THEN
    v_idle_minutes := 999;
  ELSE
    v_idle_minutes := EXTRACT(EPOCH FROM (NOW() - v_last_order_at)) / 60;
  END IF;

  IF v_idle_minutes < p_idle_minutes_threshold THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'idle_under_threshold',
      'idle_minutes', ROUND(v_idle_minutes::numeric, 1),
      'threshold', p_idle_minutes_threshold,
      'generated', 0
    );
  END IF;

  -- Idempotência: já existe tarefa OPEN restaurant_idle?
  IF EXISTS (
    SELECT 1 FROM public.gm_tasks
    WHERE restaurant_id = p_restaurant_id
      AND status = 'OPEN'
      AND source_event = 'restaurant_idle'
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'reason', 'idempotent_skip',
      'generated', 0
    );
  END IF;

  -- Criar tarefa MODO_INTERNO
  INSERT INTO public.gm_tasks (
    restaurant_id,
    task_type,
    message,
    station,
    priority,
    context,
    source_event,
    auto_generated
  ) VALUES (
    p_restaurant_id,
    'MODO_INTERNO',
    p_message,
    'KITCHEN',
    'MEDIA',
    jsonb_build_object('idle_minutes', ROUND(v_idle_minutes::numeric, 1), 'generated_at', NOW()),
    'restaurant_idle',
    true
  )
  RETURNING id INTO v_task_id;

  RETURN jsonb_build_object(
    'success', true,
    'reason', 'generated',
    'task_id', v_task_id,
    'generated', 1
  );
END;
$$;

COMMENT ON FUNCTION public.generate_tasks_if_idle IS 'Gera tarefa MODO_INTERNO quando KDS vazio, turno aberto e idle >= threshold. BILLING_GUARD enforced. Idempotente. Ref: FLOW_KDS_TASKS_TABLES.';

-- =============================================================================
-- 9. Inject billing guard into claim_task
-- =============================================================================
-- Guard injected: resolve restaurant_id from task if NULL, then check billing.

CREATE OR REPLACE FUNCTION public.claim_task(
  p_task_id UUID,
  p_actor_id UUID,
  p_restaurant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id UUID;
BEGIN
  -- Resolve restaurant_id from task if not provided
  v_restaurant_id := p_restaurant_id;
  IF v_restaurant_id IS NULL THEN
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.gm_tasks
    WHERE id = p_task_id;
  END IF;

  -- ** BILLING GUARD: block writes if subscription not active **
  IF v_restaurant_id IS NOT NULL THEN
    PERFORM public.require_active_subscription(v_restaurant_id);
  END IF;

  -- assign + start atomicamente
  PERFORM public.assign_task(p_task_id, p_actor_id, p_restaurant_id);
  PERFORM public.start_task(p_task_id, p_actor_id, p_restaurant_id);
END;
$$;

COMMENT ON FUNCTION public.claim_task IS 'Atribui e inicia tarefa (assign + start). BILLING_GUARD enforced. Ref: FLOW_KDS_TASKS_TABLES.';

-- =============================================================================
-- 10. Update sync_stripe_subscription_from_event — expanded status mapping + event logging
-- =============================================================================
-- Changes:
--   - incomplete → 'incomplete' (was 'past_due')
--   - incomplete_expired → 'trial_expired' (was 'past_due')
--   - paused → 'paused' (new mapping)
--   - Logs every status change to gm_billing_events

CREATE OR REPLACE FUNCTION public.sync_stripe_subscription_from_event(
  p_event_type TEXT,
  p_payload JSONB,
  p_event_created_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(updated_restaurant_id UUID, billing_status TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_restaurant_id UUID;
  v_customer_id TEXT;
  v_stripe_status TEXT;
  v_trial_end TIMESTAMPTZ;
  v_canceled_at TIMESTAMPTZ;
  v_core_status TEXT;
  v_previous_status TEXT;
  v_sub_id TEXT;
  v_obj JSONB;
  v_current_event_at TIMESTAMPTZ;
  v_expected_currency TEXT;
  v_event_currency TEXT;
  v_expected_price_id TEXT;
  v_event_price_id TEXT;
  v_has_billing_status BOOLEAN;
  v_has_trial_ends BOOLEAN;
  v_has_last_event BOOLEAN;
  v_has_subscriptions BOOLEAN;
  v_has_billing_events BOOLEAN;
  v_event_id TEXT;
BEGIN
  v_obj := p_payload->'data'->'object';
  IF v_obj IS NULL THEN
    v_obj := p_payload;
  END IF;
  v_event_id := p_payload->>'id';

  -- Feature-detect columns/tables to keep function safe across migrations
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='billing_status') INTO v_has_billing_status;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='trial_ends_at') INTO v_has_trial_ends;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='last_billing_event_at') INTO v_has_last_event;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='merchant_subscriptions') INTO v_has_subscriptions;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_billing_events') INTO v_has_billing_events;

  -- 1. Resolve restaurant_id
  v_restaurant_id := (v_obj->'metadata'->>'restaurant_id')::UUID;
  IF v_restaurant_id IS NULL AND p_event_type LIKE 'customer.subscription.%' THEN
    v_customer_id := v_obj->>'customer';
    IF v_customer_id IS NOT NULL AND v_has_subscriptions THEN
      SELECT restaurant_id INTO v_restaurant_id
      FROM public.merchant_subscriptions
      WHERE stripe_customer_id = v_customer_id
      LIMIT 1;
    END IF;
  END IF;

  -- invoice events also need customer -> restaurant resolution
  IF v_restaurant_id IS NULL AND p_event_type LIKE 'invoice.%' THEN
    v_customer_id := v_obj->>'customer';
    IF v_customer_id IS NOT NULL AND v_has_subscriptions THEN
      SELECT restaurant_id INTO v_restaurant_id
      FROM public.merchant_subscriptions
      WHERE stripe_customer_id = v_customer_id
      LIMIT 1;
    END IF;
  END IF;

  IF v_restaurant_id IS NULL THEN
    IF v_event_id IS NOT NULL AND v_event_id <> '' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents') THEN
      INSERT INTO public.billing_incidents (
        restaurant_id, provider, event_id, event_type, reason,
        expected_currency, event_currency, expected_price_id, event_price_id, payload
      )
      VALUES (
        NULL, 'stripe', v_event_id, p_event_type, 'tenant_not_found',
        NULL, NULL, NULL, NULL,
        jsonb_build_object('customer_id', v_obj->>'customer')
      )
      ON CONFLICT (event_id, reason) DO NOTHING;
    END IF;
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, 'No restaurant_id in metadata or merchant_subscriptions'::TEXT;
    RETURN;
  END IF;

  -- Capture previous status for reconciliation log
  IF v_has_billing_status THEN
    SELECT gr.billing_status INTO v_previous_status
    FROM public.gm_restaurants gr
    WHERE gr.id = v_restaurant_id;
  END IF;

  -- 2. Stale event guard: skip if we already processed a newer event
  IF p_event_created_at IS NOT NULL THEN
    SELECT last_billing_event_at INTO v_current_event_at
    FROM public.gm_restaurants
    WHERE id = v_restaurant_id;

    IF v_current_event_at IS NOT NULL AND v_current_event_at >= p_event_created_at THEN
      IF v_event_id IS NOT NULL AND v_event_id <> '' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents') THEN
        INSERT INTO public.billing_incidents (
          restaurant_id, provider, event_id, event_type, reason,
          expected_currency, event_currency, expected_price_id, event_price_id, payload
        )
        VALUES (
          v_restaurant_id, 'stripe', v_event_id, p_event_type, 'stale_event',
          NULL, NULL, NULL, NULL,
          jsonb_build_object('current_last_event_at', v_current_event_at, 'event_created_at', p_event_created_at)
        )
        ON CONFLICT (event_id, reason) DO NOTHING;
      END IF;
      RETURN QUERY SELECT v_restaurant_id, NULL::TEXT,
        ('Stale event skipped: event ' || p_event_created_at::TEXT || ' <= current ' || v_current_event_at::TEXT)::TEXT;
      RETURN;
    END IF;
  END IF;

  -- 3. Currency + price coherence (defensive)
  IF p_event_type IN ('customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted') THEN
    v_event_currency := LOWER(COALESCE(v_obj->>'currency', ''));
  ELSIF p_event_type LIKE 'invoice.%' THEN
    v_event_currency := LOWER(COALESCE(
      v_obj->>'currency',
      (v_obj->'lines'->'data'->0->'price'->>'currency')
    ));
  ELSE
    v_event_currency := NULL;
  END IF;

  IF v_event_currency IS NOT NULL AND v_event_currency <> '' THEN
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='billing_currency'
      ) THEN
        SELECT LOWER(billing_currency)::TEXT INTO v_expected_currency
        FROM public.gm_restaurants
        WHERE id = v_restaurant_id;
      ELSE
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='gm_restaurants' AND column_name='currency'
        ) THEN
          SELECT LOWER(currency)::TEXT INTO v_expected_currency
          FROM public.gm_restaurants
          WHERE id = v_restaurant_id;
        END IF;
      END IF;
    EXCEPTION WHEN others THEN
      v_expected_currency := NULL;
    END;

    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema='public' AND table_name='billing_plan_prices'
      ) AND v_has_subscriptions THEN
        SELECT LOWER(bpp.stripe_price_id)::TEXT INTO v_expected_price_id
        FROM public.merchant_subscriptions ms
        JOIN public.billing_plan_prices bpp
          ON bpp.plan_id = ms.plan_id
         AND LOWER(bpp.currency) = v_event_currency
        WHERE ms.restaurant_id = v_restaurant_id
        ORDER BY bpp.id
        LIMIT 1;
      END IF;
    EXCEPTION WHEN others THEN
      v_expected_price_id := NULL;
    END;

    IF p_event_type LIKE 'invoice.%' THEN
      v_event_price_id := COALESCE(
        v_obj->'lines'->'data'->0->'price'->>'id',
        v_obj->'lines'->'data'->0->'price'->>'product'
      );
    ELSIF p_event_type LIKE 'customer.subscription.%' THEN
      v_event_price_id := COALESCE(
        v_obj->'items'->'data'->0->'price'->>'id',
        v_obj->'items'->'data'->0->'price'->>'product'
      );
    ELSE
      v_event_price_id := NULL;
    END IF;

    IF v_expected_currency IS NOT NULL AND v_expected_currency <> '' THEN
      IF v_expected_currency <> v_event_currency THEN
        IF v_event_id IS NOT NULL AND v_event_id <> '' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents') THEN
          INSERT INTO public.billing_incidents (
            restaurant_id, provider, event_id, event_type, reason,
            expected_currency, event_currency, expected_price_id, event_price_id, payload
          )
          VALUES (
            v_restaurant_id, 'stripe', v_event_id, p_event_type, 'currency_mismatch',
            v_expected_currency, v_event_currency, v_expected_price_id, v_event_price_id,
            jsonb_build_object('customer_id', v_customer_id, 'subscription_id', v_obj->>'id')
          )
          ON CONFLICT (event_id, reason) DO NOTHING;
        END IF;
        RETURN QUERY SELECT v_restaurant_id, NULL::TEXT,
          ('Currency mismatch: expected ' || v_expected_currency || ', got ' || v_event_currency)::TEXT;
        RETURN;
      END IF;
    END IF;

    IF v_expected_price_id IS NOT NULL AND v_expected_price_id <> '' AND v_event_price_id IS NOT NULL THEN
      IF v_expected_price_id <> v_event_price_id THEN
        IF v_event_id IS NOT NULL AND v_event_id <> '' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents') THEN
          INSERT INTO public.billing_incidents (
            restaurant_id, provider, event_id, event_type, reason,
            expected_currency, event_currency, expected_price_id, event_price_id, payload
          )
          VALUES (
            v_restaurant_id, 'stripe', v_event_id, p_event_type, 'price_mismatch',
            v_expected_currency, v_event_currency, v_expected_price_id, v_event_price_id,
            jsonb_build_object('customer_id', v_customer_id, 'subscription_id', v_obj->>'id')
          )
          ON CONFLICT (event_id, reason) DO NOTHING;
        END IF;
        RETURN QUERY SELECT v_restaurant_id, NULL::TEXT,
          ('Price mismatch: expected ' || v_expected_price_id || ', got ' || v_event_price_id)::TEXT;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- 4. Subscription events — EXPANDED STATUS MAPPING
  IF p_event_type IN ('customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted') THEN
    v_stripe_status := v_obj->>'status';
    v_trial_end := (v_obj->>'trial_end')::BIGINT;
    IF v_trial_end IS NOT NULL THEN
      v_trial_end := to_timestamp(v_trial_end) AT TIME ZONE 'UTC';
    END IF;
    v_canceled_at := (v_obj->>'canceled_at')::BIGINT;
    IF v_canceled_at IS NOT NULL THEN
      v_canceled_at := to_timestamp(v_canceled_at) AT TIME ZONE 'UTC';
    END IF;

    -- Expanded mapping (7 core statuses)
    v_core_status := CASE v_stripe_status
      WHEN 'trialing'           THEN 'trial'
      WHEN 'active'             THEN 'active'
      WHEN 'past_due'           THEN 'past_due'
      WHEN 'canceled'           THEN 'canceled'
      WHEN 'unpaid'             THEN 'canceled'
      WHEN 'incomplete'         THEN 'incomplete'
      WHEN 'incomplete_expired' THEN 'trial_expired'
      WHEN 'paused'             THEN 'paused'
      ELSE 'trial'
    END;

    IF v_has_billing_status THEN
      IF v_has_last_event THEN
        UPDATE public.gm_restaurants
        SET
          billing_status = v_core_status,
          trial_ends_at = COALESCE(v_trial_end, trial_ends_at),
          last_billing_event_at = COALESCE(p_event_created_at, NOW()),
          updated_at = NOW()
        WHERE id = v_restaurant_id;
      ELSE
        UPDATE public.gm_restaurants
        SET
          billing_status = v_core_status,
          trial_ends_at = COALESCE(v_trial_end, trial_ends_at),
          updated_at = NOW()
        WHERE id = v_restaurant_id;
      END IF;
    END IF;

    -- Log to gm_billing_events for reconciliation
    IF v_has_billing_events AND v_event_id IS NOT NULL AND v_event_id <> '' THEN
      INSERT INTO public.gm_billing_events (
        restaurant_id, stripe_event_id, event_type,
        previous_status, new_status, payload
      ) VALUES (
        v_restaurant_id, v_event_id, p_event_type,
        v_previous_status, v_core_status,
        jsonb_build_object(
          'stripe_status', v_stripe_status,
          'subscription_id', v_obj->>'id',
          'customer_id', v_obj->>'customer'
        )
      )
      ON CONFLICT (stripe_event_id) DO NOTHING;
    END IF;

    IF v_has_subscriptions THEN
      v_sub_id := v_obj->>'id';
      UPDATE public.merchant_subscriptions
      SET
        status = v_stripe_status,
        trial_end = v_trial_end,
        canceled_at = v_canceled_at,
        stripe_subscription_id = COALESCE(v_sub_id, stripe_subscription_id),
        updated_at = NOW()
      WHERE restaurant_id = v_restaurant_id;
    END IF;

    RETURN QUERY SELECT v_restaurant_id, v_core_status, 'Subscription sync applied'::TEXT;
    RETURN;
  END IF;

  -- 5. invoice.payment_failed → past_due
  IF p_event_type = 'invoice.payment_failed' THEN
    IF v_has_billing_status THEN
      IF v_has_last_event THEN
        UPDATE public.gm_restaurants
        SET billing_status = 'past_due',
            last_billing_event_at = COALESCE(p_event_created_at, NOW()),
            updated_at = NOW()
        WHERE id = v_restaurant_id;
      ELSE
        UPDATE public.gm_restaurants
        SET billing_status = 'past_due',
            updated_at = NOW()
        WHERE id = v_restaurant_id;
      END IF;

      -- Log to gm_billing_events
      IF v_has_billing_events AND v_event_id IS NOT NULL AND v_event_id <> '' THEN
        INSERT INTO public.gm_billing_events (
          restaurant_id, stripe_event_id, event_type,
          previous_status, new_status, payload
        ) VALUES (
          v_restaurant_id, v_event_id, p_event_type,
          v_previous_status, 'past_due',
          jsonb_build_object('invoice_id', v_obj->>'id', 'customer_id', v_obj->>'customer')
        )
        ON CONFLICT (stripe_event_id) DO NOTHING;
      END IF;

      RETURN QUERY SELECT v_restaurant_id, 'past_due'::TEXT, 'Marked past_due from invoice.payment_failed'::TEXT;
    END IF;
    RETURN;
  END IF;

  -- 6. invoice.paid → active
  IF p_event_type = 'invoice.paid' THEN
    IF v_has_billing_status THEN
      IF v_has_last_event THEN
        UPDATE public.gm_restaurants
        SET billing_status = 'active',
            last_billing_event_at = COALESCE(p_event_created_at, NOW()),
            updated_at = NOW()
        WHERE id = v_restaurant_id;
      ELSE
        UPDATE public.gm_restaurants
        SET billing_status = 'active',
            updated_at = NOW()
        WHERE id = v_restaurant_id;
      END IF;

      -- Log to gm_billing_events
      IF v_has_billing_events AND v_event_id IS NOT NULL AND v_event_id <> '' THEN
        INSERT INTO public.gm_billing_events (
          restaurant_id, stripe_event_id, event_type,
          previous_status, new_status, payload
        ) VALUES (
          v_restaurant_id, v_event_id, p_event_type,
          v_previous_status, 'active',
          jsonb_build_object('invoice_id', v_obj->>'id', 'customer_id', v_obj->>'customer')
        )
        ON CONFLICT (stripe_event_id) DO NOTHING;
      END IF;

      RETURN QUERY SELECT v_restaurant_id, 'active'::TEXT, 'Marked active from invoice.paid'::TEXT;
    END IF;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_restaurant_id, NULL::TEXT, ('Event type not applied: ' || p_event_type)::TEXT;
END;
$$;

COMMENT ON FUNCTION public.sync_stripe_subscription_from_event IS
  'Billing enforcement: sync gm_restaurants.billing_status from Stripe webhooks. Expanded mapping (7 statuses). Logs to gm_billing_events. Timestamp guard + billing_incidents audit trail.';

GRANT EXECUTE ON FUNCTION public.sync_stripe_subscription_from_event(TEXT, JSONB, TIMESTAMPTZ) TO service_role;

-- =============================================================================
-- GRANTs for guarded RPCs
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.create_order_atomic TO postgres;
GRANT EXECUTE ON FUNCTION public.update_order_status TO postgres;
GRANT EXECUTE ON FUNCTION public.close_cash_register_atomic TO postgres;
GRANT EXECUTE ON FUNCTION public.generate_tasks_if_idle TO postgres;
GRANT EXECUTE ON FUNCTION public.claim_task TO postgres;
