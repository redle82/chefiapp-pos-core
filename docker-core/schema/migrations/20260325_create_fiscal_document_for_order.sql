-- =============================================================================
-- PHASE 9.2: create_fiscal_document_for_order() — Fiscal Document from Order
-- =============================================================================
-- Date: 2026-03-25
-- Priority: CRITICAL (fiscal compliance, replaces placeholder hashes)
--
-- Purpose:
--   Atomic RPC that snapshots order + payment + items into gm_fiscal_documents.
--   Called after payment is confirmed (payment_status = 'PAID').
--
--   This RPC:
--   1. Validates order exists and is paid
--   2. Checks idempotency (reuses existing fiscal doc for same order)
--   3. Snapshots order items with prices + modifiers
--   4. Computes tax breakdown per VAT rate
--   5. Generates hash_signature using SHA-256 (fiscal chain hash)
--   6. Inserts gm_fiscal_documents row (assign_fiscal_number trigger auto-numbers)
--   7. Returns the complete fiscal document record
--
-- Canonical error codes:
--   ORDER_NOT_FOUND, ORDER_NOT_PAID, PAYMENT_NOT_FOUND,
--   IDEMPOTENCY_DUPLICATE (returns existing doc — not a failure)
--
-- Depends on:
--   - gm_orders, gm_order_items, gm_payments (core_schema + 03-migrations)
--   - gm_fiscal_documents (20260212_gm_fiscal_documents.sql)
--   - event_store hash chain (20260212_event_store_hash_chain.sql)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. compute_fiscal_document_hash — SHA-256 hash for fiscal document
-- ---------------------------------------------------------------------------
-- Builds a deterministic hash over the document's financial data.
-- Used for SAF-T (PT) hash chain and audit integrity.
-- The hash links to the PREVIOUS fiscal document's hash (blockchain-style).
CREATE OR REPLACE FUNCTION public.compute_fiscal_document_hash(
    p_document_id       UUID,
    p_doc_type          TEXT,
    p_fiscal_series     TEXT,
    p_fiscal_number     BIGINT,
    p_gross_amount_cents BIGINT,
    p_net_amount_cents  BIGINT,
    p_tax_amount_cents  BIGINT,
    p_items_snapshot    JSONB,
    p_created_at        TIMESTAMPTZ,
    p_prev_hash         TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_input TEXT;
BEGIN
    v_input := p_document_id::TEXT
        || '|' || p_doc_type
        || '|' || p_fiscal_series
        || '|' || p_fiscal_number::TEXT
        || '|' || p_gross_amount_cents::TEXT
        || '|' || p_net_amount_cents::TEXT
        || '|' || p_tax_amount_cents::TEXT
        || '|' || (p_items_snapshot #>> '{}')
        || '|' || p_created_at::TEXT
        || '|' || COALESCE(p_prev_hash, 'GENESIS');

    RETURN encode(digest(v_input, 'sha256'), 'hex');
END;
$$;

COMMENT ON FUNCTION public.compute_fiscal_document_hash IS
'Computes SHA-256 hash for fiscal document integrity chain. Uses pgcrypto.';

GRANT EXECUTE ON FUNCTION public.compute_fiscal_document_hash(UUID, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, JSONB, TIMESTAMPTZ, TEXT) TO postgres;

-- ---------------------------------------------------------------------------
-- 2. Main RPC: create_fiscal_document_for_order
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_fiscal_document_for_order(
    p_restaurant_id     UUID,
    p_order_id          UUID,
    p_payment_id        UUID        DEFAULT NULL,
    p_doc_type          TEXT        DEFAULT 'SIMPLIFIED_INVOICE',
    p_jurisdiction      TEXT        DEFAULT 'PT',
    p_fiscal_series     TEXT        DEFAULT 'A',
    p_operator_id       UUID        DEFAULT NULL,
    p_idempotency_key   TEXT        DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order             RECORD;
    v_payment           RECORD;
    v_items             JSONB;
    v_tax_details       JSONB;
    v_existing_doc      RECORD;
    v_doc_id            UUID;
    v_prev_hash         TEXT;
    v_hash_signature    TEXT;
    v_idempotency_key   TEXT;
    v_now               TIMESTAMPTZ := NOW();
    v_fiscal_number     BIGINT;
    v_fiscal_year       INTEGER := EXTRACT(YEAR FROM v_now)::INTEGER;
BEGIN
    -- =========================================================================
    -- A. Idempotency check
    -- =========================================================================
    v_idempotency_key := COALESCE(
        p_idempotency_key,
        'fiscal_order_' || p_order_id::TEXT || '_' || p_doc_type
    );

    SELECT * INTO v_existing_doc
    FROM public.gm_fiscal_documents
    WHERE idempotency_key = v_idempotency_key
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'ok', true,
            'code', 'IDEMPOTENCY_DUPLICATE',
            'fiscal_document_id', v_existing_doc.id,
            'fiscal_number', v_existing_doc.fiscal_number,
            'hash_signature', v_existing_doc.hash_signature,
            'status', v_existing_doc.status,
            'message', 'Fiscal document already exists for this order'
        );
    END IF;

    -- =========================================================================
    -- B. Validate order
    -- =========================================================================
    SELECT * INTO v_order
    FROM public.gm_orders
    WHERE id = p_order_id
      AND restaurant_id = p_restaurant_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'code', 'ORDER_NOT_FOUND',
            'message', 'Order not found for this restaurant'
        );
    END IF;

    IF v_order.payment_status != 'PAID' THEN
        RETURN jsonb_build_object(
            'ok', false,
            'code', 'ORDER_NOT_PAID',
            'message', 'Order payment_status must be PAID. Current: ' || v_order.payment_status
        );
    END IF;

    -- =========================================================================
    -- C. Resolve payment
    -- =========================================================================
    IF p_payment_id IS NOT NULL THEN
        SELECT * INTO v_payment
        FROM public.gm_payments
        WHERE id = p_payment_id
          AND order_id = p_order_id;
    ELSE
        -- Use the most recent paid payment for this order
        SELECT * INTO v_payment
        FROM public.gm_payments
        WHERE order_id = p_order_id
          AND status = 'paid'
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ok', false,
            'code', 'PAYMENT_NOT_FOUND',
            'message', 'No paid payment found for order'
        );
    END IF;

    -- =========================================================================
    -- D. Snapshot order items
    -- =========================================================================
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'product_id', oi.product_id,
            'name', oi.name_snapshot,
            'quantity', oi.quantity,
            'unit_price_cents', oi.price_snapshot,
            'subtotal_cents', oi.subtotal_cents,
            'modifiers', oi.modifiers,
            'notes', oi.notes
        ) ORDER BY oi.created_at
    ), '[]'::jsonb) INTO v_items
    FROM public.gm_order_items oi
    WHERE oi.order_id = p_order_id;

    -- =========================================================================
    -- E. Compute tax breakdown
    -- =========================================================================
    -- For PT: default 23% IVA. In production, use product-level tax_rate.
    -- The tax_details breakdown is jurisdiction-agnostic JSON.
    v_tax_details := jsonb_build_array(
        jsonb_build_object(
            'rate', 0.23,
            'name', 'IVA',
            'base_cents', v_order.subtotal_cents,
            'amount_cents', v_order.tax_cents
        )
    );

    -- =========================================================================
    -- F. Get previous fiscal document hash (chain link)
    -- =========================================================================
    SELECT hash_signature INTO v_prev_hash
    FROM public.gm_fiscal_documents
    WHERE restaurant_id = p_restaurant_id
      AND doc_type = p_doc_type
      AND fiscal_series = p_fiscal_series
      AND fiscal_year = v_fiscal_year
    ORDER BY fiscal_number DESC
    LIMIT 1;

    -- =========================================================================
    -- G. Generate document ID and compute hash
    -- =========================================================================
    v_doc_id := gen_random_uuid();

    -- Get the next fiscal number (before insert — trigger also does this but we
    -- need it for the hash computation)
    v_fiscal_number := public.get_next_fiscal_number(
        p_restaurant_id, p_doc_type, p_fiscal_series, v_fiscal_year
    );

    v_hash_signature := public.compute_fiscal_document_hash(
        v_doc_id,
        p_doc_type,
        p_fiscal_series,
        v_fiscal_number,
        COALESCE(v_order.total_cents, 0)::BIGINT,
        COALESCE(v_order.subtotal_cents, 0)::BIGINT,
        COALESCE(v_order.tax_cents, 0)::BIGINT,
        v_items,
        v_now,
        v_prev_hash
    );

    -- =========================================================================
    -- H. Insert fiscal document
    -- =========================================================================
    INSERT INTO public.gm_fiscal_documents (
        id,
        restaurant_id,
        doc_type,
        fiscal_series,
        fiscal_number,
        fiscal_year,
        order_id,
        payment_id,
        gross_amount_cents,
        net_amount_cents,
        tax_amount_cents,
        currency,
        tax_details,
        items_snapshot,
        jurisdiction,
        fiscal_adapter,
        status,
        hash_signature,
        idempotency_key,
        created_at,
        updated_at
    ) VALUES (
        v_doc_id,
        p_restaurant_id,
        p_doc_type,
        p_fiscal_series,
        v_fiscal_number,
        v_fiscal_year,
        p_order_id,
        v_payment.id,
        COALESCE(v_order.total_cents, 0),
        COALESCE(v_order.subtotal_cents, 0),
        COALESCE(v_order.tax_cents, 0),
        COALESCE(v_payment.currency, 'EUR'),
        v_tax_details,
        v_items,
        p_jurisdiction,
        CASE p_jurisdiction
            WHEN 'PT' THEN 'saft_pt'
            WHEN 'ES' THEN 'ticketbai_es'
            WHEN 'BR' THEN 'nfce_br'
            ELSE NULL
        END,
        'DRAFT',
        v_hash_signature,
        v_idempotency_key,
        v_now,
        v_now
    );

    -- =========================================================================
    -- I. Return result
    -- =========================================================================
    RETURN jsonb_build_object(
        'ok', true,
        'code', 'CREATED',
        'fiscal_document_id', v_doc_id,
        'fiscal_number', v_fiscal_number,
        'fiscal_series', p_fiscal_series,
        'fiscal_year', v_fiscal_year,
        'doc_type', p_doc_type,
        'hash_signature', v_hash_signature,
        'gross_amount_cents', COALESCE(v_order.total_cents, 0),
        'net_amount_cents', COALESCE(v_order.subtotal_cents, 0),
        'tax_amount_cents', COALESCE(v_order.tax_cents, 0),
        'status', 'DRAFT',
        'items_count', jsonb_array_length(v_items)
    );

EXCEPTION WHEN unique_violation THEN
    -- Concurrent insert race: another transaction created the doc first
    SELECT * INTO v_existing_doc
    FROM public.gm_fiscal_documents
    WHERE idempotency_key = v_idempotency_key
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'ok', true,
            'code', 'IDEMPOTENCY_DUPLICATE',
            'fiscal_document_id', v_existing_doc.id,
            'fiscal_number', v_existing_doc.fiscal_number,
            'hash_signature', v_existing_doc.hash_signature,
            'status', v_existing_doc.status,
            'message', 'Fiscal document created by concurrent request'
        );
    ELSE
        RAISE;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.create_fiscal_document_for_order IS
'Phase 9.2: Atomic RPC that snapshots a paid order into gm_fiscal_documents. '
'Idempotent via idempotency_key. Computes fiscal hash chain (SHA-256). '
'Called after payment confirmation — creates the legally-binding fiscal record.';

GRANT EXECUTE ON FUNCTION public.create_fiscal_document_for_order(UUID, UUID, UUID, TEXT, TEXT, TEXT, UUID, TEXT) TO postgres;

COMMIT;
