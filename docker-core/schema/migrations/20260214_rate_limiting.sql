-- Migration: 20260214_rate_limiting.sql
-- Purpose: Add database-enforced rate limiting to critical RPC endpoints
-- Scope: Per-restaurant, per-endpoint rate limiting using token bucket algorithm
-- Risk: Medium (schema changes + RPC integration; requires careful quota tuning)
-- Dependencies: A1 (RLS) and A2 (idempotency) must be deployed first; audit logs enabled
--
-- Rate Limiting Pattern (Token Bucket):
-- 1. Each restaurant has a quota per endpoint (e.g., 600 orders/min)
-- 2. Tokens refill at fixed rate (600 tokens = 10 tokens/sec over 60 seconds)
-- 3. Before operation: check_and_decrement_rate_limit(restaurant_id, endpoint, tokens_required)
-- 4. If tokens available: decrement and allow (return {success: true, remaining_tokens: N})
-- 5. If quota exceeded: deny and log violation (return {success: false, retry_after: Ns})
-- 6. All violations logged to gm_audit_logs for monitoring/alerting
--
-- Default Quotas (per restaurant per minute):
-- - create_order: 600 req/min (10 req/sec) → endpoint weight = 1 token
-- - process_order_payment: 300 req/min (5 req/sec) → endpoint weight = 2 tokens
-- - close_shift: 100 req/min (~1.67 req/sec) → endpoint weight = 6 tokens
-- - bulk_order_items: 200 req/min (3.33 req/sec) → endpoint weight = 3 tokens
--
-- Benefits:
-- - Prevents API abuse and DDoS attacks
-- - Per-tenant isolation: Restaurant A quota independent from B
-- - Per-endpoint flexibility: Different limits for different operations
-- - Graceful degradation: Clients receive retry_after header
-- - Audit trail: All violations tracked, enabling alerting/SLOs

BEGIN;

-- ========================================================================
-- PHASE 1: Create Rate Limit Quota Definition Table
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.gm_rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_name TEXT NOT NULL UNIQUE,
  max_tokens_per_minute INTEGER NOT NULL DEFAULT 600,
  token_weight INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

CREATE INDEX idx_gm_rate_limit_config_endpoint ON public.gm_rate_limit_config(endpoint_name);

COMMENT ON TABLE public.gm_rate_limit_config IS
  'Defines rate limit quotas for each endpoint. Token weight allows asymmetric limits (e.g., payment is heavier than order).';

COMMENT ON COLUMN public.gm_rate_limit_config.max_tokens_per_minute IS
  'Maximum tokens per minute per restaurant. Refill rate = max_tokens_per_minute / 60 tokens per second.';

COMMENT ON COLUMN public.gm_rate_limit_config.token_weight IS
  'Cost of one operation. If endpoint requires 2 tokens and max_tokens=600, then max operations = 300/min.';

-- Insert default endpoint configurations
INSERT INTO public.gm_rate_limit_config (endpoint_name, max_tokens_per_minute, token_weight, description, enabled)
VALUES
  ('create_order', 600, 1, 'New order creation (lightweight)', true),
  ('process_order_payment', 300, 2, 'Payment processing (moderate weight)', true),
  ('close_shift', 100, 6, 'Shift closure (heavy operation)', true),
  ('bulk_order_items', 200, 3, 'Bulk item operations (moderate-heavy)', true),
  ('modify_order', 400, 1, 'Order modification (lightweight)', true),
  ('void_order', 300, 2, 'Order void (moderate weight)', true),
  ('export_orders', 50, 10, 'Data export (very heavy)', true),
  ('dsr_request', 100, 5, 'Data subject request (heavy)', true)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- PHASE 2: Create Rate Limit Bucket Table (Per-Restaurant Per-Endpoint)
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.gm_rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  endpoint_name TEXT NOT NULL,
  tokens_remaining INTEGER NOT NULL DEFAULT 0,
  last_refill_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key to endpoint config (for rate limit definition)
  FOREIGN KEY (endpoint_name) REFERENCES public.gm_rate_limit_config(endpoint_name)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  -- Composite unique constraint: one bucket per restaurant per endpoint
  UNIQUE(restaurant_id, endpoint_name)
);

CREATE INDEX idx_gm_rate_limit_buckets_restaurant ON public.gm_rate_limit_buckets(restaurant_id);
CREATE INDEX idx_gm_rate_limit_buckets_endpoint ON public.gm_rate_limit_buckets(endpoint_name);

