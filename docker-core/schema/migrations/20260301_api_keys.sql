-- =============================================================================
-- API Keys — Autenticação da API pública v1
-- =============================================================================
-- Ref: CHEFIAPP_API_PUBLICA_V1_SPEC.md §3.
-- Tabela: api_keys (key_hash, restaurant_id, name, last_used_at). RLS por restaurant_id.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    key_hash        TEXT NOT NULL,
    name            TEXT NOT NULL DEFAULT 'Default',
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_restaurant ON public.api_keys(restaurant_id);

COMMENT ON TABLE public.api_keys IS 'API keys para API pública v1 (hash da key, nunca a key em claro).';

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'api_keys_select') THEN
        CREATE POLICY "api_keys_select" ON public.api_keys
            FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'api_keys_insert') THEN
        CREATE POLICY "api_keys_insert" ON public.api_keys
            FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'api_keys_update') THEN
        CREATE POLICY "api_keys_update" ON public.api_keys
            FOR UPDATE TO authenticated
            USING (has_restaurant_access(restaurant_id))
            WITH CHECK (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'api_keys_delete') THEN
        CREATE POLICY "api_keys_delete" ON public.api_keys
            FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'api_keys_service') THEN
        CREATE POLICY "api_keys_service" ON public.api_keys
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

COMMIT;
