-- =============================================================================
-- Migration: event_store + legal_seals — Add restaurant_id for Multi-Tenant
-- Date: 2026-02-20
-- Purpose:
--   Both event_store and legal_seals were created WITHOUT a restaurant_id column.
--   This is a critical gap: without it, RLS cannot isolate audit events per
--   restaurant and any PostgREST query would leak data cross-tenant.
--
--   This migration:
--   1. Adds restaurant_id to event_store (nullable — trigger rows backfilled)
--   2. Adds restaurant_id to legal_seals (nullable — no data yet)
--   3. Backfills event_store.restaurant_id from payload->'restaurantId'
--   4. Enables RLS on both tables
--   5. Updates CDC trigger functions to populate the column
--
-- Note: CDC triggers execute as table owner (postgres) and bypass RLS.
--       RLS here protects PostgREST/frontend reads.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Add restaurant_id to event_store
-- =============================================================================
ALTER TABLE public.event_store
  ADD COLUMN IF NOT EXISTS restaurant_id UUID;

-- Backfill from payload JSON (CDC triggers embed restaurantId in payload)
UPDATE public.event_store
   SET restaurant_id = (payload->>'restaurantId')::uuid
 WHERE restaurant_id IS NULL
   AND payload->>'restaurantId' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_store_restaurant_id
  ON public.event_store (restaurant_id);

-- =============================================================================
-- 2. Add restaurant_id to legal_seals
-- =============================================================================
ALTER TABLE public.legal_seals
  ADD COLUMN IF NOT EXISTS restaurant_id UUID;

CREATE INDEX IF NOT EXISTS idx_legal_seals_restaurant_id
  ON public.legal_seals (restaurant_id);

-- =============================================================================
-- 3. RLS on event_store
-- =============================================================================
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Tenant isolation event_store" ON public.event_store;
DROP POLICY IF EXISTS "Service full access event_store" ON public.event_store;

-- Tenant can only read their own events
CREATE POLICY "Tenant isolation event_store"
  ON public.event_store
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IS NOT NULL
    AND has_restaurant_access(restaurant_id)
  );

-- service_role has full access (CDC triggers bypass RLS anyway)
CREATE POLICY "Service full access event_store"
  ON public.event_store
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Revoke anon — audit events are never public
REVOKE ALL ON public.event_store FROM anon;

-- =============================================================================
-- 4. RLS on legal_seals
-- =============================================================================
ALTER TABLE public.legal_seals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation legal_seals" ON public.legal_seals;
DROP POLICY IF EXISTS "Service full access legal_seals" ON public.legal_seals;

-- Tenant can only read their own seals
CREATE POLICY "Tenant isolation legal_seals"
  ON public.legal_seals
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IS NOT NULL
    AND has_restaurant_access(restaurant_id)
  );

-- service_role has full access
CREATE POLICY "Service full access legal_seals"
  ON public.legal_seals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Revoke anon — legal seals are never public
REVOKE ALL ON public.legal_seals FROM anon;

-- =============================================================================
-- 5. Update CDC trigger functions to populate restaurant_id column
-- =============================================================================

-- 5a. ORDER_CREATED trigger
CREATE OR REPLACE FUNCTION public.emit_order_created_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
   WHERE stream_type = 'ORDER'
     AND stream_id = NEW.id::text;

  INSERT INTO public.event_store (
    event_id, stream_type, stream_id, stream_version,
    event_type, payload, meta, restaurant_id
  ) VALUES (
    gen_random_uuid(),
    'ORDER',
    NEW.id::text,
    v_next_version,
    'ORDER_CREATED',
    jsonb_build_object(
      'orderId', NEW.id,
      'restaurantId', NEW.restaurant_id,
      'totalCents', NEW.total_cents,
      'status', NEW.status,
      'paymentStatus', NEW.payment_status,
      'source', NEW.source
    ),
    jsonb_build_object('schema_version', '1'),
    NEW.restaurant_id
  );

  RETURN NEW;
END;
$$;

-- 5b. ORDER_STATUS_CHANGED trigger
CREATE OR REPLACE FUNCTION public.emit_order_status_changed_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
BEGIN
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
        event_type, payload, meta, restaurant_id
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
            'paymentStatus', NEW.payment_status
        ),
        jsonb_build_object('schema_version', '1', 'trigger', 'cdc_orders_status'),
        NEW.restaurant_id
    );

    RETURN NEW;
END;
$$;

-- 5c. ORDER_PAID trigger
CREATE OR REPLACE FUNCTION public.emit_order_paid_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
    v_order_total INTEGER;
    v_total_paid BIGINT;
BEGIN
    IF NEW.status != 'paid' THEN
        RETURN NEW;
    END IF;

    SELECT total_cents INTO v_order_total
    FROM public.gm_orders
    WHERE id = NEW.order_id;

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
        event_type, payload, meta, restaurant_id
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
        jsonb_build_object('schema_version', '1'),
        NEW.restaurant_id
    );

    RETURN NEW;
END;
$$;

-- 5d. STOCK_CONSUMED trigger
CREATE OR REPLACE FUNCTION public.emit_stock_consumed_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
    v_ingredient_name TEXT;
BEGIN
    IF NEW.action != 'CONSUME' THEN
        RETURN NEW;
    END IF;

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
        event_type, payload, meta, restaurant_id
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
        jsonb_build_object('schema_version', '1'),
        NEW.restaurant_id
    );

    RETURN NEW;
END;
$$;

-- 5e. SHIFT_CLOSED trigger
CREATE OR REPLACE FUNCTION public.emit_shift_closed_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INTEGER;
BEGIN
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
        event_type, payload, meta, restaurant_id
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
        jsonb_build_object('schema_version', '1'),
        NEW.restaurant_id
    );

    RETURN NEW;
END;
$$;

COMMIT;
