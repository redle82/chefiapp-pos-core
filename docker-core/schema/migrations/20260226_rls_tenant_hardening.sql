-- migrate:up
-- =============================================================================
-- Migration: 20260226_rls_tenant_hardening.sql
-- Date: 2026-02-26
-- Purpose: CRITICAL — Close multi-tenant isolation gaps. No production scaling
--          until this is applied.
-- Ref: docs/audit/RLS_TENANT_ISOLATION_AUDIT_2026-02-26.md
--
-- Actions:
--   1. DROP policies with USING(true) or WITH CHECK(true) (open bypass)
--   2. REVOKE anon from all multi-tenant tables
--   3. CREATE policies with has_restaurant_access() or org membership
--   4. Add auth.uid() IS NOT NULL guard where needed
--   5. Add has_restaurant_access() guard to SECURITY DEFINER RPCs
--   6. REVOKE anon from RPCs
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. gm_restaurant_settings (CRÍTICO)
-- =============================================================================
-- Tables: gm_restaurant_settings
-- Vuln: gm_restaurant_settings_read, gm_restaurant_settings_write with USING(true)
--       GRANT anon
-----------------------------------------------------------------------------

DROP POLICY IF EXISTS "gm_restaurant_settings_read" ON public.gm_restaurant_settings;
DROP POLICY IF EXISTS "gm_restaurant_settings_write" ON public.gm_restaurant_settings;

-- Ensure secure policies exist (idempotent with 20260220; may have been overwritten)
DROP POLICY IF EXISTS "settings_select" ON public.gm_restaurant_settings;
DROP POLICY IF EXISTS "settings_insert" ON public.gm_restaurant_settings;
DROP POLICY IF EXISTS "settings_update" ON public.gm_restaurant_settings;
DROP POLICY IF EXISTS "settings_delete" ON public.gm_restaurant_settings;
DROP POLICY IF EXISTS "settings_service_role" ON public.gm_restaurant_settings;

CREATE POLICY "rls_restaurant_settings_select" ON public.gm_restaurant_settings
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

CREATE POLICY "rls_restaurant_settings_insert" ON public.gm_restaurant_settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

CREATE POLICY "rls_restaurant_settings_update" ON public.gm_restaurant_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id))
  WITH CHECK (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

CREATE POLICY "rls_restaurant_settings_delete" ON public.gm_restaurant_settings
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

CREATE POLICY "rls_restaurant_settings_service_role" ON public.gm_restaurant_settings
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_restaurant_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_restaurant_settings TO authenticated;

-- =============================================================================
-- 2. gm_orchestrator_logs (CRÍTICO)
-- =============================================================================
-- Vuln: gm_orchestrator_logs_tenant_read/insert with USING(true), GRANT anon
-----------------------------------------------------------------------------

DROP POLICY IF EXISTS "gm_orchestrator_logs_tenant_read" ON public.gm_orchestrator_logs;
DROP POLICY IF EXISTS "gm_orchestrator_logs_tenant_insert" ON public.gm_orchestrator_logs;

CREATE POLICY "rls_orchestrator_logs_select" ON public.gm_orchestrator_logs
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

-- INSERT only via SECURITY DEFINER RPC (no direct insert from client)
CREATE POLICY "rls_orchestrator_logs_insert_deny" ON public.gm_orchestrator_logs
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "rls_orchestrator_logs_service_role" ON public.gm_orchestrator_logs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_orchestrator_logs FROM anon;
GRANT SELECT ON public.gm_orchestrator_logs TO authenticated;

-- =============================================================================
-- 3. gm_organizations (ALTO)
-- =============================================================================
-- Vuln: org_read_all, org_insert_all, org_update_all with USING(true), GRANT anon
-- Isolation: user must be member of the org (gm_org_members)
-----------------------------------------------------------------------------

DROP POLICY IF EXISTS "org_read_all" ON public.gm_organizations;
DROP POLICY IF EXISTS "org_insert_all" ON public.gm_organizations;
DROP POLICY IF EXISTS "org_update_all" ON public.gm_organizations;

CREATE POLICY "rls_org_select" ON public.gm_organizations
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gm_org_members m
      WHERE m.org_id = gm_organizations.id
      AND m.user_id = auth.uid()
    )
  );

-- INSERT: owner_id must be the creating user (new org)
CREATE POLICY "rls_org_insert" ON public.gm_organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- UPDATE: must be org member with owner/admin role
CREATE POLICY "rls_org_update" ON public.gm_organizations
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gm_org_members m
      WHERE m.org_id = gm_organizations.id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gm_org_members m
      WHERE m.org_id = gm_organizations.id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "rls_org_service_role" ON public.gm_organizations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_organizations FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.gm_organizations TO authenticated;

