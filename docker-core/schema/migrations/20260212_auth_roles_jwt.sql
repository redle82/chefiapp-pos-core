-- =============================================================================
-- PHASE 3A: Application Roles & JWT Auth Functions
-- =============================================================================
-- Creates the role infrastructure that makes all existing RLS policies functional.
--
-- CURRENT STATE:
--   - PostgREST runs as PGRST_DB_ANON_ROLE=postgres (superuser → bypasses ALL RLS)
--   - RLS policies reference 'authenticated' and 'service_role' roles (don't exist)
--   - has_restaurant_access() calls auth.uid() / auth.jwt() (functions don't exist)
--   - Result: ALL RLS is effectively disabled
--
-- AFTER THIS MIGRATION:
--   - 3 roles: anon (public), authenticated (JWT-validated users), service_role (RPCs)
--   - auth schema with uid(), jwt(), role() functions (PostgREST GUC-based)
--   - PostgREST config should change: PGRST_DB_ANON_ROLE=anon
--   - JWT claims (from Keycloak) are extracted via PostgREST's request.jwt.claims
--
-- HOW PostgREST JWT WORKS:
--   1. Client sends Authorization: Bearer <JWT>
--   2. PostgREST validates JWT signature using PGRST_JWT_SECRET
--   3. PostgREST sets role to jwt.claim.role (default: 'authenticated')
--   4. PostgREST sets GUC variables: request.jwt.claims, request.jwt.claim.sub, etc.
--   5. Our auth.uid()/auth.jwt() read these GUC variables
--   6. RLS policies call has_restaurant_access() → auth.uid() → tenant isolation works
--
-- DEPENDS ON: 07-role-anon.sql (anon role already exists)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Create auth schema (Supabase-compatible pattern)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO postgres;

-- ---------------------------------------------------------------------------
-- 2. Create roles (idempotent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    -- anon: already exists from 07-role-anon.sql, ensure it has correct config
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;

    -- authenticated: for JWT-validated users
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;

    -- service_role: for server-side RPCs (elevated, bypasses RLS where needed)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Role: postgres can switch to any of these roles
-- ---------------------------------------------------------------------------
-- PostgREST connects as postgres, then SET ROLE to the JWT-specified role
GRANT anon TO postgres;
GRANT authenticated TO postgres;
GRANT service_role TO postgres;

-- ---------------------------------------------------------------------------
-- 4. Schema permissions
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Table permissions for authenticated role
-- ---------------------------------------------------------------------------
-- authenticated gets SELECT/INSERT/UPDATE/DELETE (RLS controls actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- service_role gets ALL (it has BYPASSRLS so RLS won't block it)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Sequences (needed for INSERT with serial/bigserial columns)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO service_role;

-- Functions (needed for RPC calls)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Restrict anon role (tighten from 07-role-anon.sql defaults)
-- ---------------------------------------------------------------------------
-- anon should ONLY have:
--   - SELECT on gm_restaurants (public listing)
--   - SELECT on gm_products (public menu)
--   - SELECT on gm_menu_categories (public menu)
--   - INSERT on gm_order_requests (QR ordering)
--   - EXECUTE on specific public RPCs

-- Revoke broad grants from 07-role-anon.sql
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
-- Re-grant SELECT only on public-facing tables
GRANT SELECT ON public.gm_restaurants TO anon;
GRANT SELECT ON public.gm_products TO anon;
GRANT SELECT ON public.gm_menu_categories TO anon;
GRANT SELECT ON public.gm_tables TO anon;

-- QR ordering: anon can create order requests
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'gm_order_requests' AND table_schema = 'public') THEN
        EXECUTE 'GRANT INSERT ON public.gm_order_requests TO anon';
    END IF;
END $$;

-- Revoke anon from sensitive tables (conditional — some may not exist yet)
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'gm_payments', 'gm_cash_registers', 'gm_payment_audit_logs',
        'gm_refunds', 'gm_fiscal_documents', 'event_store',
        'legal_seals', 'gm_audit_logs', 'billing_configs',
        'gm_terminals', 'gm_staff', 'gm_customers'
    ] LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
            RAISE NOTICE 'Revoked anon from %', tbl;
        ELSE
            RAISE NOTICE 'Skipping REVOKE for % (table not found)', tbl;
        END IF;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 7. auth.uid() — Extract user ID from JWT claims
-- ---------------------------------------------------------------------------
-- PostgREST sets the GUC 'request.jwt.claims' with the full JWT payload.
-- The 'sub' claim contains the user's Keycloak ID.
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        -- Standard: PostgREST sets request.jwt.claim.sub
        NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID,
        -- Fallback: extract from full claims JSON
        (current_setting('request.jwt.claims', true)::JSONB ->> 'sub')::UUID
    );
$$;

COMMENT ON FUNCTION auth.uid() IS
'Returns the authenticated user ID from the JWT sub claim. Returns NULL for anon requests.';

-- ---------------------------------------------------------------------------
-- 8. auth.jwt() — Extract full JWT claims
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claims', true), '')::JSONB,
        '{}'::JSONB
    );
$$;

COMMENT ON FUNCTION auth.jwt() IS
'Returns the full JWT claims as JSONB. Returns empty object for anon requests.';

-- ---------------------------------------------------------------------------
-- 9. auth.role() — Get current role name
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claim.role', true), ''),
        current_setting('role', true)
    );
