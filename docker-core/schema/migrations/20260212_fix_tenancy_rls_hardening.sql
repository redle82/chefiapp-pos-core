-- Migration: 20260212_fix_tenancy_rls_hardening.sql
-- Purpose: Fix critical tenant isolation vulnerabilities across Core schema
-- Scope: 4 permissive RLS bypasses + 11 completely unprotected tables
-- Risk: Cross-tenant data exposure if not applied immediately
--
-- Changes:
-- 1. Replace permissive (true/true) RLS policies with deny-by-default + tenant checks
-- 2. Enable RLS on 11 tables lacking any enforcement
-- 3. Add restaurant_id to task_history for audit trail integrity
-- 4. Create helper function for tenant-scoped policy evaluation
-- 5. Add comprehensive RLS policies to all multi-tenant tables

BEGIN;

-- ========================================================================
-- PHASE 1: Helper Functions
-- ========================================================================

-- Get list of restaurants the current user has access to
-- SECURITY DEFINER ensures audit_logs, etc. can call this without exposing auth
CREATE OR REPLACE FUNCTION public.current_user_restaurants()
RETURNS TABLE (restaurant_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- For authenticated users: via restaurant_users role mapping
  SELECT DISTINCT ru.restaurant_id
  FROM restaurant_users ru
  WHERE ru.user_id = auth.uid()
    AND ru.deleted_at IS NULL

  UNION ALL

  -- For service-level access (PostgREST client with JWT):
  -- Extract claimed restaurant_id from JWT claims if present
  SELECT (auth.jwt() ->> 'restaurant_id')::uuid
  WHERE (auth.jwt() ->> 'restaurant_id') IS NOT NULL;
$$;

-- Alternative: strict default for any missing tenant context
-- Prevents data leaks by denying access if tenant cannot be determined
CREATE OR REPLACE FUNCTION public.has_restaurant_access(p_restaurant_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.current_user_restaurants() AS ur
    WHERE ur.restaurant_id = p_restaurant_id
  );
$$;

-- ========================================================================
-- PHASE 2: Fix Permissive RLS Bypasses (4 tables)
-- ========================================================================

-- TABLE: gm_reservations
-- Current: USING (true) WITH CHECK (true) — allows all access
-- Fix: Deny-by-default + require tenant match
ALTER TABLE public.gm_reservations ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policy
DROP POLICY IF EXISTS "reservations_all" ON public.gm_reservations;

-- Create new deny-by-default policies
CREATE POLICY "reservations_select"
  ON public.gm_reservations
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "reservations_insert"
  ON public.gm_reservations
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "reservations_update"
  ON public.gm_reservations
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "reservations_delete"
  ON public.gm_reservations
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: gm_no_show_history
-- Current: USING (true) WITH CHECK (true)
-- Fix: Deny-by-default + require tenant match
ALTER TABLE public.gm_no_show_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no_show_history_all" ON public.gm_no_show_history;

CREATE POLICY "no_show_history_select"
  ON public.gm_no_show_history
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "no_show_history_insert"
  ON public.gm_no_show_history
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "no_show_history_update"
  ON public.gm_no_show_history
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "no_show_history_delete"
  ON public.gm_no_show_history
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: gm_overbooking_config
-- Current: USING (true) WITH CHECK (true)
-- Fix: Deny-by-default + require tenant match
ALTER TABLE public.gm_overbooking_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "overbooking_config_all" ON public.gm_overbooking_config;

CREATE POLICY "overbooking_config_select"
  ON public.gm_overbooking_config
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "overbooking_config_insert"
  ON public.gm_overbooking_config
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "overbooking_config_update"
  ON public.gm_overbooking_config
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "overbooking_config_delete"
  ON public.gm_overbooking_config
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: shift_logs (if exists in schema)
-- Current: USING (true) WITH CHECK (true)
-- Fix: Deny-by-default + require tenant match
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shift_logs') THEN
    ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "shift_logs_all" ON public.shift_logs;

    CREATE POLICY "shift_logs_select"
      ON public.shift_logs
      FOR SELECT
      USING (public.has_restaurant_access(restaurant_id));

    CREATE POLICY "shift_logs_insert"
      ON public.shift_logs
      FOR INSERT
      WITH CHECK (public.has_restaurant_access(restaurant_id));

    CREATE POLICY "shift_logs_update"
      ON public.shift_logs
      FOR UPDATE
      USING (public.has_restaurant_access(restaurant_id))
      WITH CHECK (public.has_restaurant_access(restaurant_id));

    CREATE POLICY "shift_logs_delete"
      ON public.shift_logs
      FOR DELETE
      USING (public.has_restaurant_access(restaurant_id));
  END IF;
END $$;

-- ========================================================================
-- PHASE 3: Add RLS to Completely Unprotected Tables
-- ========================================================================

-- TABLE: gm_cash_registers
ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_registers_select"
  ON public.gm_cash_registers
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "cash_registers_insert"
  ON public.gm_cash_registers
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "cash_registers_update"
  ON public.gm_cash_registers
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "cash_registers_delete"
  ON public.gm_cash_registers
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: gm_payments
ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select"
  ON public.gm_payments
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "payments_insert"
  ON public.gm_payments
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "payments_update"
  ON public.gm_payments
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "payments_delete"
  ON public.gm_payments
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: gm_payment_audit_logs (immutable, but needs RLS)
ALTER TABLE public.gm_payment_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_audit_logs_select"
  ON public.gm_payment_audit_logs
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "payment_audit_logs_insert"
  ON public.gm_payment_audit_logs
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

-- TABLE: gm_tasks
ALTER TABLE public.gm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select"
  ON public.gm_tasks
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "tasks_insert"
  ON public.gm_tasks
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "tasks_update"
  ON public.gm_tasks
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "tasks_delete"
  ON public.gm_tasks
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: recurring_tasks
ALTER TABLE public.recurring_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_tasks_select"
  ON public.recurring_tasks
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "recurring_tasks_insert"
  ON public.recurring_tasks
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "recurring_tasks_update"
  ON public.recurring_tasks
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "recurring_tasks_delete"
  ON public.recurring_tasks
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: tasks (different from gm_tasks, from task_system.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "tasks_core_select"
      ON public.tasks
      FOR SELECT
      USING (public.has_restaurant_access(restaurant_id));

    CREATE POLICY "tasks_core_insert"
      ON public.tasks
      FOR INSERT
      WITH CHECK (public.has_restaurant_access(restaurant_id));

    CREATE POLICY "tasks_core_update"
      ON public.tasks
      FOR UPDATE
      USING (public.has_restaurant_access(restaurant_id))
      WITH CHECK (public.has_restaurant_access(restaurant_id));

    CREATE POLICY "tasks_core_delete"
      ON public.tasks
      FOR DELETE
      USING (public.has_restaurant_access(restaurant_id));
  END IF;
END $$;

-- TABLE: task_rules
ALTER TABLE public.task_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_rules_select"
  ON public.task_rules
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "task_rules_insert"
  ON public.task_rules
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "task_rules_update"
  ON public.task_rules
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "task_rules_delete"
  ON public.task_rules
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: restaurant_schedules
ALTER TABLE public.restaurant_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_schedules_select"
  ON public.restaurant_schedules
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_schedules_insert"
  ON public.restaurant_schedules
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_schedules_update"
  ON public.restaurant_schedules
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_schedules_delete"
  ON public.restaurant_schedules
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: restaurant_setup_status
ALTER TABLE public.restaurant_setup_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_setup_status_select"
  ON public.restaurant_setup_status
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_setup_status_insert"
  ON public.restaurant_setup_status
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_setup_status_update"
  ON public.restaurant_setup_status
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_setup_status_delete"
  ON public.restaurant_setup_status
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: restaurant_zones
ALTER TABLE public.restaurant_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_zones_select"
  ON public.restaurant_zones
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_zones_insert"
  ON public.restaurant_zones
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_zones_update"
  ON public.restaurant_zones
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "restaurant_zones_delete"
  ON public.restaurant_zones
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- TABLE: billing_configs (RLS was disabled, re-enable)
ALTER TABLE public.billing_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_configs_all" ON public.billing_configs;

CREATE POLICY "billing_configs_select"
  ON public.billing_configs
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "billing_configs_insert"
  ON public.billing_configs
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "billing_configs_update"
  ON public.billing_configs
  FOR UPDATE
  USING (public.has_restaurant_access(restaurant_id))
  WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "billing_configs_delete"
  ON public.billing_configs
  FOR DELETE
  USING (public.has_restaurant_access(restaurant_id));

-- ========================================================================
-- PHASE 4: Fix Structural Defect - task_history Missing restaurant_id
-- ========================================================================

-- Add restaurant_id column to task_history
ALTER TABLE public.task_history
ADD COLUMN IF NOT EXISTS restaurant_id UUID NOT NULL DEFAULT (SELECT id FROM gm_restaurants LIMIT 1),
ADD CONSTRAINT fk_task_history_restaurant FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;

-- Create index for tenant isolation queries
CREATE INDEX IF NOT EXISTS idx_task_history_restaurant_created
  ON public.task_history(restaurant_id, created_at DESC);

-- Enable RLS on task_history with proper tenant enforcement
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_history_all" ON public.task_history;

CREATE POLICY "task_history_select"
  ON public.task_history
  FOR SELECT
  USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "task_history_insert"
  ON public.task_history
  FOR INSERT
  WITH CHECK (public.has_restaurant_access(restaurant_id));

-- task_history should be immutable, but RLS needed for reads
-- Deletion should only be via admin/archive function

-- ========================================================================
-- PHASE 5: Enhance Performance - Add Tenant Indexes
-- ========================================================================

-- Speed up RLS policy evaluation by indexing restaurant_id
CREATE INDEX IF NOT EXISTS idx_gm_payments_restaurant_created
  ON public.gm_payments(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gm_cash_registers_restaurant
  ON public.gm_cash_registers(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_tasks_restaurant_created
  ON public.gm_tasks(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gm_tasks_assigned_to_restaurant
  ON public.gm_tasks(assigned_to, restaurant_id);

CREATE INDEX IF NOT EXISTS idx_recurring_tasks_restaurant
  ON public.recurring_tasks(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_task_rules_restaurant
  ON public.task_rules(restaurant_id);

-- ========================================================================
-- PHASE 6: Documentation & Audit
-- ========================================================================

-- Record this migration in audit log (for operators to see what changed)
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
  '00000000-0000-0000-0000-000000000000'::uuid, -- System ID
  'SYSTEM_MIGRATION_RLS_HARDENING',
  NULL,
  'schema_migrations',
  '20260212'::uuid,
  jsonb_build_object(
    'status', 'started',
    'scope', 'Fix 16 tables with tenant isolation vulnerabilities'
  ),
  jsonb_build_object(
    'status', 'completed',
    'fixes_applied', jsonb_build_object(
      'permissive_rls_replaced', 4,
      'unprotected_rls_enabled', 11,
      'helper_functions_created', 2,
      'task_history_restaurant_id_added', true,
      'tenant_indexes_optimized', 8
    )
  ),
  '0.0.0.0'::inet,
  'database-migration'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ========================================================================
-- VERIFICATION CHECKLIST
-- ========================================================================
-- After applying this migration, verify:
--
-- 1. Verify all 16 tables have RLS enabled:
--    SELECT tablename FROM pg_tables
--    WHERE schemaname = 'public'
--    AND tablename IN ('gm_reservations', 'gm_no_show_history', ...);
--
-- 2. Verify no permissive (true/true) policies remain:
--    SELECT schemaname, tablename, policyname, qual, with_check
--    FROM pg_policies
--    WHERE qual = 'true' OR with_check = 'true';
--
-- 3. Verify task_history has restaurant_id:
--    SELECT column_name, is_nullable, data_type
--    FROM information_schema.columns
--    WHERE table_name = 'task_history' AND column_name = 'restaurant_id';
--
-- 4. Run tenant_isolation.test.ts to validate cross-tenant leak prevention
--
-- For rollback in case of emergency:
-- SELECT * FROM schema_migrations WHERE name = '20260212_fix_tenancy_rls_hardening';
-- -- Manual rollback: drop policies, re-create with permissive = uncomment first half of file
