-- =============================================================================
-- PHASE 1A — EVENT INTEGRITY: Hash Chain + Tracing Columns
-- =============================================================================
-- Date: 2026-02-12
-- Priority: HIGH (ATCUD compliance, tamper-evidence)
-- Context: Production event_store lacks hash chain (hash, hash_prev) and
--          tracing columns (causation_id, correlation_id, actor_ref) that
--          exist in the design schema (schema.sql GATE 3).
--
-- This migration:
--   1. Adds hash chain columns (hash, hash_prev) to event_store
--   2. Adds tracing columns (causation_id, correlation_id, actor_ref)
--   3. Creates compute_event_hash() function (SHA-256)
--   4. Creates BEFORE INSERT trigger for automatic hash computation
--   5. Adds supporting indexes
--   6. Updates ALL existing CDC trigger functions to accept hash params
--
-- The hash chain creates a blockchain-style tamper-evident log:
--   event N: hash = SHA256(event_id || stream_id || event_type || payload || hash_prev)
--   event N+1: hash_prev = event N's hash
--   Broken chain = tampering detected
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: ADD COLUMNS TO event_store
-- =============================================================================

-- Anti-tamper chain
ALTER TABLE public.event_store
    ADD COLUMN IF NOT EXISTS hash TEXT;

ALTER TABLE public.event_store
    ADD COLUMN IF NOT EXISTS hash_prev TEXT;

-- Tracing & causality
ALTER TABLE public.event_store
    ADD COLUMN IF NOT EXISTS causation_id UUID;

ALTER TABLE public.event_store
    ADD COLUMN IF NOT EXISTS correlation_id UUID;

ALTER TABLE public.event_store
    ADD COLUMN IF NOT EXISTS actor_ref TEXT;

-- =============================================================================
-- PART 2: INDEXES for new columns
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_event_store_correlation_id
    ON public.event_store (correlation_id)
    WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_store_causation_id
    ON public.event_store (causation_id)
    WHERE causation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_store_actor_ref
    ON public.event_store (actor_ref)
    WHERE actor_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_store_created_at
    ON public.event_store (created_at DESC);

