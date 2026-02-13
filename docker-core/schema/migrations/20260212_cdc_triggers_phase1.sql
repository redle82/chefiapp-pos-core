-- =============================================================================
-- PHASE 1B — CDC TRIGGERS EXPANSION: Missing Event Types
-- =============================================================================
-- Date: 2026-02-12
-- Priority: HIGH (complete event coverage for audit trail)
-- Context: Existing CDC triggers cover ORDER_CREATED, ORDER_STATUS_CHANGED,
--          ORDER_PAID, STOCK_CONSUMED, SHIFT_CLOSED, PRODUCT_CREATED/UPDATED/DELETED.
--
-- This migration adds:
--   1. ORDER_CANCELLED — explicit event when order reaches CANCELLED state
--   2. PAYMENT_REFUNDED — on gm_payments status → 'refunded'
--   3. SHIFT_OPENED — on gm_cash_registers INSERT with status='open'
--   4. ORDER_ITEM_ADDED — on gm_order_items INSERT
--   5. ORDER_ITEM_REMOVED — on gm_order_items DELETE
--   6. PAYMENT_STATUS_CHANGED — general payment status changes (failed, etc.)
--
-- All triggers populate hash chain columns (hash computed by BEFORE INSERT trigger
-- from 20260212_event_store_hash_chain.sql) and actor_ref for non-repudiation.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. ORDER_CANCELLED
-- =============================================================================
-- Fires when order status transitions to CANCELLED. Captures reason from notes.
-- Separate from ORDER_STATUS_CHANGED for legal boundary: cancellation is a
-- fiscally significant event that may require a credit note.

CREATE OR REPLACE FUNCTION public.emit_order_cancelled_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
    v_items_count INTEGER;
    v_items_total INTEGER;
