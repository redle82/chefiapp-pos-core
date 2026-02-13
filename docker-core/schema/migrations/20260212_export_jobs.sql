-- =============================================================================
-- PHASE 5B/C: Export Job Queue + Audit Export RPCs
-- =============================================================================
-- Provides a durable export queue for audit and compliance exports.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Export jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_export_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE RESTRICT,

    export_type     TEXT NOT NULL CHECK (export_type IN (
        'AUDIT_LOGS',
        'EVENT_STORE',
        'LEGAL_SEALS',
        'FISCAL_DOCUMENTS',
        'ORDERS',
        'PAYMENTS',
        'REFUNDS',
        'SHIFTS',
        'RECONCILIATIONS'
    )),

    format          TEXT NOT NULL DEFAULT 'CSV'
                    CHECK (format IN ('CSV', 'JSON', 'JSONL')),

    status          TEXT NOT NULL DEFAULT 'QUEUED'
                    CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),

    requested_by    UUID,
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,

    filter_from     TIMESTAMPTZ,
    filter_to       TIMESTAMPTZ,

    parameters      JSONB NOT NULL DEFAULT '{}'::jsonb,

    result_uri      TEXT,
    result_checksum TEXT,
    result_size_bytes BIGINT,

    error_code      TEXT,
    error_message   TEXT,

    idempotency_key TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.gm_export_jobs IS
'Export job queue for audit/compliance. Worker processes the job and fills result_uri.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_export_jobs_idempotency
    ON public.gm_export_jobs(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_export_jobs_status
    ON public.gm_export_jobs(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_jobs_restaurant
    ON public.gm_export_jobs(restaurant_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_jobs_type
    ON public.gm_export_jobs(export_type, requested_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Mutation guard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_export_job_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'IMMUTABLE_EXPORT_JOB: DELETE not allowed'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.restaurant_id != NEW.restaurant_id
           OR OLD.export_type != NEW.export_type
           OR OLD.format != NEW.format
           OR OLD.requested_by IS DISTINCT FROM NEW.requested_by
           OR OLD.requested_at != NEW.requested_at
           OR OLD.created_at != NEW.created_at THEN
            RAISE EXCEPTION 'IMMUTABLE_EXPORT_JOB: Immutable fields cannot be changed'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guard_export_job_mutation ON public.gm_export_jobs;
CREATE TRIGGER trg_guard_export_job_mutation
    BEFORE UPDATE OR DELETE ON public.gm_export_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_export_job_mutation();

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.gm_export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "export_jobs_select"
    ON public.gm_export_jobs
    FOR SELECT TO authenticated
    USING (has_restaurant_access(restaurant_id));

CREATE POLICY "export_jobs_service"
    ON public.gm_export_jobs
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_export_jobs FROM anon;

-- ---------------------------------------------------------------------------
-- 4. RPCs: request + lifecycle
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_export_job(
    p_restaurant_id UUID,
    p_export_type TEXT,
    p_format TEXT DEFAULT 'CSV',
    p_filter_from TIMESTAMPTZ DEFAULT NULL,
    p_filter_to TIMESTAMPTZ DEFAULT NULL,
    p_parameters JSONB DEFAULT '{}'::jsonb,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Only manager/owner can request exports
    PERFORM public.require_restaurant_role(
        p_restaurant_id,
        ARRAY['owner', 'manager']
    );

    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_id
        FROM public.gm_export_jobs
        WHERE idempotency_key = p_idempotency_key;

        IF v_id IS NOT NULL THEN
            RETURN jsonb_build_object('id', v_id, 'status', 'QUEUED', 'idempotent', true);
        END IF;
    END IF;

    INSERT INTO public.gm_export_jobs (
        restaurant_id, export_type, format, status,
        requested_by, filter_from, filter_to, parameters, idempotency_key
    ) VALUES (
        p_restaurant_id, p_export_type, p_format, 'QUEUED',
        auth.uid(), p_filter_from, p_filter_to, COALESCE(p_parameters, '{}'::jsonb), p_idempotency_key
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('id', v_id, 'status', 'QUEUED');
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_export_job_running(
    p_job_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gm_export_jobs
    SET status = 'RUNNING', started_at = NOW()
    WHERE id = p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_export_job(
    p_job_id UUID,
    p_result_uri TEXT,
    p_checksum TEXT,
    p_size_bytes BIGINT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gm_export_jobs
    SET status = 'SUCCEEDED',
        result_uri = p_result_uri,
        result_checksum = p_checksum,
        result_size_bytes = p_size_bytes,
        completed_at = NOW()
    WHERE id = p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_export_job(
    p_job_id UUID,
    p_error_code TEXT,
    p_error_message TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gm_export_jobs
    SET status = 'FAILED',
        error_code = p_error_code,
        error_message = p_error_message,
        completed_at = NOW()
    WHERE id = p_job_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_export_job(
    p_job_id UUID,
    p_error_message TEXT DEFAULT 'Cancelled by user'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.gm_export_jobs
    SET status = 'CANCELLED',
        error_message = p_error_message,
        completed_at = NOW()
    WHERE id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_export_job(
    UUID, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB, TEXT
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.mark_export_job_running(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_export_job(UUID, TEXT, TEXT, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_export_job(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_export_job(UUID, TEXT) TO service_role;

COMMIT;
