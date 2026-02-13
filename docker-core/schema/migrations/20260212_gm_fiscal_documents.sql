-- =============================================================================
-- PHASE 2B: gm_fiscal_documents — Universal Fiscal Document Registry
-- =============================================================================
-- Production-ready fiscal document table that replaces the design-only
-- fiscal_event_store from fiscal-modules/schema.sql.
--
-- Supports:
--   - Invoices (receipt/fatura/factura)
--   - Credit notes (nota de crédito / abono)
--   - Correction documents
--   - Any jurisdiction (PT SAF-T, ES TicketBAI, BR NFC-e, etc.)
--
-- Links to:
--   - event_store (which event triggered the document)
--   - legal_seals (which seal authorizes the document)
--   - gm_refunds (if it's a credit note for a refund)
--
-- Depends on: core_schema.sql, 04-modules-and-extras.sql (event_store, legal_seals)
-- Depends on: 20260212_gm_refunds.sql (gm_refunds for FK)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. gm_fiscal_documents table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_fiscal_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE RESTRICT,

    -- Document classification
    doc_type        TEXT NOT NULL
                    CHECK (doc_type IN (
                        'INVOICE',          -- standard sale document
                        'SIMPLIFIED_INVOICE', -- simplified (ticket/recibo)
                        'CREDIT_NOTE',      -- nota de crédito (refund document)
                        'CORRECTION',       -- correction to previous document
                        'PROFORMA',         -- proforma invoice
                        'RECEIPT'           -- payment receipt
                    )),

    -- Sequential numbering (per restaurant + doc_type, legally required)
    fiscal_series   TEXT NOT NULL DEFAULT 'A',  -- series identifier
    fiscal_number   BIGINT NOT NULL,           -- sequential number within series
    fiscal_year     INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,

    -- Links to Core entities
    order_id        UUID REFERENCES public.gm_orders(id) ON DELETE RESTRICT,
    payment_id      UUID REFERENCES public.gm_payments(id) ON DELETE RESTRICT,
    refund_id       UUID REFERENCES public.gm_refunds(id) ON DELETE RESTRICT,

    -- Links to event sourcing
    seal_id         TEXT,          -- reference to legal_seals.seal_id (TEXT, not UUID)
    source_event_id UUID,          -- event that triggered this document

    -- Link to corrected/cancelled document
    related_document_id UUID REFERENCES public.gm_fiscal_documents(id),
    relation_type   TEXT CHECK (relation_type IN ('CORRECTS', 'CANCELS', 'REPLACES')),

    -- Financial data (snapshot at document creation — immutable)
    gross_amount_cents  BIGINT NOT NULL,
    net_amount_cents    BIGINT NOT NULL,
    tax_amount_cents    BIGINT NOT NULL DEFAULT 0,
    currency            TEXT NOT NULL DEFAULT 'EUR',

    -- Tax breakdown (jurisdiction-agnostic)
    tax_details     JSONB NOT NULL DEFAULT '[]'::JSONB,
    -- Example: [{"rate": 0.23, "base_cents": 1000, "amount_cents": 230, "name": "IVA"}]

    -- Items snapshot (for fiscal compliance — some jurisdictions require line items)
    items_snapshot  JSONB NOT NULL DEFAULT '[]'::JSONB,

    -- Jurisdiction
    jurisdiction    TEXT NOT NULL DEFAULT 'PT',  -- ISO 3166-1 alpha-2
    fiscal_adapter  TEXT,          -- 'saft_pt', 'ticketbai_es', 'nfce_br', etc.

    -- Government submission
    status          TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN (
                        'DRAFT',            -- created, not yet submitted
                        'PENDING',          -- queued for submission
                        'SUBMITTED',        -- sent to fiscal authority
                        'ACCEPTED',         -- accepted by fiscal authority
                        'REJECTED',         -- rejected by fiscal authority
                        'CANCELLED',        -- cancelled (requires credit note)
                        'ERROR'             -- system error during submission
                    )),
    gov_protocol    TEXT,           -- government protocol/reference number
    gov_response    JSONB,          -- full response from government API
    submitted_at    TIMESTAMPTZ,
    accepted_at     TIMESTAMPTZ,

    -- Document artifacts
    pdf_url         TEXT,           -- URL to generated PDF
    qr_code_data    TEXT,           -- QR code content (some jurisdictions require)
    hash_signature  TEXT,           -- fiscal hash/signature (SAF-T ATCUD, etc.)

    -- Retry tracking (if submission fails)
    retry_count     INTEGER NOT NULL DEFAULT 0,
    last_error      TEXT,
    next_retry_at   TIMESTAMPTZ,

    -- Idempotency
    idempotency_key TEXT,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gm_fiscal_documents IS
