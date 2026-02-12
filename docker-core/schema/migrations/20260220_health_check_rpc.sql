-- Migration: 20260220_health_check_rpc.sql
-- Purpose: PostgreSQL-level health check RPC for deployment verification
-- Returns JSON with status of critical tables, RLS, and RPCs
-- Callable via PostgREST: POST /rest/v1/rpc/health_check
-- No auth required (uses service_role internally) — returns only status, no data

BEGIN;

CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB := '{}'::jsonb;
  tbl_count INT;
  rpc_ok BOOLEAN;
  rls_ok BOOLEAN;
  ts_now TIMESTAMPTZ := NOW();
BEGIN
  -- =========================================================================
  -- 1. Core Tables Exist
  -- =========================================================================
  SELECT COUNT(*) INTO tbl_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'gm_restaurants',
      'gm_orders',
      'gm_order_items',
      'gm_products',
      'gm_tables',
      'gm_cash_registers',
      'gm_payments',
      'restaurant_users'
    );

  result := result || jsonb_build_object(
    'tables', jsonb_build_object(
      'status', CASE WHEN tbl_count >= 8 THEN 'ok' ELSE 'missing' END,
      'found', tbl_count,
      'expected', 8
    )
  );

  -- =========================================================================
  -- 2. Critical RPCs Exist
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'create_order_atomic'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO rpc_ok;

  result := result || jsonb_build_object(
    'rpc_create_order', CASE WHEN rpc_ok THEN 'ok' ELSE 'missing' END
  );

  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'process_order_payment'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO rpc_ok;

  result := result || jsonb_build_object(
    'rpc_process_payment', CASE WHEN rpc_ok THEN 'ok' ELSE 'missing' END
  );

  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'open_cash_register_atomic'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO rpc_ok;

  result := result || jsonb_build_object(
    'rpc_open_register', CASE WHEN rpc_ok THEN 'ok' ELSE 'missing' END
  );

  -- =========================================================================
  -- 3. RLS Enabled on Financial Tables
  -- =========================================================================
  SELECT NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('gm_orders', 'gm_payments', 'gm_cash_registers')
      AND NOT c.relrowsecurity
  ) INTO rls_ok;

  result := result || jsonb_build_object(
    'rls_financial', CASE WHEN rls_ok THEN 'ok' ELSE 'disabled' END
  );

  -- =========================================================================
  -- 4. has_restaurant_access helper exists
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'has_restaurant_access'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO rpc_ok;

  result := result || jsonb_build_object(
    'rls_helper', CASE WHEN rpc_ok THEN 'ok' ELSE 'missing' END
  );

  -- =========================================================================
  -- 5. State Machine Trigger Exists
  -- =========================================================================
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name = 'trg_validate_order_status'
      AND event_object_table = 'gm_orders'
  ) INTO rpc_ok;

  result := result || jsonb_build_object(
    'state_machine_trigger', CASE WHEN rpc_ok THEN 'ok' ELSE 'missing' END
  );

  -- =========================================================================
  -- Final Assembly
  -- =========================================================================
  RETURN jsonb_build_object(
    'status', CASE
      WHEN result->>'tables' IS NOT NULL
        AND (result->'tables'->>'status') = 'ok'
        AND (result->>'rpc_create_order') = 'ok'
        AND (result->>'rpc_process_payment') = 'ok'
        AND (result->>'rls_financial') = 'ok'
      THEN 'healthy'
      ELSE 'degraded'
    END,
    'timestamp', ts_now,
    'version', '1.0.0',
    'checks', result
  );
END;
$$;

-- Allow anon to call health_check (no data exposed, only status)
GRANT EXECUTE ON FUNCTION public.health_check() TO anon;
GRANT EXECUTE ON FUNCTION public.health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION public.health_check() TO service_role;

COMMENT ON FUNCTION public.health_check() IS
  'Deployment health check — validates tables, RPCs, RLS, and triggers exist. '
  'Returns JSONB with status: healthy|degraded. No data is exposed.';

COMMIT;
