-- 20260320_server_audit_logs.sql
-- Server-side RBAC audit log hardening
-- Ensures gm_audit_logs supports server-side API writes via service_role
-- and adds partitions for upcoming months.

-- =============================================================================
-- 1. New partitions for April-June 2026
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gm_audit_logs_2026_04 PARTITION OF public.gm_audit_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS public.gm_audit_logs_2026_05 PARTITION OF public.gm_audit_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS public.gm_audit_logs_2026_06 PARTITION OF public.gm_audit_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- =============================================================================
-- 2. RLS policy: allow service_role to INSERT
--    The existing 20260211 migration denies all INSERTs via policy.
--    service_role bypasses RLS in Supabase, but we add an explicit
--    policy for clarity and in case RLS behavior changes.
-- =============================================================================
DO $$
BEGIN
    -- Drop the blanket deny-insert policy if it exists, replace with
    -- a policy that only allows service_role (API server) inserts.
    DROP POLICY IF EXISTS "audit_logs_insert_deny" ON public.gm_audit_logs;

    -- Deny INSERT for normal authenticated users
    CREATE POLICY "audit_logs_insert_authenticated_deny"
        ON public.gm_audit_logs
        FOR INSERT
        TO authenticated
        WITH CHECK (false);

    -- Allow INSERT for service_role (used by Vercel API routes)
    -- Note: In Supabase, service_role bypasses RLS entirely,
    -- but this policy documents the intent explicitly.
    CREATE POLICY "audit_logs_insert_service_role"
        ON public.gm_audit_logs
        FOR INSERT
        TO service_role
        WITH CHECK (true);

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS policies on gm_audit_logs skipped: %', SQLERRM;
END
$$;

-- =============================================================================
-- 3. Tighten SELECT policy for authenticated users (tenant isolation)
-- =============================================================================
DO $$
BEGIN
    DROP POLICY IF EXISTS "audit_logs_tenant_read" ON public.gm_audit_logs;

    CREATE POLICY "audit_logs_tenant_read"
        ON public.gm_audit_logs
        FOR SELECT
        TO authenticated
        USING (
            restaurant_id IN (
                SELECT restaurant_id FROM public.gm_restaurant_members
                WHERE user_id = auth.uid()
            )
        );

    -- service_role can read everything
    CREATE POLICY "audit_logs_service_role_read"
        ON public.gm_audit_logs
        FOR SELECT
        TO service_role
        USING (true);

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Tenant-read policy on gm_audit_logs skipped: %', SQLERRM;
END
$$;

-- =============================================================================
-- 4. Index on actor_role in metadata for RBAC queries
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_metadata_actor_role
    ON public.gm_audit_logs USING gin (metadata jsonb_path_ops);