BEGIN
    -- Only fire on transition TO CANCELLED
    IF NEW.status != 'CANCELLED' OR OLD.status = 'CANCELLED' THEN
        RETURN NEW;
    END IF;

    -- Get item counts for context
    SELECT COUNT(*), COALESCE(SUM(subtotal_cents), 0)
    INTO v_items_count, v_items_total
    FROM public.gm_order_items
    WHERE order_id = NEW.id;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'ORDER'
      AND stream_id = NEW.id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta, restaurant_id,
        actor_ref
    ) VALUES (
        gen_random_uuid(),
        'ORDER',
        NEW.id::text,
        v_next_version,
        'ORDER_CANCELLED',
        jsonb_build_object(
            'orderId', NEW.id,
            'restaurantId', NEW.restaurant_id,
            'previousStatus', OLD.status,
            'previousPaymentStatus', OLD.payment_status,
            'totalCents', NEW.total_cents,
            'itemsCount', v_items_count,
            'itemsTotalCents', v_items_total,
            'tableId', NEW.table_id,
            'reason', NEW.notes,
            'cancelledAt', NOW()
        ),
        jsonb_build_object(
            'schema_version', '1',
            'trigger', 'cdc_order_cancelled',
            'fiscal_event', true
        ),
        NEW.restaurant_id,
        NEW.operator_id::text
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_order_cancelled ON public.gm_orders;

CREATE TRIGGER trg_emit_order_cancelled
    AFTER UPDATE OF status ON public.gm_orders
    FOR EACH ROW
    WHEN (NEW.status = 'CANCELLED' AND OLD.status IS DISTINCT FROM 'CANCELLED')
    EXECUTE FUNCTION public.emit_order_cancelled_event();

-- =============================================================================
-- 2. PAYMENT_REFUNDED
-- =============================================================================
-- Fires when payment status transitions to 'refunded'.
-- Fiscally significant: requires credit note generation.

CREATE OR REPLACE FUNCTION public.emit_payment_refunded_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
    v_order_total INTEGER;
    v_remaining_paid BIGINT;
BEGIN
    -- Only fire on transition TO refunded
    IF NEW.status != 'refunded' OR OLD.status = 'refunded' THEN
        RETURN NEW;
    END IF;

    -- Get order total for context
    SELECT total_cents INTO v_order_total
    FROM public.gm_orders
    WHERE id = NEW.order_id;

    -- Calculate remaining paid amount after this refund
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_remaining_paid
    FROM public.gm_payments
    WHERE order_id = NEW.order_id
      AND status = 'paid'
      AND id != NEW.id;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'PAYMENT'
      AND stream_id = NEW.order_id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta, restaurant_id,
        actor_ref
    ) VALUES (
        gen_random_uuid(),
        'PAYMENT',
        NEW.order_id::text,
        v_next_version,
        'PAYMENT_REFUNDED',
        jsonb_build_object(
            'paymentId', NEW.id,
            'orderId', NEW.order_id,
            'restaurantId', NEW.restaurant_id,
            'amountCents', NEW.amount_cents,
            'paymentMethod', NEW.payment_method,
            'currency', NEW.currency,
            'cashRegisterId', NEW.cash_register_id,
            'orderTotalCents', v_order_total,
            'remainingPaidCents', v_remaining_paid,
            'previousStatus', OLD.status,
            'refundedAt', NOW()
        ),
        jsonb_build_object(
            'schema_version', '1',
            'trigger', 'cdc_payment_refunded',
            'fiscal_event', true,
            'requires_credit_note', true
        ),
        NEW.restaurant_id,
        NEW.operator_id::text
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_payment_refunded ON public.gm_payments;

CREATE TRIGGER trg_emit_payment_refunded
    AFTER UPDATE OF status ON public.gm_payments
    FOR EACH ROW
    WHEN (NEW.status = 'refunded' AND OLD.status IS DISTINCT FROM 'refunded')
    EXECUTE FUNCTION public.emit_payment_refunded_event();

-- =============================================================================
-- 3. SHIFT_OPENED
-- =============================================================================
-- Fires when a new cash register session opens.
-- Paired with SHIFT_CLOSED for complete session tracking.

CREATE OR REPLACE FUNCTION public.emit_shift_opened_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
BEGIN
    -- Only emit for opening (status = 'open')
    IF NEW.status != 'open' THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'SHIFT'
      AND stream_id = NEW.id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta, restaurant_id,
        actor_ref
    ) VALUES (
        gen_random_uuid(),
        'SHIFT',
        NEW.id::text,
        v_next_version,
        'SHIFT_OPENED',
        jsonb_build_object(
            'cashRegisterId', NEW.id,
            'restaurantId', NEW.restaurant_id,
            'name', NEW.name,
            'openedAt', NEW.opened_at,
            'openedBy', NEW.opened_by,
            'openingBalanceCents', NEW.opening_balance_cents
        ),
        jsonb_build_object('schema_version', '1', 'trigger', 'cdc_shift_opened'),
        NEW.restaurant_id,
        NEW.opened_by
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_shift_opened ON public.gm_cash_registers;

-- For INSERT (new register created as 'open')
CREATE TRIGGER trg_emit_shift_opened
    AFTER INSERT ON public.gm_cash_registers
    FOR EACH ROW
    WHEN (NEW.status = 'open')
    EXECUTE FUNCTION public.emit_shift_opened_event();

-- For UPDATE (re-opened register, status closed → open)
DROP TRIGGER IF EXISTS trg_emit_shift_reopened ON public.gm_cash_registers;

CREATE TRIGGER trg_emit_shift_reopened
    AFTER UPDATE OF status ON public.gm_cash_registers
    FOR EACH ROW
    WHEN (NEW.status = 'open' AND OLD.status IS DISTINCT FROM 'open')
    EXECUTE FUNCTION public.emit_shift_opened_event();

-- =============================================================================
-- 4. ORDER_ITEM_ADDED
-- =============================================================================
-- Fires when an item is added to an order.
-- Important for price tracking and audit trail.

CREATE OR REPLACE FUNCTION public.emit_order_item_added_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
    v_restaurant_id UUID;
BEGIN
    -- Get restaurant_id from parent order
    SELECT restaurant_id INTO v_restaurant_id
    FROM public.gm_orders
    WHERE id = NEW.order_id;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'ORDER'
      AND stream_id = NEW.order_id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta, restaurant_id,
        actor_ref
    ) VALUES (
        gen_random_uuid(),
        'ORDER',
        NEW.order_id::text,
        v_next_version,
        'ORDER_ITEM_ADDED',
        jsonb_build_object(
            'orderItemId', NEW.id,
            'orderId', NEW.order_id,
            'restaurantId', v_restaurant_id,
            'productId', NEW.product_id,
            'nameSnapshot', NEW.name_snapshot,
            'priceSnapshot', NEW.price_snapshot,
            'quantity', NEW.quantity,
            'subtotalCents', NEW.subtotal_cents,
            'modifiers', NEW.modifiers,
            'notes', NEW.notes
        ),
        jsonb_build_object('schema_version', '1', 'trigger', 'cdc_item_added'),
        v_restaurant_id,
        COALESCE(NEW.created_by_user_id::text, NEW.created_by_role)
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_order_item_added ON public.gm_order_items;

CREATE TRIGGER trg_emit_order_item_added
    AFTER INSERT ON public.gm_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_order_item_added_event();

-- =============================================================================
-- 5. ORDER_ITEM_REMOVED
-- =============================================================================
-- Fires when an item is removed from an order.
-- Fiscally significant: auditors check for suspicious removals.

CREATE OR REPLACE FUNCTION public.emit_order_item_removed_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
    v_restaurant_id UUID;
    v_order_status TEXT;
BEGIN
    -- Get order context
    SELECT restaurant_id, status INTO v_restaurant_id, v_order_status
    FROM public.gm_orders
    WHERE id = OLD.order_id;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'ORDER'
      AND stream_id = OLD.order_id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta, restaurant_id,
        actor_ref
    ) VALUES (
        gen_random_uuid(),
        'ORDER',
        OLD.order_id::text,
        v_next_version,
        'ORDER_ITEM_REMOVED',
        jsonb_build_object(
            'orderItemId', OLD.id,
            'orderId', OLD.order_id,
            'restaurantId', v_restaurant_id,
            'productId', OLD.product_id,
            'nameSnapshot', OLD.name_snapshot,
            'priceSnapshot', OLD.price_snapshot,
            'quantity', OLD.quantity,
            'subtotalCents', OLD.subtotal_cents,
            'orderStatusAtRemoval', v_order_status,
            'removedAt', NOW()
        ),
        jsonb_build_object(
            'schema_version', '1',
            'trigger', 'cdc_item_removed',
            'audit_flag', v_order_status NOT IN ('OPEN')  -- flag suspicious if removed after OPEN
        ),
        v_restaurant_id,
        COALESCE(OLD.created_by_user_id::text, OLD.created_by_role)
    );

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_order_item_removed ON public.gm_order_items;

