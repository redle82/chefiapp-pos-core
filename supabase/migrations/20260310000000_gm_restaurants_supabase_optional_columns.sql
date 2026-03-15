-- =============================================================================
-- GM_RESTAURANTS — Colunas opcionais para compatibilidade com portal (Supabase)
-- =============================================================================
-- Purpose: Adiciona colunas que o RuntimeReader e /admin/config/general esperam
--          quando o backend é Supabase: type, disabled_at, trial_ends_at,
--          product_mode, billing_status; city, address, logo_url, country,
--          timezone, currency, locale (identidade/config geral).
--          restaurant_setup_status: tabela opcional para onboarding sections.
-- =============================================================================

-- 1. Colunas opcionais em gm_restaurants (nullable para não quebrar dados existentes)
DO $$
BEGIN
  -- Identidade / config geral (evita 400 em fetchRestaurantForIdentity e /admin/config/general)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'type') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'city') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'address') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'logo_url') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN logo_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'country') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN country text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'timezone') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN timezone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'currency') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN currency text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'locale') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN locale text;
  END IF;
  -- Identidade estendida (GeneralCardIdentity: save)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'phone') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'email') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'postal_code') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN postal_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'state') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN state text;
  END IF;
  -- Billing / trial (RuntimeReader fetchRestaurant)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'disabled_at') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN disabled_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN trial_ends_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'product_mode') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN product_mode text DEFAULT 'trial';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'billing_status') THEN
    ALTER TABLE public.gm_restaurants ADD COLUMN billing_status text DEFAULT 'trial';
  END IF;
END $$;

-- 2. restaurant_setup_status: view mínima (sections jsonb) para não 404
CREATE TABLE IF NOT EXISTS public.restaurant_setup_status (
  restaurant_id uuid NOT NULL PRIMARY KEY REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  sections jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_setup_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_setup_status" ON public.restaurant_setup_status;
CREATE POLICY "service_role_all_setup_status" ON public.restaurant_setup_status FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_select_setup_status" ON public.restaurant_setup_status;
CREATE POLICY "authenticated_select_setup_status" ON public.restaurant_setup_status FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, UPDATE ON public.restaurant_setup_status TO anon, authenticated;
GRANT ALL ON public.restaurant_setup_status TO service_role;

COMMENT ON TABLE public.restaurant_setup_status IS 'Estado de onboarding/setup por restaurante (sections). Opcional para fluxo soberano.';
