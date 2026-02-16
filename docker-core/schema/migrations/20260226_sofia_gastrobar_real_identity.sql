-- =============================================================================
-- SOFIA GASTROBAR — Identidade real (não mock/demo)
-- =============================================================================
-- migrate:up (dbmate). Aplicar após 20260207, 20260208, 20260127, 20260225.
-- Objetivo: Tratar o restaurante 00000000-0000-0000-0000-000000000100 como
--           restaurante real "Sofia Gastrobar" (Ibiza): dados de dono, contacto,
--           localização e tipo. Alinhado com a web de configuração e com
--           docs/architecture/SOFIA_GASTROBAR_REAL_PILOT.md.
-- Pré-requisitos: seeds_dev.sql, 20260207_seed_sofia_gastrobar.sql,
--                20260208_gm_restaurants_config_columns.sql,
--                20260127_onboarding_persistence.sql (city, address),
--                20260225_restaurant_logo_url.sql (logo_url).
-- =============================================================================

-- Identidade completa: nome, slug, contacto (dono), localização, tipo
UPDATE public.gm_restaurants
SET
  name = 'Sofia Gastrobar',
  slug = 'sofia-gastrobar',
  email = 'dono@sofiagastrobar.com',
  phone = '+34 692 054 892',
  city = 'Ibiza',
  address = 'Calle de la Marina 15, 07800 Ibiza, Baleares',
  country = 'Spain',
  timezone = 'Europe/Madrid',
  currency = 'EUR',
  locale = 'es-ES',
  type = 'Gastrobar',
  description = 'Gastrobar em Ibiza. Tapas, burgers, pizzas, coctelería.',
  status = COALESCE(status, 'active'),
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000100';

-- product_mode e billing_status (se existirem) mantêm-se ou definem-se noutras migrações
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'product_mode'
  ) THEN
    UPDATE public.gm_restaurants
    SET product_mode = 'live', updated_at = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000100';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'billing_status'
  ) THEN
    UPDATE public.gm_restaurants
    SET billing_status = COALESCE(billing_status, 'trial'), updated_at = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000100';
  END IF;
END $$;