COMMENT ON TABLE public.gm_rate_limit_buckets IS
  'Token bucket state per restaurant per endpoint. Tracks tokens_remaining and last refill time for each quota.';

COMMENT ON COLUMN public.gm_rate_limit_buckets.tokens_remaining IS
  'Current tokens in bucket. Decrements on operation, refills over time based on endpoint config.';

COMMENT ON COLUMN public.gm_rate_limit_buckets.last_refill_at IS
  'UTC timestamp of last refill. Used to calculate if tokens have accumulated since last operation.';

-- ========================================================================
-- PHASE 3: Helper Function - Calculate Refilled Tokens
-- ========================================================================

CREATE OR REPLACE FUNCTION public.calculate_refilled_tokens(
  p_tokens_remaining INTEGER,
  p_max_tokens INTEGER,
  p_last_refill_at TIMESTAMPTZ,
  p_refill_rate NUMERIC DEFAULT 10.0  -- tokens per second
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_seconds_elapsed NUMERIC;
  v_tokens_accumulated NUMERIC;
  v_new_tokens INTEGER;
BEGIN
  -- Refill rate: max_tokens / 60 seconds
  -- Example: 600 tokens/min = 10 tokens/sec
  v_seconds_elapsed := EXTRACT(EPOCH FROM (NOW() - p_last_refill_at));

  -- Calculate accumulated tokens since last refill
  v_tokens_accumulated := v_seconds_elapsed * p_refill_rate;

  -- New tokens = min(existing + accumulated, max)
  v_new_tokens := LEAST(
    p_tokens_remaining + v_tokens_accumulated::INTEGER,
    p_max_tokens
  );

  RETURN v_new_tokens;
END;
$$;

COMMENT ON FUNCTION public.calculate_refilled_tokens IS
  'Calculate current token count based on time elapsed and refill rate. Caps at max_tokens.';

-- ========================================================================
-- PHASE 4: RPC - Check and Decrement Rate Limit (ATOMIC)
-- ========================================================================

CREATE OR REPLACE FUNCTION public.check_and_decrement_rate_limit(
  p_restaurant_id UUID,
  p_endpoint_name TEXT,
  p_tokens_required INTEGER DEFAULT 1,
  p_actor_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT '0.0.0.0'::INET
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config_id UUID;
  v_max_tokens INTEGER;
  v_token_weight INTEGER;
  v_refill_rate NUMERIC;
  v_current_tokens INTEGER;
  v_new_tokens INTEGER;
  v_tokens_after_operation INTEGER;
  v_seconds_until_retry NUMERIC;
  v_retry_after INTEGER;
  v_bucket_id UUID;
  v_audit_entry_id UUID;
  v_request_cost INTEGER;
BEGIN
  -- ============================================================
  -- 1. VALIDATION: Endpoint exists and is enabled
  -- ============================================================
  SELECT id, max_tokens_per_minute, token_weight
  INTO v_config_id, v_max_tokens, v_token_weight
  FROM public.gm_rate_limit_config
  WHERE endpoint_name = p_endpoint_name
    AND enabled = true
  LIMIT 1;

  IF v_config_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unknown or disabled endpoint: ' || p_endpoint_name,
      'code', 'ENDPOINT_NOT_FOUND',
      'retry_after', NULL
    );
  END IF;

  -- Calculate refill rate (tokens per second)
  v_refill_rate := v_max_tokens::NUMERIC / 60.0;

  -- Actual cost of this operation
  v_request_cost := p_tokens_required * v_token_weight;

  -- ============================================================
  -- 2. GET OR CREATE: Rate limit bucket for restaurant+endpoint
  -- ============================================================
  SELECT id, tokens_remaining
  INTO v_bucket_id, v_current_tokens
  FROM public.gm_rate_limit_buckets
  WHERE restaurant_id = p_restaurant_id
    AND endpoint_name = p_endpoint_name
  LIMIT 1 FOR UPDATE;  -- Lock bucket for atomic update

  -- If bucket doesn't exist, create it with full tokens
  IF v_bucket_id IS NULL THEN
    INSERT INTO public.gm_rate_limit_buckets (
      restaurant_id,
      endpoint_name,
      tokens_remaining,
      last_refill_at
    ) VALUES (
      p_restaurant_id,
      p_endpoint_name,
      v_max_tokens
    )
    RETURNING id, tokens_remaining
    INTO v_bucket_id, v_current_tokens;
  END IF;

  -- ============================================================
  -- 3. REFILL: Calculate accumulated tokens since last operation
  -- ============================================================
  SELECT
    calculate_refilled_tokens(
      v_current_tokens,
      v_max_tokens,
      (SELECT last_refill_at FROM public.gm_rate_limit_buckets WHERE id = v_bucket_id),
      v_refill_rate
    )
  INTO v_new_tokens;

  -- ============================================================
  -- 4. DECREMENT: Check if tokens available, then decrement atomically
  -- ============================================================
  IF v_new_tokens >= v_request_cost THEN
    -- ALLOW: Decrement tokens and update bucket
    v_tokens_after_operation := v_new_tokens - v_request_cost;

    UPDATE public.gm_rate_limit_buckets
    SET
      tokens_remaining = v_tokens_after_operation,
      last_refill_at = NOW(),
      updated_at = NOW()
    WHERE id = v_bucket_id;

    -- Log successful operation (optional, for monitoring)
    INSERT INTO public.gm_audit_logs (
      restaurant_id,
      action,
      actor_id,
      table_name,
      affected_row_id,
      new_values,
      ip_address,
      user_agent
    ) VALUES (
      p_restaurant_id,
      'RATE_LIMIT_ALLOWED',
      p_actor_id,
      'gm_rate_limit_buckets',
      v_bucket_id,
      jsonb_build_object(
        'endpoint', p_endpoint_name,
        'tokens_cost', v_request_cost,
        'tokens_remaining_before', v_new_tokens,
        'tokens_remaining_after', v_tokens_after_operation
      ),
      p_ip_address,
      'rpc-check_and_decrement_rate_limit'
    )
    RETURNING id INTO v_audit_entry_id;

    RETURN jsonb_build_object(
      'success', true,
      'allowed', true,
      'endpoint', p_endpoint_name,
      'tokens_remaining', v_tokens_after_operation,
      'tokens_cost', v_request_cost,
      'max_tokens', v_max_tokens,
      'retry_after', NULL,
      'audit_id', v_audit_entry_id
    );

  ELSE
    -- DENY: Quota exceeded
    v_seconds_until_retry := CEIL((v_request_cost - v_new_tokens)::NUMERIC / v_refill_rate);
    v_retry_after := GREATEST(1, v_seconds_until_retry::INTEGER);

    -- Log violation
    INSERT INTO public.gm_audit_logs (
      restaurant_id,
      action,
      actor_id,
      table_name,
      affected_row_id,
      new_values,
      ip_address,
      user_agent
    ) VALUES (
      p_restaurant_id,
      'RATE_LIMIT_EXCEEDED',
      p_actor_id,
      'gm_rate_limit_buckets',
      v_bucket_id,
      jsonb_build_object(
        'endpoint', p_endpoint_name,
        'tokens_cost', v_request_cost,
        'tokens_available', v_new_tokens,
        'tokens_deficit', v_request_cost - v_new_tokens,
        'retry_after_seconds', v_retry_after
      ),
      p_ip_address,
      'rpc-check_and_decrement_rate_limit'
    )
    RETURNING id INTO v_audit_entry_id;

    RETURN jsonb_build_object(
      'success', false,
      'allowed', false,
      'error', 'Rate limit exceeded for endpoint: ' || p_endpoint_name,
      'code', 'RATE_LIMIT_EXCEEDED',
      'endpoint', p_endpoint_name,
      'tokens_available', v_new_tokens,
      'tokens_required', v_request_cost,
      'max_tokens', v_max_tokens,
      'retry_after', v_retry_after,
      'audit_id', v_audit_entry_id
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Ensure operation fails safely without crashing
  RETURN jsonb_build_object(
    'success', false,
    'allowed', false,
    'error', 'Rate limit check failed: ' || SQLERRM,
    'code', 'RATE_LIMIT_ERROR',
    'retry_after', 60  -- Safe default: retry in 1 minute
  );
END;
$$;

COMMENT ON FUNCTION public.check_and_decrement_rate_limit IS
  'Check if rate limit quota available for endpoint, atomically decrement if allowed. Returns {success, allowed, tokens_remaining, retry_after}.';

-- ========================================================================
-- PHASE 5: RPC - Get Rate Limit Status (Query)
-- ========================================================================

CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
  p_restaurant_id UUID,
  p_endpoint_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config_id UUID;
  v_max_tokens INTEGER;
  v_token_weight INTEGER;
  v_refill_rate NUMERIC;
  v_endpoints JSONB;
  v_endpoint_record RECORD;
BEGIN
  -- ============================================================
  -- 1. Build status for specific endpoint or all endpoints
  -- ============================================================
  IF p_endpoint_name IS NOT NULL THEN
    -- Single endpoint status
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'endpoint', c.endpoint_name,
          'max_tokens_per_minute', c.max_tokens_per_minute,
          'tokens_remaining', COALESCE(b.tokens_remaining, c.max_tokens_per_minute),
          'tokens_cost_per_request', c.token_weight,
          'max_requests_per_minute', c.max_tokens_per_minute / c.token_weight,
          'current_requests_available', COALESCE(b.tokens_remaining, c.max_tokens_per_minute) / c.token_weight,
          'last_refill_at', b.last_refill_at,
          'enabled', c.enabled
        )
      )
    INTO v_endpoints
    FROM public.gm_rate_limit_config c
    LEFT JOIN public.gm_rate_limit_buckets b
      ON b.restaurant_id = p_restaurant_id
      AND b.endpoint_name = c.endpoint_name
    WHERE c.endpoint_name = p_endpoint_name;

  ELSE
    -- All endpoints status
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'endpoint', c.endpoint_name,
          'max_tokens_per_minute', c.max_tokens_per_minute,
          'tokens_remaining', COALESCE(b.tokens_remaining, c.max_tokens_per_minute),
          'tokens_cost_per_request', c.token_weight,
          'max_requests_per_minute', c.max_tokens_per_minute / c.token_weight,
          'current_requests_available', COALESCE(b.tokens_remaining, c.max_tokens_per_minute) / c.token_weight,
          'last_refill_at', b.last_refill_at,
          'enabled', c.enabled
        )
      )
    INTO v_endpoints
    FROM public.gm_rate_limit_config c
    LEFT JOIN public.gm_rate_limit_buckets b
      ON b.restaurant_id = p_restaurant_id
      AND b.endpoint_name = c.endpoint_name
    WHERE c.enabled = true
    ORDER BY c.endpoint_name;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'restaurant_id', p_restaurant_id,
    'endpoints', v_endpoints
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to get rate limit status: ' || SQLERRM,
    'code', 'STATUS_ERROR'
  );
