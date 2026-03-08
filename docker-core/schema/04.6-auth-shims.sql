-- =============================================================================
-- CHEFIAPP CORE - Auth shims for Docker Core mode
-- =============================================================================
-- In Docker Core, there is no Supabase auth.uid() or JWT-based
-- has_restaurant_access(). These stubs allow fiscal/security migrations
-- to load without errors. The postgres superuser bypasses RLS anyway.
-- When migrating to Supabase/Keycloak, replace these with real implementations.
-- =============================================================================

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- auth.uid() — returns NULL in Docker Core (no JWT context)
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULL::UUID;
$$;

COMMENT ON FUNCTION auth.uid() IS 'Docker Core shim: returns NULL. Replace with real JWT extraction in Supabase/Keycloak mode.';

-- auth.jwt() — returns empty JSON in Docker Core
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT '{}'::JSONB;
$$;

COMMENT ON FUNCTION auth.jwt() IS 'Docker Core shim: returns {}. Replace with real JWT in Supabase/Keycloak mode.';

-- has_restaurant_access(restaurant_id) — always TRUE in Docker Core
CREATE OR REPLACE FUNCTION public.has_restaurant_access(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT TRUE;
$$;

COMMENT ON FUNCTION public.has_restaurant_access(UUID) IS 'Docker Core shim: always TRUE (postgres bypasses RLS). Replace with real tenant check in Supabase/Keycloak mode.';

-- Grant execute to all roles
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_restaurant_access(UUID) TO anon, authenticated, service_role;
