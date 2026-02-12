-- =============================================================================
-- Patch: colunas em falta em gm_restaurants + tabela gm_customers
-- Objetivo: Eliminar 400 (Bad Request) e 404 em Config > Geral e Gestor reservas.
-- Executar contra o Postgres do Core em execução quando o schema está desatualizado.
-- =============================================================================

-- 1. gm_restaurants — colunas de identidade/local (20260127_onboarding_persistence)
ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'pt-BR';

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. gm_restaurants — colunas de config geral (20260208_gm_restaurants_config_columns)
ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS receipt_extra_text TEXT,
  ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- 3. gm_customers (20260216_gm_customers)
CREATE TABLE IF NOT EXISTS public.gm_customers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id       UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    phone               TEXT NOT NULL,
    name                TEXT,
    email               TEXT,
    points_balance      INTEGER NOT NULL DEFAULT 0,
    total_spend_cents   INTEGER NOT NULL DEFAULT 0,
    visit_count         INTEGER NOT NULL DEFAULT 0,
    last_visit_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(restaurant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_gm_customers_restaurant_id
    ON public.gm_customers (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_gm_customers_created_at
    ON public.gm_customers (created_at DESC);

COMMENT ON TABLE public.gm_customers IS 'Clientes por restaurante: fidelidade (pontos, visitas, spend). Upsert por (restaurant_id, phone).';
