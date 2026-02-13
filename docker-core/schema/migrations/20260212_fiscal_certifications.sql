-- =============================================================================
-- PHASE 6: First Fiscal Certification Baseline (Generic / Jurisdiction-Agnostic)
-- =============================================================================
-- Tracks fiscal certification requests per restaurant. Jurisdiction-specific
-- details (Spain SII, Portugal SAF-T, etc.) are stored in metadata JSONB so
-- the schema remains extensible without DDL changes.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Fiscal certifications table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_fiscal_certifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE RESTRICT,

    jurisdiction    TEXT NOT NULL DEFAULT 'GENERIC'
                    CHECK (jurisdiction IN (
                        'GENERIC',
                        'ES',       -- Spain (SII / TicketBAI / VeriFactu)
                        'PT',       -- Portugal (SAF-T / AT)
                        'FR',       -- France (NF525)
                        'IT',       -- Italy (SDI)
                        'DE',       -- Germany (TSE / KassenSichV)
                        'OTHER'
                    )),

    status          TEXT NOT NULL DEFAULT 'REQUESTED'
                    CHECK (status IN (
                        'REQUESTED',
                        'SUBMITTED',
                        'UNDER_REVIEW',
                        'APPROVED',
                        'REJECTED',
                        'EXPIRED',
                        'REVOKED'
                    )),

    requested_by    UUID,
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at    TIMESTAMPTZ,
    approved_at     TIMESTAMPTZ,
    rejected_at     TIMESTAMPTZ,

    -- Checklist tracks per-jurisdiction requirements as JSONB
    -- e.g. { "hash_chain_ok": true, "fiscal_docs_count": 42, … }
    checklist       JSONB NOT NULL DEFAULT '{}'::jsonb,

    notes           TEXT,

    -- Jurisdiction-specific fields and external references
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Signature artifact (populated by record_fiscal_signature)
    signature_data  JSONB,

    idempotency_key TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gm_fiscal_certifications IS
'Fiscal certification lifecycle per restaurant. Jurisdiction-specific data lives in metadata/checklist JSONB.';

-- Uniqueness: one active certification per restaurant+jurisdiction at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscal_cert_active
    ON public.gm_fiscal_certifications(restaurant_id, jurisdiction)
    WHERE status NOT IN ('REJECTED', 'EXPIRED', 'REVOKED');