-- =============================================================================
-- PART 3: HASH COMPUTATION FUNCTION
-- =============================================================================
-- Computes SHA-256 hash from event fields. Uses pgcrypto's digest().
-- Chain: hash = SHA256(event_id || stream_id || event_type || payload_text || hash_prev)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.compute_event_hash(
    p_event_id UUID,
    p_stream_id TEXT,
    p_event_type TEXT,
    p_payload JSONB,
    p_hash_prev TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_input TEXT;
BEGIN
    -- Build deterministic input string
    -- payload is cast to TEXT with sorted keys for determinism
    v_input := p_event_id::TEXT
        || '|' || p_stream_id
        || '|' || p_event_type
        || '|' || (p_payload #>> '{}')  -- canonical text representation
        || '|' || COALESCE(p_hash_prev, 'GENESIS');

    RETURN encode(digest(v_input, 'sha256'), 'hex');
END;
$$;

COMMENT ON FUNCTION public.compute_event_hash(UUID, TEXT, TEXT, JSONB, TEXT) IS
    'Computes SHA-256 hash for event store anti-tamper chain. '
    'GENESIS is used as hash_prev for the first event in each stream.';

-- =============================================================================
-- PART 4: AUTOMATIC HASH COMPUTATION TRIGGER
-- =============================================================================
-- Fires BEFORE INSERT on event_store to automatically compute hash + hash_prev.
-- The trigger looks up the previous event's hash in the same stream.

CREATE OR REPLACE FUNCTION public.event_store_compute_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_prev_hash TEXT;
BEGIN
    -- Get the hash of the most recent event in this stream
    SELECT hash INTO v_prev_hash
    FROM public.event_store
    WHERE stream_type = NEW.stream_type
      AND stream_id = NEW.stream_id
    ORDER BY stream_version DESC
    LIMIT 1;

    -- Set hash_prev (NULL → 'GENESIS' handled in compute_event_hash)
    NEW.hash_prev := v_prev_hash;

    -- Compute this event's hash
    NEW.hash := public.compute_event_hash(
        NEW.event_id,
        NEW.stream_id,
        NEW.event_type,
        NEW.payload,
        v_prev_hash
    );

    RETURN NEW;
END;
$$;

-- Drop existing trigger if any (idempotent)
DROP TRIGGER IF EXISTS trg_event_store_compute_hash ON public.event_store;

CREATE TRIGGER trg_event_store_compute_hash
    BEFORE INSERT ON public.event_store
    FOR EACH ROW
    EXECUTE FUNCTION public.event_store_compute_hash();

COMMENT ON FUNCTION public.event_store_compute_hash() IS
    'BEFORE INSERT trigger: auto-computes hash chain on every new event. '
    'Looks up previous hash in same stream for chain continuity.';

-- =============================================================================
-- PART 5: HASH CHAIN VERIFICATION FUNCTION
-- =============================================================================
-- Used by audit mode and cron to verify chain integrity.

CREATE OR REPLACE FUNCTION public.verify_hash_chain(
    p_stream_type TEXT DEFAULT NULL,
    p_stream_id TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    event_id UUID,
    stream_type TEXT,
    stream_id TEXT,
    stream_version INTEGER,
    expected_hash TEXT,
    actual_hash TEXT,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH ordered_events AS (
        SELECT
            e.event_id,
            e.stream_type,
            e.stream_id,
            e.stream_version,
            e.event_type,
            e.payload,
            e.hash AS actual_hash,
            e.hash_prev,
            LAG(e.hash) OVER (
                PARTITION BY e.stream_type, e.stream_id
                ORDER BY e.stream_version
            ) AS expected_hash_prev
        FROM public.event_store e
        WHERE (p_stream_type IS NULL OR e.stream_type = p_stream_type)
          AND (p_stream_id IS NULL OR e.stream_id = p_stream_id)
          AND e.hash IS NOT NULL
        ORDER BY e.stream_type, e.stream_id, e.stream_version
        LIMIT p_limit
    )
    SELECT
        oe.event_id,
        oe.stream_type,
        oe.stream_id,
        oe.stream_version,
        public.compute_event_hash(
            oe.event_id, oe.stream_id, oe.event_type,
            oe.payload, oe.hash_prev
        ) AS expected_hash,
        oe.actual_hash,
        oe.actual_hash = public.compute_event_hash(
            oe.event_id, oe.stream_id, oe.event_type,
            oe.payload, oe.hash_prev
        )
        AND (
            oe.expected_hash_prev IS NULL  -- first event in stream
            OR oe.hash_prev = oe.expected_hash_prev  -- chain link matches
        ) AS is_valid
    FROM ordered_events oe;
END;
$$;

COMMENT ON FUNCTION public.verify_hash_chain(TEXT, TEXT, INTEGER) IS
    'Verifies hash chain integrity. Returns broken links. '
    'Call with no args to check all streams, or filter by stream_type/stream_id. '
    'Used by audit mode and daily integrity cron.';

-- =============================================================================
-- PART 6: QUICK INTEGRITY CHECK RPC
-- =============================================================================
-- Returns a summary: total events, verified events, broken links.

CREATE OR REPLACE FUNCTION public.check_hash_chain_integrity(
    p_stream_type TEXT DEFAULT NULL,
    p_restaurant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_hashed INTEGER;
    v_unhashed INTEGER;
    v_broken INTEGER;
BEGIN
    -- Count totals
    SELECT COUNT(*) INTO v_total
    FROM public.event_store
    WHERE (p_stream_type IS NULL OR stream_type = p_stream_type)
      AND (p_restaurant_id IS NULL OR restaurant_id = p_restaurant_id);

    SELECT COUNT(*) INTO v_hashed
    FROM public.event_store
    WHERE hash IS NOT NULL
      AND (p_stream_type IS NULL OR stream_type = p_stream_type)
      AND (p_restaurant_id IS NULL OR restaurant_id = p_restaurant_id);

    v_unhashed := v_total - v_hashed;

    -- Count broken links (only among hashed events)
    SELECT COUNT(*) INTO v_broken
    FROM public.verify_hash_chain(p_stream_type, NULL)
    WHERE NOT is_valid;

    RETURN jsonb_build_object(
        'total_events', v_total,
        'hashed_events', v_hashed,
        'unhashed_events', v_unhashed,
        'broken_links', v_broken,
        'integrity', CASE
            WHEN v_broken = 0 AND v_unhashed = 0 THEN 'VERIFIED'
            WHEN v_broken = 0 AND v_unhashed > 0 THEN 'PARTIAL'
            ELSE 'BROKEN'
        END,
        'checked_at', NOW()
    );
END;
$$;

COMMENT ON FUNCTION public.check_hash_chain_integrity(TEXT, UUID) IS
    'Quick integrity summary for audit dashboard. '
    'Returns: total_events, hashed, unhashed, broken_links, integrity status.';

-- =============================================================================
-- PART 7: UPDATE ALL CDC TRIGGER FUNCTIONS
-- =============================================================================
-- All CDC triggers now accept and pass through optional tracing columns.
-- Hash is computed automatically by the BEFORE INSERT trigger.

-- 7a. ORDER_CREATED — add actor_ref from operator_id
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
        event_type, payload, meta, restaurant_id,
        actor_ref
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
            'source', NEW.source,
            'tableId', NEW.table_id,
            'tableNumber', NEW.table_number
        ),
        jsonb_build_object('schema_version', '2', 'trigger', 'cdc_order_created'),
        NEW.restaurant_id,
        NEW.operator_id::text
    );

    RETURN NEW;
END;
$$;

-- 7b. ORDER_STATUS_CHANGED — add actor_ref
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
        event_type, payload, meta, restaurant_id,
        actor_ref
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
            'paymentStatus', NEW.payment_status,
            'totalCents', NEW.total_cents,
            'taxCents', NEW.tax_cents
        ),
        jsonb_build_object('schema_version', '2', 'trigger', 'cdc_order_status'),
        NEW.restaurant_id,
        NEW.operator_id::text
    );

    RETURN NEW;
