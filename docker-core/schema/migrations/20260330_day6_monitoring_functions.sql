-- ============================================================================
-- Day 6: Monitoring Functions Migration (CORRECTED)
-- File: 20260330_day6_monitoring_functions.sql
-- Purpose: Advanced monitoring, alerting, and performance metrics for webhooks
-- ============================================================================

BEGIN;

-- ============================================================================
-- Step 1: Add restaurant_id to webhook_deliveries if not exists
-- ============================================================================

ALTER TABLE webhook_deliveries
ADD COLUMN IF NOT EXISTS restaurant_id UUID,
ADD CONSTRAINT fk_webhook_deliveries_restaurant
  FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_restaurant_id
  ON webhook_deliveries(restaurant_id);

-- ============================================================================
-- Function 1: get_webhook_delivery_metrics
-- Purpose: Per-restaurant webhook health metrics (success rate, latency, etc.)
-- Returns: Aggregated metrics for the last N hours
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_webhook_delivery_metrics(
  p_restaurant_id UUID,
  p_hours INT DEFAULT 24
)
RETURNS TABLE(
  delivery_count BIGINT,
  success_count BIGINT,
  failed_count BIGINT,
  success_rate_percent NUMERIC,
  avg_delivery_time_ms NUMERIC,
  p50_latency_ms NUMERIC,
  p95_latency_ms NUMERIC,
  p99_latency_ms NUMERIC,
  oldest_pending_delivery_at TIMESTAMPTZ,
  pending_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_time TIMESTAMPTZ := NOW() - (p_hours || ' hours')::INTERVAL;
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS delivery_count,
    COUNT(*) FILTER (WHERE wd.status = 'delivered')::BIGINT AS success_count,
    COUNT(*) FILTER (WHERE wd.status IN ('permanent_error', 'max_retries_exceeded', 'failed'))::BIGINT AS failed_count,
    CASE
      WHEN COUNT(*) = 0 THEN NULL::NUMERIC
      ELSE (COUNT(*) FILTER (WHERE wd.status = 'delivered') * 100.0 / COUNT(*))::NUMERIC(5,2)
    END AS success_rate_percent,
    CASE
      WHEN COUNT(*) = 0 THEN NULL::NUMERIC
      ELSE ROUND(AVG(EXTRACT(EPOCH FROM (wd.sent_at - wd.created_at)) * 1000))::NUMERIC
    END AS avg_delivery_time_ms,
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (wd.sent_at - wd.created_at)) * 1000))::NUMERIC AS p50_latency_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (wd.sent_at - wd.created_at)) * 1000))::NUMERIC AS p95_latency_ms,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (wd.sent_at - wd.created_at)) * 1000))::NUMERIC AS p99_latency_ms,
    MIN(wd.created_at) FILTER (WHERE wd.status = 'pending') AS oldest_pending_delivery_at,
    COUNT(*) FILTER (WHERE wd.status = 'pending')::BIGINT AS pending_count
  FROM webhook_deliveries wd
  WHERE wd.restaurant_id = p_restaurant_id
    AND wd.created_at >= v_cutoff_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_webhook_delivery_metrics(UUID, INT) TO service_role;

