-- =============================================================================
-- Restaurante de trial: "Seu restaurante"
-- =============================================================================
-- Objetivo: Segundo restaurante para modo trial (id 099). O restaurante real
--           é Sofia Gastrobar (id 100). Em trial a app usa 099; em real usa 100.
-- Pré-requisitos: seeds_dev.sql (tenant 00000000-0000-0000-0000-000000000001).
-- =============================================================================
-- migrate:up (dbmate).
-- =============================================================================

-- Restaurante trial: nome "Seu restaurante", slug "seu-restaurante"
INSERT INTO public.gm_restaurants (
  id,
  tenant_id,
  name,
  slug,
  status,
  type,
  description
)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000001',
  'Seu restaurante',
  'seu-restaurante',
  'active',
  'Restaurante',
  'Restaurante de demonstração em modo trial.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Colunas opcionais (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'email') THEN
    UPDATE public.gm_restaurants SET email = 'trial@chefiapp.com', updated_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000099';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'product_mode') THEN
    UPDATE public.gm_restaurants SET product_mode = 'demo', updated_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000099';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'billing_status') THEN
    UPDATE public.gm_restaurants SET billing_status = 'trial', updated_at = NOW() WHERE id = '00000000-0000-0000-0000-000000000099';
  END IF;
END $$;
