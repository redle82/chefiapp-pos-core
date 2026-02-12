-- 20260215_metrics_and_alerting.sql
-- Phase B: Metrics baseline + internal alerting

-- 1. METRICS TABLE
CREATE TABLE IF NOT EXISTS public.core_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    endpoint TEXT NOT NULL,
    action TEXT NOT NULL,
    latency_ms INTEGER,
    error_type TEXT,
    error_message TEXT,
    volume INTEGER DEFAULT 1,
    tenant_id UUID
);

-- 2. METRICS LOGGING RPC
CREATE OR REPLACE FUNCTION public.log_core_metric(
    p_endpoint TEXT,
    p_action TEXT,
    p_latency_ms INTEGER,
    p_error_type TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_tenant_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.core_metrics (endpoint, action, latency_ms, error_type, error_message, tenant_id)
    VALUES (p_endpoint, p_action, p_latency_ms, p_error_type, p_error_message, p_tenant_id);
END;
$$;

-- 3. ALERTING: INVALID STATES CHECK
CREATE OR REPLACE FUNCTION public.check_invalid_states()
RETURNS TABLE(problem TEXT, affected_id UUID) AS $$
BEGIN
    -- Example: Orphaned shifts (no open/close)
    RETURN QUERY
    SELECT 'orphaned_shift', id FROM public.gm_shifts WHERE closed_at IS NULL AND opened_at IS NULL;
    -- Add more checks as needed
END;
$$ LANGUAGE plpgsql;

-- 4. SCHEDULED ALERT LOGGING (manual or via cron)
-- To be called by a script or scheduled job
CREATE OR REPLACE FUNCTION public.log_alerts_from_invalid_states()
RETURNS VOID AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT * FROM public.check_invalid_states() LOOP
        PERFORM public.log_audit_event(
            NULL, -- tenant_id (set if available)
            'alert',
            rec.problem,
            NULL,
            'system',
            NULL,
            rec.affected_id,
            'failure',
            NULL,
            NULL,
            NULL,
            jsonb_build_object('source', 'check_invalid_states')
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
