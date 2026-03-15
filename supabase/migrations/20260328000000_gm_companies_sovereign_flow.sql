-- =============================================================================
-- GM_COMPANIES — Fluxo soberano P0 (seed owner + restaurant + membership)
-- =============================================================================
-- Date: 2026-03-28
-- Purpose: Tabela gm_companies e coluna company_id em gm_restaurants para o
--          seed canónico (seed-e2e-user.ts) criar company → restaurant → membership.
--          Sem isto, o seed falha com "Could not find the table 'public.gm_companies'".
--
-- Dependencies: gm_restaurants já deve existir (baseline 20260222111218 ou equivalente).
-- =============================================================================

-- 1. Tabela gm_companies (esperada pelo seed: owner_id, name, plan, status)
CREATE TABLE IF NOT EXISTS public.gm_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'sovereign',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_gm_companies_owner ON public.gm_companies(owner_id);
COMMENT ON TABLE public.gm_companies IS 'Empresa/organização para fluxo soberano. Uma company por owner; seed cria 1 company + 1 restaurant + membership owner.';

-- 2. Coluna company_id em gm_restaurants (nullable para não quebrar quem já usa tenant_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.gm_restaurants
      ADD COLUMN company_id uuid REFERENCES public.gm_companies(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_gm_restaurants_company ON public.gm_restaurants(company_id);
    COMMENT ON COLUMN public.gm_restaurants.company_id IS 'Company (fluxo soberano). Usado pelo seed canónico; opcional quando se usa tenant_id/saas_tenants.';
  END IF;
END $$;

-- 3. RLS e grants (mínimo para seed com service_role e para app com JWT)
ALTER TABLE public.gm_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_companies" ON public.gm_companies;
CREATE POLICY "service_role_all_companies" ON public.gm_companies FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "owner_select_company" ON public.gm_companies;
CREATE POLICY "owner_select_company" ON public.gm_companies FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "owner_insert_company" ON public.gm_companies;
CREATE POLICY "owner_insert_company" ON public.gm_companies FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "owner_update_company" ON public.gm_companies;
CREATE POLICY "owner_update_company" ON public.gm_companies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.gm_companies TO anon, authenticated;
GRANT ALL ON public.gm_companies TO service_role;