CREATE INDEX IF NOT EXISTS idx_fiscal_cert_restaurant
    ON public.gm_fiscal_certifications(restaurant_id, requested_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fiscal_cert_idempotency
    ON public.gm_fiscal_certifications(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Mutation guard (immutable core fields)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_fiscal_cert_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'IMMUTABLE_FISCAL_CERT: DELETE not allowed'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.restaurant_id  != NEW.restaurant_id
           OR OLD.jurisdiction != NEW.jurisdiction
           OR OLD.requested_at != NEW.requested_at
           OR OLD.requested_by != NEW.requested_by
           OR OLD.created_at   != NEW.created_at THEN
            RAISE EXCEPTION 'IMMUTABLE_FISCAL_CERT: Immutable fields cannot be changed'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_fiscal_cert_mutation ON public.gm_fiscal_certifications;
CREATE TRIGGER trg_guard_fiscal_cert_mutation
    BEFORE UPDATE OR DELETE ON public.gm_fiscal_certifications
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_fiscal_cert_mutation();

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.gm_fiscal_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fiscal_cert_select"
    ON public.gm_fiscal_certifications
    FOR SELECT TO authenticated
    USING (has_restaurant_access(restaurant_id));

CREATE POLICY "fiscal_cert_service"
    ON public.gm_fiscal_certifications
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_fiscal_certifications FROM anon;

-- ---------------------------------------------------------------------------
-- 4. RPC: request_fiscal_certification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_fiscal_certification(
    p_restaurant_id  UUID,
    p_jurisdiction   TEXT DEFAULT 'GENERIC',
    p_checklist      JSONB DEFAULT '{}'::jsonb,
    p_notes          TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_existing UUID;
BEGIN
    -- Role gate: only manager/owner can request
    PERFORM require_restaurant_role(p_restaurant_id, ARRAY['manager', 'owner']);

    -- Idempotency check
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing
        FROM public.gm_fiscal_certifications
        WHERE idempotency_key = p_idempotency_key;

        IF v_existing IS NOT NULL THEN
            RETURN jsonb_build_object(
                'id', v_existing,
                'status', 'IDEMPOTENT_HIT',
                'message', 'Certification request already exists'
            );
        END IF;
    END IF;

    INSERT INTO public.gm_fiscal_certifications (
        restaurant_id, jurisdiction, status,
        requested_by, requested_at,
        checklist, notes, idempotency_key
    ) VALUES (
        p_restaurant_id, p_jurisdiction, 'REQUESTED',
        auth.uid(), NOW(),
        p_checklist, p_notes, p_idempotency_key
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'id', v_id,
        'status', 'REQUESTED',
        'jurisdiction', p_jurisdiction
    );
END;
$$;

COMMENT ON FUNCTION public.request_fiscal_certification IS
'Request a fiscal certification for a restaurant. Requires manager/owner role.';

-- ---------------------------------------------------------------------------
-- 5. RPC: get_fiscal_certification_status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_fiscal_certification_status(
    p_restaurant_id  UUID,
    p_jurisdiction   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Role gate: authenticated with restaurant access
    PERFORM require_restaurant_role(p_restaurant_id, ARRAY['staff', 'waiter', 'kitchen', 'manager', 'owner']);

    SELECT jsonb_agg(jsonb_build_object(
        'id',           fc.id,
        'jurisdiction',  fc.jurisdiction,
        'status',        fc.status,
        'requested_at',  fc.requested_at,
        'submitted_at',  fc.submitted_at,
        'approved_at',   fc.approved_at,
        'rejected_at',   fc.rejected_at,
        'checklist',     fc.checklist,
        'notes',         fc.notes,
        'signature_data', fc.signature_data,
        'updated_at',    fc.updated_at
    ) ORDER BY fc.requested_at DESC)
    INTO v_result
    FROM public.gm_fiscal_certifications fc
    WHERE fc.restaurant_id = p_restaurant_id
      AND (p_jurisdiction IS NULL OR fc.jurisdiction = p_jurisdiction);

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.get_fiscal_certification_status IS
'Returns fiscal certification status for a restaurant, optionally filtered by jurisdiction.';

-- ---------------------------------------------------------------------------
-- 6. RPC: record_fiscal_signature
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_fiscal_signature(
    p_certification_id UUID,
    p_signature_data   JSONB,
    p_new_status       TEXT DEFAULT 'SUBMITTED'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cert RECORD;
BEGIN
    -- Fetch certification
    SELECT * INTO v_cert
    FROM public.gm_fiscal_certifications
    WHERE id = p_certification_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'FISCAL_CERT_NOT_FOUND: certification % does not exist', p_certification_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Role gate: only manager/owner can record signatures
    PERFORM require_restaurant_role(v_cert.restaurant_id, ARRAY['manager', 'owner']);

    -- Validate status transition
    IF p_new_status NOT IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: % is not a valid target status', p_new_status
            USING ERRCODE = 'P0001';
    END IF;

    -- Update certification with signature and status
    UPDATE public.gm_fiscal_certifications
    SET signature_data = p_signature_data,
        status         = p_new_status,
        submitted_at   = CASE WHEN p_new_status = 'SUBMITTED' AND submitted_at IS NULL THEN NOW() ELSE submitted_at END,
        approved_at    = CASE WHEN p_new_status = 'APPROVED'  AND approved_at  IS NULL THEN NOW() ELSE approved_at  END,
        rejected_at    = CASE WHEN p_new_status = 'REJECTED'  AND rejected_at  IS NULL THEN NOW() ELSE rejected_at  END
    WHERE id = p_certification_id;

    RETURN jsonb_build_object(
        'id',     p_certification_id,
        'status', p_new_status,
        'signed', true
    );
END;
$$;

COMMENT ON FUNCTION public.record_fiscal_signature IS
'Records a fiscal signature artifact and advances certification status. Requires manager/owner.';

-- ---------------------------------------------------------------------------
-- 7. GRANTs
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.gm_fiscal_certifications TO authenticated;
GRANT ALL    ON public.gm_fiscal_certifications TO service_role;

GRANT EXECUTE ON FUNCTION public.request_fiscal_certification       TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fiscal_certification_status    TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_fiscal_signature            TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_fiscal_certification      FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_fiscal_certification_status   FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_fiscal_signature           FROM anon;

COMMIT;