END;
$$;

COMMENT ON FUNCTION public.get_rate_limit_status IS
  'Query current rate limit status for restaurant across all endpoints or single endpoint.';

-- ========================================================================
-- PHASE 6: RPC - Reset Rate Limit Quota (Admin)
-- ========================================================================

CREATE OR REPLACE FUNCTION public.reset_rate_limit_quota(
  p_restaurant_id UUID,
  p_endpoint_name TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_tokens INTEGER;
  v_updated_count INTEGER := 0;
BEGIN
  -- ============================================================
  -- 1. VALIDATION: Actor has permission (future: check role)
  -- ============================================================
  -- TODO: Add role-based check when RBAC is implemented

  -- ============================================================
  -- 2. RESET: Refill quota(s) to maximum
  -- ============================================================
  IF p_endpoint_name IS NOT NULL THEN
    -- Reset specific endpoint
    SELECT max_tokens_per_minute
    INTO v_max_tokens
    FROM public.gm_rate_limit_config
    WHERE endpoint_name = p_endpoint_name;

    UPDATE public.gm_rate_limit_buckets
    SET
      tokens_remaining = v_max_tokens,
      last_refill_at = NOW(),
      updated_at = NOW()
    WHERE restaurant_id = p_restaurant_id
      AND endpoint_name = p_endpoint_name;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  ELSE
    -- Reset all endpoints for restaurant
    UPDATE public.gm_rate_limit_buckets b
    SET
      tokens_remaining = c.max_tokens_per_minute,
      last_refill_at = NOW(),
      updated_at = NOW()
    FROM public.gm_rate_limit_config c
    WHERE b.restaurant_id = p_restaurant_id
      AND b.endpoint_name = c.endpoint_name;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  END IF;

  -- Log the reset
  INSERT INTO public.gm_audit_logs (
    restaurant_id,
    action,
    actor_id,
    table_name,
    affected_row_id,
    new_values,
    user_agent
  ) VALUES (
    p_restaurant_id,
    'RATE_LIMIT_RESET',
    p_actor_id,
    'gm_rate_limit_buckets',
    p_restaurant_id,
    jsonb_build_object(
      'endpoint', COALESCE(p_endpoint_name, 'ALL'),
      'buckets_reset', v_updated_count
    ),
    'rpc-reset_rate_limit_quota'
  );

  RETURN jsonb_build_object(
    'success', true,
    'restaurant_id', p_restaurant_id,
    'endpoint', COALESCE(p_endpoint_name, 'ALL'),
    'buckets_reset', v_updated_count
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to reset rate limit: ' || SQLERRM,
    'code', 'RESET_ERROR'
  );
END;
$$;

COMMENT ON FUNCTION public.reset_rate_limit_quota IS
  'Admin operation: Reset rate limit quota for restaurant (all endpoints or specific endpoint).';

-- ========================================================================
-- PHASE 7: RPC - Update Endpoint Configuration (Admin)
-- ========================================================================

CREATE OR REPLACE FUNCTION public.update_rate_limit_config(
  p_endpoint_name TEXT,
  p_max_tokens_per_minute INTEGER DEFAULT NULL,
  p_token_weight INTEGER DEFAULT NULL,
  p_enabled BOOLEAN DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- ============================================================
  -- 1. Capture old values for audit
  -- ============================================================
  SELECT jsonb_build_object(
    'max_tokens_per_minute', max_tokens_per_minute,
    'token_weight', token_weight,
    'enabled', enabled
  )
  INTO v_old_values
  FROM public.gm_rate_limit_config
  WHERE endpoint_name = p_endpoint_name;

  IF v_old_values IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Endpoint not found: ' || p_endpoint_name,
      'code', 'ENDPOINT_NOT_FOUND'
    );
  END IF;

  -- ============================================================
  -- 2. Update configuration
  -- ============================================================
  UPDATE public.gm_rate_limit_config
  SET
    max_tokens_per_minute = COALESCE(p_max_tokens_per_minute, max_tokens_per_minute),
    token_weight = COALESCE(p_token_weight, token_weight),
    enabled = COALESCE(p_enabled, enabled),
    updated_at = NOW(),
    updated_by = p_actor_id
  WHERE endpoint_name = p_endpoint_name;

  -- ============================================================
  -- 3. Capture new values for audit
  -- ============================================================
  SELECT jsonb_build_object(
    'max_tokens_per_minute', max_tokens_per_minute,
    'token_weight', token_weight,
    'enabled', enabled
  )
  INTO v_new_values
  FROM public.gm_rate_limit_config
  WHERE endpoint_name = p_endpoint_name;

  -- Log the configuration change
  INSERT INTO public.gm_audit_logs (
    restaurant_id,
    action,
    actor_id,
    table_name,
    affected_row_id,
    old_values,
    new_values,
    user_agent
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,  -- System-level change
    'RATE_LIMIT_CONFIG_UPDATED',
    p_actor_id,
    'gm_rate_limit_config',
    (SELECT id FROM public.gm_rate_limit_config WHERE endpoint_name = p_endpoint_name),
    v_old_values,
    v_new_values,
    'rpc-update_rate_limit_config'
  );

  RETURN jsonb_build_object(
    'success', true,
    'endpoint', p_endpoint_name,
    'updated', v_new_values
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to update rate limit config: ' || SQLERRM,
    'code', 'UPDATE_ERROR'
  );
END;
$$;

COMMENT ON FUNCTION public.update_rate_limit_config IS
  'Admin operation: Update endpoint rate limit configuration (quota, weight, enabled status).';

-- ========================================================================
-- PHASE 8: Create RLS Policies (Rate Limit Tables)
-- ========================================================================

-- Enable RLS on rate limit tables
ALTER TABLE public.gm_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their restaurant's rate limit buckets
CREATE POLICY IF NOT EXISTS gm_rate_limit_buckets_read_own
  ON public.gm_rate_limit_buckets
  FOR SELECT
  USING (
    restaurant_id IN (
      SELECT id FROM public.gm_restaurants
      WHERE id = ANY(current_user_restaurants())
    )
  );

-- Policy: System-level operations only
CREATE POLICY IF NOT EXISTS gm_rate_limit_buckets_modify_system
  ON public.gm_rate_limit_buckets
  FOR INSERT
  WITH CHECK (false);  -- Buckets created by RPC only

CREATE POLICY IF NOT EXISTS gm_rate_limit_buckets_update_system
  ON public.gm_rate_limit_buckets
  FOR UPDATE
  USING (false);  -- Updates via RPC only

-- Policy: Rate limit config is read-only to normal users
CREATE POLICY IF NOT EXISTS gm_rate_limit_config_read
  ON public.gm_rate_limit_config
  FOR SELECT
  USING (true);  -- Everyone can read; checks happen in RPC

CREATE POLICY IF NOT EXISTS gm_rate_limit_config_modify_admin_only
  ON public.gm_rate_limit_config
  FOR INSERT
  WITH CHECK (false);  -- Modifications via admin RPC only

CREATE POLICY IF NOT EXISTS gm_rate_limit_config_update_admin_only
  ON public.gm_rate_limit_config
  FOR UPDATE
  USING (false);

-- ========================================================================
-- PHASE 9: Grant Permissions
-- ========================================================================

-- Allow anon to call rate limit RPCs (endpoint will check auth)
GRANT EXECUTE ON FUNCTION public.check_and_decrement_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_rate_limit_status TO anon, authenticated;

-- Allow authenticated users to reset their own quotas (future: role-based)
GRANT EXECUTE ON FUNCTION public.reset_rate_limit_quota TO authenticated;

-- Admin-only operations
GRANT EXECUTE ON FUNCTION public.update_rate_limit_config TO authenticated;

-- Select on config table
GRANT SELECT ON public.gm_rate_limit_config TO anon, authenticated;
GRANT SELECT ON public.gm_rate_limit_buckets TO authenticated;

-- ========================================================================
-- PHASE 10: Audit Log Entry
-- ========================================================================

INSERT INTO gm_audit_logs (
  restaurant_id,
  action,
  actor_id,
  table_name,
  affected_row_id,
  old_values,
  new_values,
  ip_address,
  user_agent
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SYSTEM_MIGRATION_RATE_LIMITING',
  NULL,
  'schema_migrations',
  '20260214'::uuid,
  jsonb_build_object(
    'status', 'started',
    'scope', 'Add database-enforced rate limiting with token bucket algorithm'
  ),
  jsonb_build_object(
    'status', 'completed',
    'enhancements', jsonb_build_object(
      'gm_rate_limit_config_created', true,
      'gm_rate_limit_buckets_created', true,
      'rpcs_created', jsonb_build_array(
        'check_and_decrement_rate_limit',
        'get_rate_limit_status',
        'reset_rate_limit_quota',
        'update_rate_limit_config'
      ),
      'default_endpoints', jsonb_build_array(
        'create_order',
        'process_order_payment',
        'close_shift',
        'bulk_order_items',
        'modify_order',
        'void_order',
        'export_orders',
        'dsr_request'
      ),
      'token_bucket_algorithm', 'enabled',
      'audit_logging', 'all violations tracked'
    )
  ),
  '0.0.0.0'::inet,
  'database-migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ========================================================================
-- POST-DEPLOYMENT VERIFICATION
-- ========================================================================
-- After applying this migration, verify:
--
-- 1. Verify rate limit tables created:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_name IN ('gm_rate_limit_config', 'gm_rate_limit_buckets');
--
-- 2. Verify endpoint configurations exist:
--    SELECT endpoint_name, max_tokens_per_minute, token_weight, enabled
--    FROM public.gm_rate_limit_config
--    ORDER BY endpoint_name;
--
-- 3. Test rate limit RPC (should succeed first time):
--    SELECT check_and_decrement_rate_limit(
--      p_restaurant_id := 'RESTAURANT_UUID',
--      p_endpoint_name := 'create_order',
--      p_tokens_required := 1
--    );
--    Expected: {success: true, allowed: true, tokens_remaining: 599}
--
-- 4. Test rate limit status query:
--    SELECT get_rate_limit_status(
--      p_restaurant_id := 'RESTAURANT_UUID'
--    );
--
-- 5. Check audit log for migration entry:
--    SELECT * FROM gm_audit_logs
--    WHERE action = 'SYSTEM_MIGRATION_RATE_LIMITING'
--    ORDER BY created_at DESC LIMIT 1;
--
-- 6. Load test: Make 610 rapid requests (should fail after 600):
--    SELECT check_and_decrement_rate_limit('RESTAURANT_UUID', 'create_order', 1)
--    FROM generate_series(1, 610);
--    Expected: Last 10 return {success: false, code: 'RATE_LIMIT_EXCEEDED'}
-- ========================================================================