-- ============================================================================
-- Function 2: get_failed_deliveries_alert
-- Purpose: Alert on failed deliveries requiring manual intervention
-- Returns: Deliveries stuck in failed/retry state
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_failed_deliveries_alert(
  p_max_age_hours INT DEFAULT 1
)
RETURNS TABLE(
  delivery_id UUID,
  restaurant_id UUID,
  webhook_url TEXT,
  status TEXT,
  attempt_number INT,
  max_attempts INT,
  http_status_code INT,
  error_reason TEXT,
  created_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  hours_since_creation NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.id AS delivery_id,
    wd.restaurant_id,
    wd.webhook_url,
    wd.status,
    wd.attempt_number,
    wd.max_attempts,
    wd.http_status_code,
    CASE
      WHEN wd.status = 'permanent_error' THEN 'Non-retryable error (4xx status code)'
      WHEN wd.status = 'max_retries_exceeded' THEN 'Maximum retry attempts exceeded'
      WHEN wd.status = 'failed' AND wd.next_retry_at IS NULL THEN 'Failed without retry scheduled'
      WHEN wd.status = 'failed' AND wd.next_retry_at > NOW() THEN 'Waiting for next retry window'
      ELSE 'Unknown failure reason'
    END AS error_reason,
    wd.created_at,
    wd.next_retry_at,
    ROUND(EXTRACT(EPOCH FROM (NOW() - wd.created_at)) / 3600)::NUMERIC AS hours_since_creation
  FROM webhook_deliveries wd
  WHERE (
    wd.status IN ('permanent_error', 'max_retries_exceeded', 'failed')
    OR (wd.status = 'failed' AND wd.next_retry_at < NOW())
  )
  AND wd.created_at >= NOW() - (p_max_age_hours || ' hours')::INTERVAL
  ORDER BY wd.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_failed_deliveries_alert(INT) TO service_role;

-- ============================================================================
-- Function 3: get_webhook_performance_metrics
-- Purpose: System-wide webhook performance and throughput metrics
-- Returns: Aggregate metrics across all restaurants/webhooks
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_webhook_performance_metrics()
RETURNS TABLE(
  metric_name TEXT,
  metric_value NUMERIC,
  measurement_unit TEXT,
  time_window_hours INT,
  calculated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_24h_ago TIMESTAMPTZ := NOW() - '24 hours'::INTERVAL;
  v_1h_ago TIMESTAMPTZ := NOW() - '1 hour'::INTERVAL;
  v_total_deliveries BIGINT;
  v_success_count BIGINT;
  v_failure_count BIGINT;
  v_success_rate NUMERIC;
  v_p50_latency NUMERIC;
  v_p95_latency NUMERIC;
  v_p99_latency NUMERIC;
  v_hourly_throughput NUMERIC;
BEGIN
  -- Total and success metrics (24h window)
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT,
    COUNT(*) FILTER (WHERE status IN ('permanent_error', 'max_retries_exceeded', 'failed'))::BIGINT
  INTO v_total_deliveries, v_success_count, v_failure_count
  FROM webhook_deliveries
  WHERE created_at >= v_24h_ago;

  v_success_rate := CASE
    WHEN v_total_deliveries = 0 THEN 0::NUMERIC
    ELSE (v_success_count * 100.0 / v_total_deliveries)::NUMERIC(5,2)
  END;

  -- Latency percentiles
  SELECT
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (sent_at - created_at)) * 1000))::NUMERIC,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (sent_at - created_at)) * 1000))::NUMERIC,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (sent_at - created_at)) * 1000))::NUMERIC
  INTO v_p50_latency, v_p95_latency, v_p99_latency
  FROM webhook_deliveries
  WHERE created_at >= v_24h_ago AND status = 'delivered' AND sent_at IS NOT NULL;

  -- Hourly throughput (last hour)
  SELECT ROUND(COUNT(*)::NUMERIC)::NUMERIC
  INTO v_hourly_throughput
  FROM webhook_deliveries
  WHERE created_at >= v_1h_ago;

  -- Return metrics as rows
  RETURN QUERY SELECT
    'total_deliveries_24h'::TEXT, v_total_deliveries::NUMERIC, 'count'::TEXT, 24::INT, NOW()::TIMESTAMPTZ
  UNION ALL SELECT
    'successful_deliveries_24h'::TEXT, v_success_count::NUMERIC, 'count'::TEXT, 24::INT, NOW()::TIMESTAMPTZ
  UNION ALL SELECT
    'failed_deliveries_24h'::TEXT, v_failure_count::NUMERIC, 'count'::TEXT, 24::INT, NOW()::TIMESTAMPTZ
  UNION ALL SELECT
    'success_rate_24h'::TEXT, v_success_rate, 'percent'::TEXT, 24::INT, NOW()::TIMESTAMPTZ
  UNION ALL SELECT
    'p50_latency_ms'::TEXT, v_p50_latency, 'milliseconds'::TEXT, 24::INT, NOW()::TIMESTAMPTZ
  UNION ALL SELECT
    'p95_latency_ms'::TEXT, v_p95_latency, 'milliseconds'::TEXT, 24::INT, NOW()::TIMESTAMPTZ
  UNION ALL SELECT
    'p99_latency_ms'::TEXT, v_p99_latency, 'milliseconds'::TEXT, 24::INT, NOW()::TIMESTAMPTZ
  UNION ALL SELECT
    'hourly_throughput'::TEXT, v_hourly_throughput, 'deliveries_per_hour'::TEXT, 1::INT, NOW()::TIMESTAMPTZ;