-- =============================================================================
-- 4. gm_org_members (ALTO)
-- =============================================================================
-- Vuln: org_member_read_all, org_member_insert_all, org_member_update_all
-----------------------------------------------------------------------------

DROP POLICY IF EXISTS "org_member_read_all" ON public.gm_org_members;
DROP POLICY IF EXISTS "org_member_insert_all" ON public.gm_org_members;
DROP POLICY IF EXISTS "org_member_update_all" ON public.gm_org_members;

-- SELECT: user sees members of orgs they belong to
CREATE POLICY "rls_org_member_select" ON public.gm_org_members
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gm_org_members m2
      WHERE m2.org_id = gm_org_members.org_id
      AND m2.user_id = auth.uid()
    )
  );

-- INSERT: only owner/admin of the org can add members
CREATE POLICY "rls_org_member_insert" ON public.gm_org_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gm_org_members m
      WHERE m.org_id = gm_org_members.org_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- UPDATE: only owner/admin can update members
CREATE POLICY "rls_org_member_update" ON public.gm_org_members
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gm_org_members m
      WHERE m.org_id = gm_org_members.org_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gm_org_members m
      WHERE m.org_id = gm_org_members.org_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

-- DELETE: owner/admin can remove members (except owner)
CREATE POLICY "rls_org_member_delete" ON public.gm_org_members
  FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.gm_org_members m
      WHERE m.org_id = gm_org_members.org_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "rls_org_member_service_role" ON public.gm_org_members
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_org_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_org_members TO authenticated;

-- =============================================================================
-- 5. gm_restaurant_members (patch dev — eliminar USING(true))
-- =============================================================================
-- Vuln: "Public read for own membership", "Public insert for bootstrap"
-----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public read for own membership" ON public.gm_restaurant_members;
DROP POLICY IF EXISTS "Public insert for bootstrap" ON public.gm_restaurant_members;

-- Drop 20260321 policies if present (we recreate for consistency)
DROP POLICY IF EXISTS "restaurant_members_select" ON public.gm_restaurant_members;
DROP POLICY IF EXISTS "restaurant_members_insert" ON public.gm_restaurant_members;
DROP POLICY IF EXISTS "restaurant_members_update" ON public.gm_restaurant_members;
DROP POLICY IF EXISTS "restaurant_members_delete" ON public.gm_restaurant_members;
DROP POLICY IF EXISTS "restaurant_members_service_all" ON public.gm_restaurant_members;

CREATE POLICY "rls_restaurant_members_select" ON public.gm_restaurant_members
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

CREATE POLICY "rls_restaurant_members_insert" ON public.gm_restaurant_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

CREATE POLICY "rls_restaurant_members_update" ON public.gm_restaurant_members
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id))
  WITH CHECK (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

CREATE POLICY "rls_restaurant_members_delete" ON public.gm_restaurant_members
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND has_restaurant_access(restaurant_id));

CREATE POLICY "rls_restaurant_members_service_role" ON public.gm_restaurant_members
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

REVOKE ALL ON public.gm_restaurant_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_restaurant_members TO authenticated;

