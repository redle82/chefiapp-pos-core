-- 20260113000001_create_app_logs.sql
-- 🛡️ SOVEREIGN LOGGING (Opus 6.0)
-- Centralized logging for critical errors and performance telemetry.
CREATE TABLE IF NOT EXISTS public.app_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level TEXT NOT NULL CHECK (
        level IN ('debug', 'info', 'warn', 'error', 'critical')
    ),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    restaurant_id UUID,
    -- Nullable because some errors happen before tenant context
    url TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for observability
CREATE INDEX IF NOT EXISTS idx_app_logs_level_created ON public.app_logs(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_restaurant_created ON public.app_logs(restaurant_id, created_at DESC);
-- 🛡️ RLS
ALTER TABLE public.app_logs ENABLE ROW LEVEL SECURITY;
-- 1. INSERT: Authenticated users (and anon for critical start-up errors if needed, but let's restrict to auth/service for now)
-- Actually, client-side logging needs to be open to authenticated users (staff).
CREATE POLICY "Enable insert for authenticated users" ON public.app_logs FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- 2. SELECT: Only Admins or Support (Service Role) usually, but maybe Tenant Owners?
-- For now, restrict to Service Role to avoid leaking sensitive error details to random staff.
-- If we want a debug dashboard later, we can open it.
-- But wait, PerformanceMonitor uses this. Staff might need to push.
-- Policy above handles INSERT. SELECT is implicitly denied unless added.
-- Let's allow Service Role full access.
GRANT ALL ON public.app_logs TO service_role;;
-- Create enum for feedback types
CREATE TYPE feedback_type AS ENUM ('bug', 'feature', 'other');
-- Create enum for feedback severity
CREATE TYPE feedback_severity AS ENUM ('low', 'medium', 'high', 'critical');
-- Create enum for feedback status
CREATE TYPE feedback_status AS ENUM ('open', 'investigating', 'resolved', 'ignored');
-- Create table beta_feedback
CREATE TABLE IF NOT EXISTS public.beta_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.gm_restaurants(id),
    user_id UUID REFERENCES auth.users(id),
    type feedback_type NOT NULL,
    severity feedback_severity DEFAULT 'low',
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status feedback_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON public.beta_feedback FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Policy: Users can view their own feedback (optional, but good for history)
CREATE POLICY "Users can view their own feedback" ON public.beta_feedback FOR
SELECT TO authenticated USING (auth.uid() = user_id);
-- Policy: Service role has full access
CREATE POLICY "Service role has full access" ON public.beta_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Grant permissions
GRANT ALL ON public.beta_feedback TO service_role;
GRANT SELECT,
    INSERT ON public.beta_feedback TO authenticated;;
-- ============================================================================
-- P0.1 FIX: TERMINAL STATE MUTATION BLOCK
-- Risk: R-032 (☠️ Unacceptable)
-- 
-- This trigger prevents ANY mutation on orders that have reached terminal state.
-- Terminal states: 'delivered', 'canceled'
-- 
-- Why this is critical:
-- - Financial audit requires immutable records
-- - No bug, retry, webhook, or race condition can revert a closed order
-- - This is the "judge" layer - Domain can't override
-- ============================================================================

-- Function that blocks mutations on terminal orders
CREATE OR REPLACE FUNCTION gm_block_terminal_order_mutation()
RETURNS trigger AS $$
BEGIN
  -- Log the attempt for audit
  RAISE WARNING '[SECURITY] Attempted mutation on terminal order (status: %, order_id: %, attempted_status: %)',
    OLD.status, OLD.id, NEW.status;
  
  -- Block the mutation
  RAISE EXCEPTION 'TERMINAL_STATE_IMMUTABLE: Cannot mutate order in terminal state (status: %, order_id: %)',
    OLD.status, OLD.id;
  
  -- This line is never reached, but required for type safety
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists (idempotent)
DROP TRIGGER IF EXISTS prevent_terminal_order_mutation_trigger ON gm_orders;

-- Create trigger that fires BEFORE any UPDATE on terminal orders
CREATE TRIGGER prevent_terminal_order_mutation_trigger
BEFORE UPDATE ON gm_orders
FOR EACH ROW
WHEN (OLD.status IN ('delivered', 'canceled'))
EXECUTE FUNCTION gm_block_terminal_order_mutation();

-- ============================================================================
-- VERIFICATION: List trigger to confirm it exists
-- ============================================================================
DO $$
DECLARE
  trigger_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'prevent_terminal_order_mutation_trigger'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✓ Trigger prevent_terminal_order_mutation_trigger created successfully';
  ELSE
    RAISE EXCEPTION '✗ Failed to create trigger prevent_terminal_order_mutation_trigger';
  END IF;
END $$;

-- ============================================================================
-- COMMENT: Document the invariant
-- ============================================================================
COMMENT ON TRIGGER prevent_terminal_order_mutation_trigger ON gm_orders IS 
  'P0 Security: Blocks ANY mutation on orders with status IN (delivered, canceled). This enforces financial immutability at the database level. Risk: R-032 | Status: ENFORCED | Date: 2026-01-14';
;