END;
$$;

GRANT EXECUTE ON FUNCTION public.get_webhook_performance_metrics() TO service_role;

-- ============================================================================
-- Function 4: get_payment_to_delivery_latency
-- Purpose: Measure time from payment event received to webhook_delivery created
-- Returns: Latency statistics and hourly breakdown
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_payment_to_delivery_latency(
  p_hours INT DEFAULT 24
)
RETURNS TABLE(
  metric_name TEXT,
  metric_value NUMERIC,
  measurement_unit TEXT,
  breakdown_hour TIMESTAMPTZ,
  sample_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff_time TIMESTAMPTZ := NOW() - (p_hours || ' hours')::INTERVAL;
BEGIN
  -- Overall latency metrics
  RETURN QUERY
  SELECT
    'avg_event_to_delivery_ms'::TEXT,
    ROUND(AVG(EXTRACT(EPOCH FROM (wd.created_at - we.created_at)) * 1000))::NUMERIC,
    'milliseconds'::TEXT,
    NULL::TIMESTAMPTZ,
    COUNT(*)::INT
  FROM webhook_deliveries wd
  JOIN webhook_events we ON wd.event_id = we.id
  WHERE we.created_at >= v_cutoff_time
    AND we.event_type IN ('transaction.completed', 'payment.completed', 'charge.succeeded', 'transaction.created')
  GROUP BY 1, 3

  UNION ALL

  SELECT
    'min_event_to_delivery_ms'::TEXT,
    ROUND(MIN(EXTRACT(EPOCH FROM (wd.created_at - we.created_at)) * 1000))::NUMERIC,
    'milliseconds'::TEXT,
    NULL::TIMESTAMPTZ,
    COUNT(*)::INT
  FROM webhook_deliveries wd
  JOIN webhook_events we ON wd.event_id = we.id
  WHERE we.created_at >= v_cutoff_time
    AND we.event_type IN ('transaction.completed', 'payment.completed', 'charge.succeeded', 'transaction.created')
  GROUP BY 1, 3

  UNION ALL

  SELECT
    'max_event_to_delivery_ms'::TEXT,
    ROUND(MAX(EXTRACT(EPOCH FROM (wd.created_at - we.created_at)) * 1000))::NUMERIC,
    'milliseconds'::TEXT,
    NULL::TIMESTAMPTZ,
    COUNT(*)::INT
  FROM webhook_deliveries wd
  JOIN webhook_events we ON wd.event_id = we.id
  WHERE we.created_at >= v_cutoff_time
    AND we.event_type IN ('transaction.completed', 'payment.completed', 'charge.succeeded', 'transaction.created')
  GROUP BY 1, 3

  -- Hourly breakdown
  UNION ALL
  SELECT
    'hourly_avg_event_to_delivery_ms'::TEXT,
    ROUND(AVG(EXTRACT(EPOCH FROM (wd.created_at - we.created_at)) * 1000))::NUMERIC,
    'milliseconds'::TEXT,
    DATE_TRUNC('hour', we.created_at)::TIMESTAMPTZ,
    COUNT(*)::INT
  FROM webhook_deliveries wd
  JOIN webhook_events we ON wd.event_id = we.id
  WHERE we.created_at >= v_cutoff_time
    AND we.event_type IN ('transaction.completed', 'payment.completed', 'charge.succeeded', 'transaction.created')
  GROUP BY DATE_TRUNC('hour', we.created_at)
  ORDER BY breakdown_hour DESC;

END;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_to_delivery_latency(INT) TO service_role;

-- ============================================================================
-- Index Optimization for Monitoring Queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_status
  ON webhook_deliveries(created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_restaurant_created
  ON webhook_deliveries(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry
  ON webhook_deliveries(status, next_retry_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_webhook_events_created_type
  ON webhook_events(created_at DESC, event_type);

-- ============================================================================
-- Update webhook_deliveries records with restaurant_id from orders/restaurants
-- ============================================================================

-- For now, we only update records we can correlate
-- A more complete mapping would require order tracking, deferred to Day 6+ implementation
UPDATE webhook_deliveries wd
SET restaurant_id = r.id
FROM gm_restaurants r
WHERE wd.webhook_url LIKE '%' || r.id::TEXT || '%'
  AND wd.restaurant_id IS NULL;

-- ============================================================================
-- Commit Transaction
-- ============================================================================

COMMIT;