END;
$$;

-- 7c. ORDER_PAID — add actor_ref from operator_id
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
        event_type, payload, meta, restaurant_id,
        actor_ref
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
        jsonb_build_object('schema_version', '2', 'trigger', 'cdc_order_paid'),
        NEW.restaurant_id,
        NEW.operator_id::text
    );

    RETURN NEW;
END;
$$;

-- 7d. STOCK_CONSUMED — add actor_ref
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
        event_type, payload, meta, restaurant_id,
        actor_ref
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
        jsonb_build_object('schema_version', '2', 'trigger', 'cdc_stock_consumed'),
        NEW.restaurant_id,
        NEW.created_by_user_id::text
    );

    RETURN NEW;
END;
$$;

-- 7e. SHIFT_CLOSED — add actor_ref from closed_by
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
        event_type, payload, meta, restaurant_id,
        actor_ref
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
        jsonb_build_object('schema_version', '2', 'trigger', 'cdc_shift_closed'),
        NEW.restaurant_id,
        NEW.closed_by
    );

    RETURN NEW;
END;
$$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After applying:
-- 1. SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'event_store' ORDER BY ordinal_position;
--    Expected: includes hash, hash_prev, causation_id, correlation_id, actor_ref
--
-- 2. INSERT a test order → check event_store for hash != NULL
--
-- 3. SELECT * FROM check_hash_chain_integrity();
--    Expected: { "integrity": "PARTIAL", "unhashed_events": N }
--    (PARTIAL because existing events are unhashed until backfill)

COMMIT;