-- =============================================================================
-- 6. RPCs — has_restaurant_access guard + REVOKE anon
-- =============================================================================
-- log_orchestrator_decision, get_orchestrator_logs, upsert_restaurant_settings,
-- get_restaurant_settings — SECURITY DEFINER bypassa RLS; must validate caller
-----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_orchestrator_decision(
    p_restaurant_id UUID,
    p_event_type    TEXT,
    p_action        TEXT,
    p_reason        TEXT,
    p_state_snapshot JSONB DEFAULT '{}'::JSONB,
    p_metadata      JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Access denied: authentication required';
    END IF;
    IF NOT has_restaurant_access(p_restaurant_id) THEN
        RAISE EXCEPTION 'Access denied to restaurant %', p_restaurant_id;
    END IF;

    INSERT INTO public.gm_orchestrator_logs (
        restaurant_id, event_type, action, reason, state_snapshot, metadata
    ) VALUES (
        p_restaurant_id, p_event_type, p_action, p_reason, p_state_snapshot, p_metadata
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('id', v_id, 'logged', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_orchestrator_logs(
    p_restaurant_id UUID,
    p_from          TIMESTAMPTZ DEFAULT NULL,
    p_to            TIMESTAMPTZ DEFAULT NULL,
    p_action        TEXT DEFAULT NULL,
    p_limit         INTEGER DEFAULT 100,
    p_offset        INTEGER DEFAULT 0
) RETURNS SETOF public.gm_orchestrator_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Access denied: authentication required';
    END IF;
    IF NOT has_restaurant_access(p_restaurant_id) THEN
        RAISE EXCEPTION 'Access denied to restaurant %', p_restaurant_id;
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.gm_orchestrator_logs ol
    WHERE ol.restaurant_id = p_restaurant_id
      AND (p_from IS NULL OR ol.decided_at >= p_from)
      AND (p_to IS NULL OR ol.decided_at <= p_to)
      AND (p_action IS NULL OR ol.action = p_action)
    ORDER BY ol.decided_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_restaurant_settings(
    p_restaurant_id          UUID,
    p_orchestrator_enabled   BOOLEAN DEFAULT NULL,
    p_idle_threshold_minutes INTEGER DEFAULT NULL,
    p_max_kds_load           INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.gm_restaurant_settings;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Access denied: authentication required';
    END IF;
    IF NOT has_restaurant_access(p_restaurant_id) THEN
        RAISE EXCEPTION 'Access denied to restaurant %', p_restaurant_id;
    END IF;

    INSERT INTO public.gm_restaurant_settings (
        restaurant_id, orchestrator_enabled, idle_threshold_minutes, max_kds_load
    ) VALUES (
        p_restaurant_id,
        COALESCE(p_orchestrator_enabled, true),
        COALESCE(p_idle_threshold_minutes, 15),
        COALESCE(p_max_kds_load, 20)
    )
    ON CONFLICT (restaurant_id) DO UPDATE
    SET
        orchestrator_enabled   = COALESCE(p_orchestrator_enabled, gm_restaurant_settings.orchestrator_enabled),
        idle_threshold_minutes = COALESCE(p_idle_threshold_minutes, gm_restaurant_settings.idle_threshold_minutes),
        max_kds_load           = COALESCE(p_max_kds_load, gm_restaurant_settings.max_kds_load),
        updated_at             = NOW()
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'restaurant_id', v_row.restaurant_id,
        'orchestrator_enabled', v_row.orchestrator_enabled,
        'idle_threshold_minutes', v_row.idle_threshold_minutes,
        'max_kds_load', v_row.max_kds_load,
        'updated_at', v_row.updated_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_restaurant_settings(
    p_restaurant_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row public.gm_restaurant_settings;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Access denied: authentication required';
    END IF;
    IF NOT has_restaurant_access(p_restaurant_id) THEN
        RAISE EXCEPTION 'Access denied to restaurant %', p_restaurant_id;
    END IF;

    SELECT * INTO v_row
    FROM public.gm_restaurant_settings
    WHERE restaurant_id = p_restaurant_id;

    IF v_row IS NULL THEN
        RETURN jsonb_build_object(
            'restaurant_id', p_restaurant_id,
            'orchestrator_enabled', true,
            'idle_threshold_minutes', 15,
            'max_kds_load', 20,
            'updated_at', NOW()
        );
    END IF;

    RETURN jsonb_build_object(
        'restaurant_id', v_row.restaurant_id,
        'orchestrator_enabled', v_row.orchestrator_enabled,
        'idle_threshold_minutes', v_row.idle_threshold_minutes,
        'max_kds_load', v_row.max_kds_load,
        'updated_at', v_row.updated_at
    );
END;
$$;

-- Revoke anon from RPCs
REVOKE EXECUTE ON FUNCTION public.log_orchestrator_decision(UUID, TEXT, TEXT, TEXT, JSONB, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_orchestrator_logs(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_restaurant_settings(UUID, BOOLEAN, INTEGER, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_restaurant_settings(UUID) FROM anon;

GRANT EXECUTE ON FUNCTION public.log_orchestrator_decision(UUID, TEXT, TEXT, TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_orchestrator_logs(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_restaurant_settings(UUID, BOOLEAN, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_restaurant_settings(UUID) TO authenticated;

-- =============================================================================
-- 7. Checklist de validação (executar após migration)
-- =============================================================================
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('gm_restaurant_settings', 'gm_orchestrator_logs', 'gm_organizations', 'gm_org_members', 'gm_restaurant_members')
-- ORDER BY tablename, policyname;
--
-- Verificar que não há políticas com qual = 'true' (USING true):
-- SELECT tablename, policyname, qual FROM pg_policies WHERE qual::text LIKE '%true%' AND schemaname = 'public';
--
-- Verificar anon revogado:
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_schema = 'public'
--   AND table_name IN ('gm_restaurant_settings', 'gm_orchestrator_logs', 'gm_organizations', 'gm_org_members', 'gm_restaurant_members')
--   AND grantee = 'anon';
-- (deve retornar 0 linhas)
-- =============================================================================

COMMIT;
