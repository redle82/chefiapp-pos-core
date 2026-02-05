-- 022_payment_observability.sql
-- Fiscal Observability & Audit Logs
-- 1. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.gm_payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    -- Logical link
    order_id UUID,
    operator_id UUID,
    amount_cents INTEGER,
    method TEXT,
    result TEXT NOT NULL,
    -- 'success', 'fail', 'timeout'
    error_code TEXT,
    error_message TEXT,
    idempotency_key TEXT,
    payment_id UUID,
    duration_ms INTEGER,
    client_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Optimize for queries
    CONSTRAINT fk_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.gm_restaurants(id) ON DELETE CASCADE -- No foreign key on payment_id because it might fail to create
);
-- Index for quick health checks
CREATE INDEX IF NOT EXISTS idx_payment_audit_restaurant_date ON public.gm_payment_audit_logs(restaurant_id, created_at);
-- 2. Log Attempt RPC
CREATE OR REPLACE FUNCTION public.fn_log_payment_attempt(
        p_order_id UUID,
        p_restaurant_id UUID,
        p_operator_id UUID,
        p_amount_cents INTEGER,
        p_method TEXT,
        p_result TEXT,
        p_error_code TEXT DEFAULT NULL,
        p_error_message TEXT DEFAULT NULL,
        p_idempotency_key TEXT DEFAULT NULL,
        p_payment_id UUID DEFAULT NULL,
        p_duration_ms INTEGER DEFAULT NULL,
        p_client_info JSONB DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_log_id UUID;
BEGIN
INSERT INTO public.gm_payment_audit_logs (
        order_id,
        restaurant_id,
        operator_id,
        amount_cents,
        method,
        result,
        error_code,
        error_message,
        idempotency_key,
        payment_id,
        duration_ms,
        client_info
    )
VALUES (
        p_order_id,
        p_restaurant_id,
        p_operator_id,
        p_amount_cents,
        p_method,
        p_result,
        p_error_code,
        p_error_message,
        p_idempotency_key,
        p_payment_id,
        p_duration_ms,
        p_client_info
    )
RETURNING id INTO v_log_id;
RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
EXCEPTION
WHEN OTHERS THEN -- Fail safe: don't break flow if log fails? 
-- Actually, for sovereign logs, we might want to know. 
-- But usually logging is best-effort for non-critical path, but critical for audit.
-- Let's return error but not raise.
RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
-- 3. Get Payment Health RPC
CREATE OR REPLACE FUNCTION public.get_payment_health(p_restaurant_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_attempts_24h INTEGER;
v_success_24h INTEGER;
v_fail_24h INTEGER;
v_avg_duration_ms NUMERIC;
v_total_processed_cents BIGINT;
v_most_common_error TEXT;
v_success_rate NUMERIC;
BEGIN -- Time Window: Last 24h
WITH window_stats AS (
    SELECT result,
        duration_ms,
        amount_cents,
        error_code
    FROM public.gm_payment_audit_logs
    WHERE restaurant_id = p_restaurant_id
        AND created_at >= NOW() - INTERVAL '24 hours'
)
SELECT COUNT(*) AS attempts,
    COUNT(*) FILTER (
        WHERE result = 'success'
    ) AS successes,
    COUNT(*) FILTER (
        WHERE result != 'success'
    ) AS failures,
    AVG(duration_ms) FILTER (
        WHERE result = 'success'
    )::NUMERIC(10, 2) AS avg_dur,
    SUM(amount_cents) FILTER (
        WHERE result = 'success'
    ) AS total_cents,
    mode() WITHIN GROUP (
        ORDER BY error_code
    ) FILTER (
        WHERE result != 'success'
    ) AS common_err INTO v_attempts_24h,
    v_success_24h,
    v_fail_24h,
    v_avg_duration_ms,
    v_total_processed_cents,
    v_most_common_error
FROM window_stats;
-- Calculate Rate
IF v_attempts_24h > 0 THEN v_success_rate := (v_success_24h::NUMERIC / v_attempts_24h::NUMERIC) * 100;
ELSE v_success_rate := 100;
END IF;
RETURN jsonb_build_object(
    'attempts_24h',
    COALESCE(v_attempts_24h, 0),
    'success_24h',
    COALESCE(v_success_24h, 0),
    'fail_24h',
    COALESCE(v_fail_24h, 0),
    'success_rate',
    TRUNC(v_success_rate, 2),
    'avg_duration_ms',
    COALESCE(v_avg_duration_ms, 0),
    'total_processed_cents',
    COALESCE(v_total_processed_cents, 0),
    'most_common_error',
    v_most_common_error
);
END;
$$;