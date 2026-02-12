-- =============================================================================
-- Migration: CDC Event Store Expansion
-- Date: 2026-02-19
-- Purpose:
--   Expand CDC (Change Data Capture) triggers to emit events for:
--   1. ORDER_STATUS_CHANGED — on gm_orders status UPDATE
--   2. ORDER_PAID — on gm_payments INSERT with status='paid'
--   3. STOCK_CONSUMED — on gm_stock_ledger INSERT with action='CONSUME'
--   4. SHIFT_CLOSED — on gm_cash_registers status → 'closed'
--
-- Existing trigger: ORDER_CREATED (20260210_cdc_orders_event_store.sql)
-- =============================================================================

-- =============================================================================
-- 1. ORDER_STATUS_CHANGED
-- =============================================================================
-- Emits when order status changes (UPDATE on gm_orders.status).
-- Payload includes old_status and new_status for state machine tracking.

CREATE OR REPLACE FUNCTION public.emit_order_status_changed_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
BEGIN
    -- Only emit if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'ORDER'
      AND stream_id = NEW.id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta
    ) VALUES (
        gen_random_uuid(),
        'ORDER',
        NEW.id::text,
        v_next_version,
        'ORDER_STATUS_CHANGED',
        jsonb_build_object(
            'orderId', NEW.id,
            'restaurantId', NEW.restaurant_id,
            'oldStatus', OLD.status,
            'newStatus', NEW.status,
            'totalCents', NEW.total_cents,
            'taxCents', NEW.tax_cents,
            'tableId', NEW.table_id
        ),
        jsonb_build_object('schema_version', '1')
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_order_status_changed ON public.gm_orders;

CREATE TRIGGER trg_emit_order_status_changed
AFTER UPDATE OF status ON public.gm_orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.emit_order_status_changed_event();

-- =============================================================================
-- 2. ORDER_PAID
-- =============================================================================
-- Emits when a payment is recorded as 'paid'.

CREATE OR REPLACE FUNCTION public.emit_order_paid_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
    v_order_total INTEGER;
    v_total_paid BIGINT;
BEGIN
    -- Only emit for successful payments
    IF NEW.status != 'paid' THEN
        RETURN NEW;
    END IF;

    -- Get order total for context
    SELECT total_cents INTO v_order_total
    FROM public.gm_orders
    WHERE id = NEW.order_id;

    -- Calculate total paid so far
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
    FROM public.gm_payments
    WHERE order_id = NEW.order_id
      AND status = 'paid';

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'PAYMENT'
      AND stream_id = NEW.order_id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta
    ) VALUES (
        gen_random_uuid(),
        'PAYMENT',
        NEW.order_id::text,
        v_next_version,
        'ORDER_PAID',
        jsonb_build_object(
            'paymentId', NEW.id,
            'orderId', NEW.order_id,
            'restaurantId', NEW.restaurant_id,
            'amountCents', NEW.amount_cents,
            'paymentMethod', NEW.payment_method,
            'currency', NEW.currency,
            'cashRegisterId', NEW.cash_register_id,
            'orderTotalCents', v_order_total,
            'totalPaidCents', v_total_paid,
            'isFullyPaid', v_total_paid >= v_order_total
        ),
        jsonb_build_object('schema_version', '1')
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_order_paid ON public.gm_payments;

CREATE TRIGGER trg_emit_order_paid
AFTER INSERT ON public.gm_payments
FOR EACH ROW
WHEN (NEW.status = 'paid')
EXECUTE FUNCTION public.emit_order_paid_event();

-- =============================================================================
-- 3. STOCK_CONSUMED
-- =============================================================================
-- Emits when stock is consumed (action='CONSUME' on gm_stock_ledger).
-- Batched per order_id to avoid excessive events.

CREATE OR REPLACE FUNCTION public.emit_stock_consumed_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
    v_ingredient_name TEXT;
BEGIN
    -- Only emit for CONSUME actions
    IF NEW.action != 'CONSUME' THEN
        RETURN NEW;
    END IF;

    -- Get ingredient name for readability
    SELECT name INTO v_ingredient_name
    FROM public.gm_ingredients
    WHERE id = NEW.ingredient_id;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'STOCK'
      AND stream_id = NEW.ingredient_id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta
    ) VALUES (
        gen_random_uuid(),
        'STOCK',
        NEW.ingredient_id::text,
        v_next_version,
        'STOCK_CONSUMED',
        jsonb_build_object(
            'ingredientId', NEW.ingredient_id,
            'ingredientName', v_ingredient_name,
            'locationId', NEW.location_id,
            'restaurantId', NEW.restaurant_id,
            'orderId', NEW.order_id,
            'orderItemId', NEW.order_item_id,
            'qty', NEW.qty,
            'reason', NEW.reason
        ),
        jsonb_build_object('schema_version', '1')
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_stock_consumed ON public.gm_stock_ledger;

CREATE TRIGGER trg_emit_stock_consumed
AFTER INSERT ON public.gm_stock_ledger
FOR EACH ROW
WHEN (NEW.action = 'CONSUME')
EXECUTE FUNCTION public.emit_stock_consumed_event();

-- =============================================================================
-- 4. SHIFT_CLOSED
-- =============================================================================
-- Emits when a cash register is closed (status → 'closed').

CREATE OR REPLACE FUNCTION public.emit_shift_closed_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
BEGIN
    -- Only emit when transitioning TO closed
    IF OLD.status = 'closed' OR NEW.status != 'closed' THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'SHIFT'
      AND stream_id = NEW.id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta
    ) VALUES (
        gen_random_uuid(),
        'SHIFT',
        NEW.id::text,
        v_next_version,
        'SHIFT_CLOSED',
        jsonb_build_object(
            'cashRegisterId', NEW.id,
            'restaurantId', NEW.restaurant_id,
            'name', NEW.name,
            'openedAt', NEW.opened_at,
            'closedAt', NEW.closed_at,
            'openedBy', NEW.opened_by,
            'closedBy', NEW.closed_by,
            'openingBalanceCents', NEW.opening_balance_cents,
            'closingBalanceCents', NEW.closing_balance_cents,
            'totalSalesCents', NEW.total_sales_cents
        ),
        jsonb_build_object('schema_version', '1')
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_shift_closed ON public.gm_cash_registers;

CREATE TRIGGER trg_emit_shift_closed
AFTER UPDATE OF status ON public.gm_cash_registers
FOR EACH ROW
WHEN (NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed')
EXECUTE FUNCTION public.emit_shift_closed_event();

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.emit_order_status_changed_event TO postgres;
GRANT EXECUTE ON FUNCTION public.emit_order_paid_event TO postgres;
GRANT EXECUTE ON FUNCTION public.emit_stock_consumed_event TO postgres;
GRANT EXECUTE ON FUNCTION public.emit_shift_closed_event TO postgres;