'TPV Compliance: Universal fiscal document registry. Covers invoices, credit notes, corrections across all jurisdictions.';

-- ---------------------------------------------------------------------------
-- 2. Unique constraints
-- ---------------------------------------------------------------------------
-- Sequential numbering per restaurant + series + type + year (legally required)
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_fiscal_docs_sequence
    ON public.gm_fiscal_documents(restaurant_id, doc_type, fiscal_series, fiscal_year, fiscal_number);

-- Idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_fiscal_docs_idempotency
    ON public.gm_fiscal_documents(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Performance indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gm_fiscal_docs_restaurant
    ON public.gm_fiscal_documents(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gm_fiscal_docs_order
    ON public.gm_fiscal_documents(order_id)
    WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_fiscal_docs_refund
    ON public.gm_fiscal_documents(refund_id)
    WHERE refund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_fiscal_docs_status
    ON public.gm_fiscal_documents(status)
    WHERE status IN ('PENDING', 'SUBMITTED', 'ERROR');

CREATE INDEX IF NOT EXISTS idx_gm_fiscal_docs_retry
    ON public.gm_fiscal_documents(next_retry_at)
    WHERE status IN ('PENDING', 'ERROR') AND next_retry_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_fiscal_docs_jurisdiction
    ON public.gm_fiscal_documents(jurisdiction, doc_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Immutability trigger (financial fields are write-once)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_fiscal_document_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'IMMUTABLE_FISCAL_DOC: DELETE not allowed on gm_fiscal_documents'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Financial data is immutable
        IF OLD.gross_amount_cents != NEW.gross_amount_cents
           OR OLD.net_amount_cents != NEW.net_amount_cents
           OR OLD.tax_amount_cents != NEW.tax_amount_cents
           OR OLD.currency != NEW.currency
           OR OLD.doc_type != NEW.doc_type
           OR OLD.fiscal_series != NEW.fiscal_series
           OR OLD.fiscal_number != NEW.fiscal_number
           OR OLD.fiscal_year != NEW.fiscal_year
           OR OLD.restaurant_id != NEW.restaurant_id
           OR OLD.order_id IS DISTINCT FROM NEW.order_id
           OR OLD.payment_id IS DISTINCT FROM NEW.payment_id
           OR OLD.refund_id IS DISTINCT FROM NEW.refund_id
           OR OLD.items_snapshot != NEW.items_snapshot
           OR OLD.tax_details != NEW.tax_details
           OR OLD.jurisdiction != NEW.jurisdiction
           OR OLD.created_at != NEW.created_at THEN
            RAISE EXCEPTION 'IMMUTABLE_FISCAL_DOC: Financial fields cannot be modified. Create a CORRECTION or CREDIT_NOTE instead.'
                USING ERRCODE = '23514';
        END IF;

        -- Status can only move forward (no rollback)
        IF OLD.status = 'ACCEPTED' AND NEW.status NOT IN ('ACCEPTED', 'CANCELLED') THEN
            RAISE EXCEPTION 'IMMUTABLE_FISCAL_DOC: Accepted documents cannot change status (except to CANCELLED via credit note)'
                USING ERRCODE = '23514';
        END IF;

        IF OLD.status = 'CANCELLED' THEN
            RAISE EXCEPTION 'IMMUTABLE_FISCAL_DOC: Cancelled documents cannot be modified'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_fiscal_document_mutation ON public.gm_fiscal_documents;
CREATE TRIGGER trg_guard_fiscal_document_mutation
    BEFORE UPDATE OR DELETE ON public.gm_fiscal_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_fiscal_document_mutation();

-- ---------------------------------------------------------------------------
-- 5. Auto-increment fiscal number per restaurant+type+series+year
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_fiscal_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_number BIGINT;
BEGIN
    -- Get next sequential number for this restaurant + doc_type + series + year
    SELECT COALESCE(MAX(fiscal_number), 0) + 1
    INTO v_next_number
    FROM public.gm_fiscal_documents
    WHERE restaurant_id = NEW.restaurant_id
      AND doc_type = NEW.doc_type
      AND fiscal_series = NEW.fiscal_series
      AND fiscal_year = NEW.fiscal_year;

    NEW.fiscal_number := v_next_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only assign if fiscal_number is 0 (allow manual override for imports)
DROP TRIGGER IF EXISTS trg_assign_fiscal_number ON public.gm_fiscal_documents;
CREATE TRIGGER trg_assign_fiscal_number
    BEFORE INSERT ON public.gm_fiscal_documents
    FOR EACH ROW
    WHEN (NEW.fiscal_number IS NULL OR NEW.fiscal_number = 0)
    EXECUTE FUNCTION public.assign_fiscal_number();

-- ---------------------------------------------------------------------------
-- 6. CDC trigger: FISCAL_DOCUMENT_CREATED → event_store
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.emit_fiscal_document_created_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.event_store (
        event_id,
        stream_type,
        stream_id,
        stream_version,
        event_type,
        payload,
        meta,
        restaurant_id,
        actor_ref
    ) VALUES (
        gen_random_uuid(),
        'FISCAL',
        NEW.id::TEXT,
        1,
        'FISCAL_DOCUMENT_CREATED',
        jsonb_build_object(
            'document_id', NEW.id,
            'doc_type', NEW.doc_type,
            'fiscal_series', NEW.fiscal_series,
            'fiscal_number', NEW.fiscal_number,
            'fiscal_year', NEW.fiscal_year,
            'order_id', NEW.order_id,
            'payment_id', NEW.payment_id,
            'refund_id', NEW.refund_id,
            'gross_amount_cents', NEW.gross_amount_cents,
            'net_amount_cents', NEW.net_amount_cents,
            'tax_amount_cents', NEW.tax_amount_cents,
            'currency', NEW.currency,
            'jurisdiction', NEW.jurisdiction,
            'fiscal_adapter', NEW.fiscal_adapter,
            'status', NEW.status,
            'related_document_id', NEW.related_document_id,
            'relation_type', NEW.relation_type
        ),
        jsonb_build_object(
            'trigger', 'cdc_fiscal_document_created',
            'schema_version', '2',
            'fiscal_event', true,
            'source_table', 'gm_fiscal_documents'
        ),
        NEW.restaurant_id,
        'system'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_emit_fiscal_document_created ON public.gm_fiscal_documents;
CREATE TRIGGER trg_emit_fiscal_document_created
    AFTER INSERT ON public.gm_fiscal_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_fiscal_document_created_event();

GRANT EXECUTE ON FUNCTION public.emit_fiscal_document_created_event() TO postgres;

-- ---------------------------------------------------------------------------
-- 7. CDC trigger: FISCAL_DOCUMENT_STATUS_CHANGED → event_store
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.emit_fiscal_document_status_changed_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Only fire on actual status change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.event_store (
        event_id,
        stream_type,
        stream_id,
        stream_version,
        event_type,
        payload,
        meta,
        restaurant_id,
        actor_ref
    ) VALUES (
        gen_random_uuid(),
        'FISCAL',
        NEW.id::TEXT,
        (SELECT COALESCE(MAX(stream_version), 0) + 1
         FROM public.event_store
         WHERE stream_type = 'FISCAL' AND stream_id = NEW.id::TEXT),
        'FISCAL_DOCUMENT_STATUS_CHANGED',
        jsonb_build_object(
            'document_id', NEW.id,
            'doc_type', NEW.doc_type,
            'previous_status', OLD.status,
            'new_status', NEW.status,
            'gov_protocol', NEW.gov_protocol,
            'retry_count', NEW.retry_count,
            'last_error', NEW.last_error,
            'accepted_at', NEW.accepted_at,
            'submitted_at', NEW.submitted_at
        ),
        jsonb_build_object(
            'trigger', 'cdc_fiscal_document_status_changed',
            'schema_version', '2',
            'fiscal_event', true,
            'source_table', 'gm_fiscal_documents'
        ),
        NEW.restaurant_id,
        'system'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_emit_fiscal_document_status_changed ON public.gm_fiscal_documents;
CREATE TRIGGER trg_emit_fiscal_document_status_changed
    AFTER UPDATE ON public.gm_fiscal_documents
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.emit_fiscal_document_status_changed_event();

GRANT EXECUTE ON FUNCTION public.emit_fiscal_document_status_changed_event() TO postgres;

-- ---------------------------------------------------------------------------
-- 8. FK: gm_refunds.fiscal_document_id → gm_fiscal_documents
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'gm_refunds_fiscal_document_fk'
    ) THEN
        ALTER TABLE public.gm_refunds
            ADD CONSTRAINT gm_refunds_fiscal_document_fk
            FOREIGN KEY (fiscal_document_id)
            REFERENCES public.gm_fiscal_documents(id);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 9. Utility: get next fiscal number (for preview/UI)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_next_fiscal_number(
    p_restaurant_id UUID,
    p_doc_type TEXT,
    p_fiscal_series TEXT DEFAULT 'A',
    p_fiscal_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(MAX(fiscal_number), 0) + 1
    FROM public.gm_fiscal_documents
    WHERE restaurant_id = p_restaurant_id
      AND doc_type = p_doc_type
      AND fiscal_series = p_fiscal_series
      AND fiscal_year = p_fiscal_year;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_fiscal_number(UUID, TEXT, TEXT, INTEGER) TO postgres;

COMMIT;
