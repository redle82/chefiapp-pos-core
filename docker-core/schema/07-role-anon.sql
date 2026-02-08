-- =============================================================================
-- CHEFIAPP CORE - Role anon para PostgREST (opcional; actualmente usa postgres)
-- =============================================================================
-- Permite usar PGRST_DB_ANON_ROLE=anon no futuro com RLS.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO anon;
-- Permissões mínimas; ajustar quando RLS estiver activo
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