CREATE TRIGGER trg_emit_order_item_removed
    AFTER DELETE ON public.gm_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_order_item_removed_event();

-- =============================================================================
-- 6. PAYMENT_STATUS_CHANGED (general — catches 'failed' and other transitions)
-- =============================================================================
-- Catches any payment status change not covered by specific triggers.
-- E.g., paid → failed (charge-back), or pending → failed.

CREATE OR REPLACE FUNCTION public.emit_payment_status_changed_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
BEGIN
    -- Don't double-fire for transitions handled by specific triggers
    -- (paid is handled by ORDER_PAID on INSERT, refunded by PAYMENT_REFUNDED)
    IF NEW.status IN ('paid', 'refunded') THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'PAYMENT'
      AND stream_id = NEW.order_id::text;

    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta, restaurant_id,
        actor_ref
    ) VALUES (
        gen_random_uuid(),
        'PAYMENT',
        NEW.order_id::text,
        v_next_version,
        'PAYMENT_STATUS_CHANGED',
        jsonb_build_object(
            'paymentId', NEW.id,
            'orderId', NEW.order_id,
            'restaurantId', NEW.restaurant_id,
            'amountCents', NEW.amount_cents,
            'paymentMethod', NEW.payment_method,
            'oldStatus', OLD.status,
            'newStatus', NEW.status,
            'changedAt', NOW()
        ),
        jsonb_build_object('schema_version', '1', 'trigger', 'cdc_payment_status'),
        NEW.restaurant_id,
        NEW.operator_id::text
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_payment_status_changed ON public.gm_payments;

CREATE TRIGGER trg_emit_payment_status_changed
    AFTER UPDATE OF status ON public.gm_payments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.emit_payment_status_changed_event();

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.emit_order_cancelled_event TO postgres;
GRANT EXECUTE ON FUNCTION public.emit_payment_refunded_event TO postgres;
GRANT EXECUTE ON FUNCTION public.emit_shift_opened_event TO postgres;
GRANT EXECUTE ON FUNCTION public.emit_order_item_added_event TO postgres;
GRANT EXECUTE ON FUNCTION public.emit_order_item_removed_event TO postgres;
GRANT EXECUTE ON FUNCTION public.emit_payment_status_changed_event TO postgres;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After applying, the following event types are covered:
--
-- Stream ORDER:
--   ORDER_CREATED           ✓ (20260210)
--   ORDER_STATUS_CHANGED    ✓ (20260219)
--   ORDER_CANCELLED         ✓ (this migration)
--   ORDER_ITEM_ADDED        ✓ (this migration)
--   ORDER_ITEM_REMOVED      ✓ (this migration)
--
-- Stream PAYMENT:
--   ORDER_PAID              ✓ (20260219)
--   PAYMENT_REFUNDED        ✓ (this migration)
--   PAYMENT_STATUS_CHANGED  ✓ (this migration)
--
-- Stream SHIFT:
--   SHIFT_OPENED            ✓ (this migration)
--   SHIFT_CLOSED            ✓ (20260219)
--
-- Stream STOCK:
--   STOCK_CONSUMED          ✓ (20260219)
--
-- Stream PRODUCT:
--   PRODUCT_CREATED         ✓ (20260210)
--   PRODUCT_UPDATED         ✓ (20260210)
--   PRODUCT_DELETED         ✓ (20260210)
--
-- Total: 14 event types across 4 stream types = FULL COVERAGE

COMMIT;