$$;

COMMENT ON FUNCTION auth.role() IS
'Returns the current database role (anon, authenticated, or service_role).';

-- ---------------------------------------------------------------------------
-- 10. Grant auth functions to all roles
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 11. restaurant_users table (maps Keycloak users to restaurants)
-- ---------------------------------------------------------------------------
-- This is the authoritative mapping for has_restaurant_access().
-- In production, populated by Keycloak user events or onboarding flow.
CREATE TABLE IF NOT EXISTS public.restaurant_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,           -- Keycloak user ID (auth.uid())
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE RESTRICT,
    role            TEXT NOT NULL DEFAULT 'staff'
                    CHECK (role IN ('owner', 'manager', 'waiter', 'kitchen', 'cleaning', 'staff')),
    active          BOOLEAN NOT NULL DEFAULT true,
    invited_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,             -- soft delete

    UNIQUE(user_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_users_user_id
    ON public.restaurant_users(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_restaurant_users_restaurant_id
    ON public.restaurant_users(restaurant_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.restaurant_users IS
'Maps Keycloak users to restaurants with role. Core table for all RLS tenant isolation via has_restaurant_access().';

-- ---------------------------------------------------------------------------
-- 10b. Tenant access helpers: current_user_restaurants + has_restaurant_access
-- ---------------------------------------------------------------------------
-- These are the core functions used by all RLS policies for tenant isolation.
-- They depend on auth.uid() (created above) and restaurant_users (created above).
-- If 20260212_fix_tenancy_rls_hardening.sql is applied later, it will overwrite
-- these with the same definitions (idempotent).

CREATE OR REPLACE FUNCTION public.current_user_restaurants()
RETURNS TABLE (restaurant_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ru.restaurant_id
  FROM restaurant_users ru
  WHERE ru.user_id = auth.uid()
    AND ru.deleted_at IS NULL

  UNION ALL

  SELECT (auth.jwt() ->> 'restaurant_id')::uuid
  WHERE (auth.jwt() ->> 'restaurant_id') IS NOT NULL;
$$;

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

GRANT EXECUTE ON FUNCTION public.current_user_restaurants() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_restaurant_access(UUID) TO anon, authenticated, service_role;

-- RLS on restaurant_users itself
ALTER TABLE public.restaurant_users ENABLE ROW LEVEL SECURITY;

-- Users can see their own memberships
CREATE POLICY "restaurant_users_select_own"
    ON public.restaurant_users
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Owners/managers can manage memberships for their restaurants
CREATE POLICY "restaurant_users_insert_manager"
    ON public.restaurant_users
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurant_users ru
            WHERE ru.user_id = auth.uid()
              AND ru.restaurant_id = restaurant_users.restaurant_id
              AND ru.role IN ('owner', 'manager')
              AND ru.deleted_at IS NULL
        )
    );

CREATE POLICY "restaurant_users_update_manager"
    ON public.restaurant_users
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_users ru
            WHERE ru.user_id = auth.uid()
              AND ru.restaurant_id = restaurant_users.restaurant_id
              AND ru.role IN ('owner', 'manager')
              AND ru.deleted_at IS NULL
        )
    );

-- service_role: full access
CREATE POLICY "restaurant_users_service"
    ON public.restaurant_users
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Grant to roles
GRANT SELECT, INSERT, UPDATE ON public.restaurant_users TO authenticated;
GRANT ALL ON public.restaurant_users TO service_role;
REVOKE ALL ON public.restaurant_users FROM anon;

COMMIT;
