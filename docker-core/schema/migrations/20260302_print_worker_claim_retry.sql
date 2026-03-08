-- =============================================================================
-- Print Brain PR-2 — claim/poll/retry primitives for desktop print agent
-- Date: 2026-03-02
-- =============================================================================

BEGIN;

ALTER TABLE public.gm_print_jobs
    ADD COLUMN IF NOT EXISTS print_function TEXT,
    ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS claimed_by_station_id UUID REFERENCES public.gm_terminals(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'print_jobs_type_check'
          AND conrelid = 'public.gm_print_jobs'::regclass
    ) THEN
        ALTER TABLE public.gm_print_jobs
        DROP CONSTRAINT print_jobs_type_check;
    END IF;

    ALTER TABLE public.gm_print_jobs
    ADD CONSTRAINT print_jobs_type_check CHECK (type IN ('kitchen_ticket', 'receipt', 'z_report', 'label'));
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'print_jobs_function_check'
          AND conrelid = 'public.gm_print_jobs'::regclass
    ) THEN
        ALTER TABLE public.gm_print_jobs
        ADD CONSTRAINT print_jobs_function_check CHECK (print_function IN ('kitchen', 'receipt', 'labels'));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'print_jobs_attempt_count_check'
          AND conrelid = 'public.gm_print_jobs'::regclass
    ) THEN
        ALTER TABLE public.gm_print_jobs
        ADD CONSTRAINT print_jobs_attempt_count_check CHECK (attempt_count >= 0);
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_print_jobs_pending_retry
ON public.gm_print_jobs(status, next_retry_at, claimed_at)
WHERE status = 'pending';

UPDATE public.gm_print_jobs
SET print_function = CASE
    WHEN type = 'kitchen_ticket' THEN 'kitchen'
    WHEN type = 'receipt' THEN 'receipt'
    WHEN type = 'label' THEN 'labels'
    ELSE NULL
END
WHERE print_function IS NULL;

