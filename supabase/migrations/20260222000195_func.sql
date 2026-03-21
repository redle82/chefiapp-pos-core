CREATE OR REPLACE FUNCTION public.get_payment_health(p_restaurant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_attempts_24h INTEGER;
    v_success_24h INTEGER;
    v_fail_24h INTEGER;
    v_avg_duration_ms NUMERIC;
    v_total_processed_cents BIGINT;
    v_most_common_error TEXT;
    v_success_rate NUMERIC;
BEGIN
    WITH window_stats AS (
        SELECT result, duration_ms, amount_cents, error_code
        FROM public.gm_payment_audit_logs
        WHERE restaurant_id = p_restaurant_id AND created_at >= NOW() - INTERVAL '24 hours'
    )
    SELECT
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE result = 'success')::INTEGER,
        COUNT(*) FILTER (WHERE result != 'success')::INTEGER,
        AVG(duration_ms) FILTER (WHERE result = 'success')::NUMERIC(10,2),
        COALESCE(SUM(amount_cents) FILTER (WHERE result = 'success'), 0)::BIGINT,
        (array_agg(error_code) FILTER (WHERE result != 'success' AND error_code IS NOT NULL))[1]
    INTO v_attempts_24h, v_success_24h, v_fail_24h, v_avg_duration_ms, v_total_processed_cents, v_most_common_error
    FROM window_stats;
    IF v_attempts_24h > 0 THEN
        v_success_rate := (v_success_24h::NUMERIC / v_attempts_24h::NUMERIC) * 100;
    ELSE
        v_success_rate := 100;
    END IF;
    RETURN jsonb_build_object(
        'attempts_24h', COALESCE(v_attempts_24h, 0),
        'success_24h', COALESCE(v_success_24h, 0),
        'fail_24h', COALESCE(v_fail_24h, 0),
        'success_rate', TRUNC(v_success_rate, 2),
        'avg_duration_ms', COALESCE(v_avg_duration_ms, 0),
        'total_processed_cents', COALESCE(v_total_processed_cents, 0),
        'most_common_error', v_most_common_error
    );
END;
$function$;
