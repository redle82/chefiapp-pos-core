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
GRANT ALL ON public.app_logs TO service_role;