CREATE OR REPLACE FUNCTION public.request_print(
    p_restaurant_id UUID,
    p_type TEXT,
    p_order_id UUID DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_id UUID;
    v_status TEXT := 'pending';
    v_print_function TEXT;
BEGIN
    IF p_type NOT IN ('kitchen_ticket', 'receipt', 'z_report', 'label') THEN
        RAISE EXCEPTION 'INVALID_TYPE: Tipo de impressão inválido: %', p_type;
    END IF;

    v_print_function := COALESCE(
        NULLIF(BTRIM(p_payload->>'print_function'), ''),
        CASE
            WHEN p_type = 'kitchen_ticket' THEN 'kitchen'
            WHEN p_type = 'receipt' THEN 'receipt'
            WHEN p_type = 'label' THEN 'labels'
            ELSE NULL
        END
    );

    INSERT INTO public.gm_print_jobs (
        restaurant_id,
        type,
        print_function,
        order_id,
        payload,
        status,
        attempt_count,
        next_retry_at,
        claimed_by_station_id,
        claimed_at,
        updated_at
    )
    VALUES (
        p_restaurant_id,
        p_type,
        v_print_function,
        p_order_id,
        p_payload,
        v_status,
        0,
        NOW(),
        NULL,
        NULL,
        NOW()
    )
    RETURNING id, status INTO v_job_id, v_status;

    RETURN jsonb_build_object(
        'job_id', v_job_id,
        'status', v_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_print TO postgres;

CREATE OR REPLACE FUNCTION public.set_print_job_status(
    p_job_id UUID,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    IF p_status NOT IN ('sent', 'failed') THEN
        RAISE EXCEPTION 'INVALID_STATUS: %', p_status;
    END IF;

    UPDATE public.gm_print_jobs
    SET status = p_status,
        error_message = CASE WHEN p_status = 'failed' THEN p_error_message ELSE NULL END,
        claimed_by_station_id = NULL,
        claimed_at = NULL,
        next_retry_at = NULL,
        updated_at = NOW()
    WHERE id = p_job_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
        RAISE EXCEPTION 'PRINT_JOB_NOT_FOUND: %', p_job_id;
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_print_job_status TO postgres;

CREATE OR REPLACE FUNCTION public.list_pending_print_jobs(
    p_station_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', j.id,
                'restaurant_id', j.restaurant_id,
                'type', j.type,
                'print_function', j.print_function,
                'payload', j.payload,
                'attempt_count', j.attempt_count,
                'next_retry_at', j.next_retry_at,
                'created_at', j.created_at
            )
            ORDER BY j.created_at ASC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM (
        SELECT id, restaurant_id, type, print_function, payload, attempt_count, next_retry_at, created_at
        FROM public.gm_print_jobs
        WHERE status = 'pending'
          AND COALESCE(next_retry_at, created_at) <= NOW()
          AND (
            claimed_by_station_id IS NULL
            OR claimed_at IS NULL
            OR claimed_at < NOW() - INTERVAL '2 minutes'
          )
        ORDER BY created_at ASC
        LIMIT GREATEST(COALESCE(p_limit, 20), 1)
    ) j;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_pending_print_jobs TO postgres;

CREATE OR REPLACE FUNCTION public.claim_print_job(
    p_job_id UUID,
    p_station_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job RECORD;
BEGIN
    UPDATE public.gm_print_jobs
    SET claimed_by_station_id = p_station_id,
        claimed_at = NOW(),
        attempt_count = attempt_count + 1,
        updated_at = NOW()
    WHERE id = p_job_id
      AND status = 'pending'
      AND COALESCE(next_retry_at, created_at) <= NOW()
      AND (
        claimed_by_station_id IS NULL
        OR claimed_at IS NULL
        OR claimed_at < NOW() - INTERVAL '2 minutes'
      )
    RETURNING id, restaurant_id, type, print_function, payload, attempt_count, next_retry_at, claimed_at
    INTO v_job;

    IF v_job.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'claimed', false);
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'claimed', true,
        'job', jsonb_build_object(
            'id', v_job.id,
            'restaurant_id', v_job.restaurant_id,
            'type', v_job.type,
            'print_function', v_job.print_function,
            'payload', v_job.payload,
            'attempt_count', v_job.attempt_count,
            'next_retry_at', v_job.next_retry_at,
            'claimed_at', v_job.claimed_at
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_print_job TO postgres;

CREATE OR REPLACE FUNCTION public.mark_print_job_retry(
    p_job_id UUID,
    p_station_id UUID,
    p_error_message TEXT,
    p_retry_seconds INTEGER DEFAULT 20,
    p_max_attempts INTEGER DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job RECORD;
    v_next_retry_at TIMESTAMPTZ := NOW() + make_interval(secs => GREATEST(COALESCE(p_retry_seconds, 20), 5));
BEGIN
    SELECT id, attempt_count, status, claimed_by_station_id
    INTO v_job
    FROM public.gm_print_jobs
    WHERE id = p_job_id;

    IF v_job.id IS NULL THEN
        RAISE EXCEPTION 'PRINT_JOB_NOT_FOUND: %', p_job_id;
    END IF;

    IF v_job.status <> 'pending' THEN
        RETURN jsonb_build_object('ok', false, 'status', v_job.status);
    END IF;

    IF v_job.claimed_by_station_id IS NOT NULL AND v_job.claimed_by_station_id <> p_station_id THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'CLAIMED_BY_OTHER_STATION');
    END IF;

    IF v_job.attempt_count >= GREATEST(COALESCE(p_max_attempts, 3), 1) THEN
        UPDATE public.gm_print_jobs
        SET status = 'failed',
            error_message = p_error_message,
            claimed_by_station_id = NULL,
            claimed_at = NULL,
            next_retry_at = NULL,
            updated_at = NOW()
        WHERE id = p_job_id;

        RETURN jsonb_build_object('ok', true, 'status', 'failed');
    END IF;

    UPDATE public.gm_print_jobs
    SET status = 'pending',
        error_message = p_error_message,
        claimed_by_station_id = NULL,
        claimed_at = NULL,
        next_retry_at = v_next_retry_at,
        updated_at = NOW()
    WHERE id = p_job_id;

    RETURN jsonb_build_object('ok', true, 'status', 'pending', 'next_retry_at', v_next_retry_at);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_print_job_retry TO postgres;

COMMIT;
