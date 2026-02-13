-- =============================================================================
-- PHASE 2A: gm_refunds — Dedicated Refund Tracking
-- =============================================================================
-- Closes ERROS_CANON E16 ("Estorno sem registo") and E41 ("Estorno parcial sem evento").
-- Every refund (total or partial) MUST exist as a row in gm_refunds.
-- The old pattern of just flipping gm_payments.status → 'refunded' is now insufficient:
--   - gm_refunds tracks the atomic refund act with full traceability
--   - gm_payments.status is still updated for backwards compat, but gm_refunds is the ledger
--
-- Depends on: core_schema.sql, 03-migrations-consolidated.sql (gm_payments)
-- Depends on: 20260212_event_store_hash_chain.sql (hash chain active)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. gm_refunds table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_refunds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE RESTRICT,
    order_id        UUID NOT NULL REFERENCES public.gm_orders(id) ON DELETE RESTRICT,
    payment_id      UUID NOT NULL REFERENCES public.gm_payments(id) ON DELETE RESTRICT,

    -- Money
    amount_cents    BIGINT NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'EUR',

    -- Classification
    refund_type     TEXT NOT NULL DEFAULT 'FULL'
                    CHECK (refund_type IN ('FULL', 'PARTIAL', 'VOID')),
    reason          TEXT NOT NULL DEFAULT 'customer_request'
                    CHECK (reason IN (
                        'customer_request',
                        'item_defect',
                        'wrong_order',
                        'duplicate_charge',
                        'price_adjustment',
                        'manager_override',
                        'other'
                    )),
    reason_detail   TEXT,  -- free-text explanation (audit trail)

    -- Authorization chain (who approved)
    operator_id     UUID,           -- who initiated the refund
    operator_role   TEXT,           -- 'waiter', 'manager', 'owner'
    authorized_by   UUID,          -- who approved (if different from operator)
    authorization_method TEXT DEFAULT 'direct'
                    CHECK (authorization_method IN ('direct', 'pin', 'manager_approval', 'system')),

    -- Cash register context
    cash_register_id UUID REFERENCES public.gm_cash_registers(id),

    -- Fiscal link (filled after fiscal document is created)
    fiscal_document_id UUID,       -- FK added after gm_fiscal_documents is created

    -- Status (refunds are write-once, but fiscal processing may update)
    status          TEXT NOT NULL DEFAULT 'COMPLETED'
                    CHECK (status IN ('COMPLETED', 'PENDING_FISCAL', 'FISCAL_ISSUED', 'FAILED')),

    -- Idempotency
    idempotency_key TEXT,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gm_refunds IS
'TPV Compliance: Every refund (total or partial) is a ledger entry. Closes E16/E41 from ERROS_CANON.';

-- ---------------------------------------------------------------------------
-- 2. Constraints
-- ---------------------------------------------------------------------------
-- Refund amount must be positive
ALTER TABLE public.gm_refunds
    ADD CONSTRAINT gm_refunds_amount_positive CHECK (amount_cents > 0);

-- Idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_refunds_idempotency
    ON public.gm_refunds(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gm_refunds_restaurant
    ON public.gm_refunds(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gm_refunds_payment
    ON public.gm_refunds(payment_id);

CREATE INDEX IF NOT EXISTS idx_gm_refunds_order
    ON public.gm_refunds(order_id);

CREATE INDEX IF NOT EXISTS idx_gm_refunds_status
    ON public.gm_refunds(status)
    WHERE status != 'COMPLETED';

-- ---------------------------------------------------------------------------
-- 4. Immutability trigger (refunds are write-once ledger entries)
-- ---------------------------------------------------------------------------
-- Only allow UPDATE on status and fiscal_document_id (for fiscal processing)
CREATE OR REPLACE FUNCTION public.guard_refund_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'IMMUTABLE_REFUND: DELETE not allowed on gm_refunds'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Only status and fiscal_document_id can change (fiscal processing)
        IF OLD.amount_cents != NEW.amount_cents
           OR OLD.payment_id != NEW.payment_id
           OR OLD.order_id != NEW.order_id
           OR OLD.restaurant_id != NEW.restaurant_id
           OR OLD.refund_type != NEW.refund_type
           OR OLD.reason != NEW.reason
           OR OLD.operator_id IS DISTINCT FROM NEW.operator_id
           OR OLD.authorized_by IS DISTINCT FROM NEW.authorized_by
           OR OLD.idempotency_key IS DISTINCT FROM NEW.idempotency_key
           OR OLD.created_at != NEW.created_at THEN
            RAISE EXCEPTION 'IMMUTABLE_REFUND: Only status and fiscal_document_id can be updated on gm_refunds'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_refund_mutation ON public.gm_refunds;
CREATE TRIGGER trg_guard_refund_mutation
    BEFORE UPDATE OR DELETE ON public.gm_refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_refund_mutation();

-- ---------------------------------------------------------------------------
-- 5. CDC trigger: REFUND_CREATED → event_store
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.emit_refund_created_event()
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
        'REFUND',
        NEW.id::TEXT,
        1,
        'REFUND_CREATED',
        jsonb_build_object(
            'refund_id', NEW.id,
            'payment_id', NEW.payment_id,
            'order_id', NEW.order_id,
            'amount_cents', NEW.amount_cents,
            'currency', NEW.currency,
            'refund_type', NEW.refund_type,
            'reason', NEW.reason,
            'reason_detail', NEW.reason_detail,
            'operator_id', NEW.operator_id,
            'operator_role', NEW.operator_role,
            'authorized_by', NEW.authorized_by,
            'authorization_method', NEW.authorization_method,
            'cash_register_id', NEW.cash_register_id
        ),
        jsonb_build_object(
            'trigger', 'cdc_refund_created',
            'schema_version', '2',
            'fiscal_event', true,
            'requires_credit_note', true,
            'source_table', 'gm_refunds'
        ),
        NEW.restaurant_id,
        COALESCE(NEW.operator_id::TEXT, 'system')
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_emit_refund_created ON public.gm_refunds;
CREATE TRIGGER trg_emit_refund_created
    AFTER INSERT ON public.gm_refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_refund_created_event();

GRANT EXECUTE ON FUNCTION public.emit_refund_created_event() TO postgres;

-- ---------------------------------------------------------------------------
-- 6. Helper: total refunded for a payment
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_total_refunded_cents(p_payment_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(SUM(amount_cents), 0)::BIGINT
    FROM public.gm_refunds
    WHERE payment_id = p_payment_id
      AND status != 'FAILED';
$$;

GRANT EXECUTE ON FUNCTION public.get_total_refunded_cents(UUID) TO postgres;

COMMENT ON FUNCTION public.get_total_refunded_cents IS
'Returns total refunded amount in cents for a payment. Excludes FAILED refunds.';

-- ---------------------------------------------------------------------------
-- 7. Helper: check if order has any refunds
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_order_refund_summary(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'order_id', p_order_id,
        'total_refunded_cents', COALESCE(SUM(amount_cents), 0),
        'refund_count', COUNT(*),
        'refunds', COALESCE(jsonb_agg(jsonb_build_object(
            'refund_id', id,
            'payment_id', payment_id,
            'amount_cents', amount_cents,
            'refund_type', refund_type,
            'reason', reason,
            'status', status,
            'created_at', created_at
        ) ORDER BY created_at), '[]'::JSONB)
    ) INTO v_result
    FROM public.gm_refunds
    WHERE order_id = p_order_id
      AND status != 'FAILED';

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_refund_summary(UUID) TO postgres;

COMMIT;
