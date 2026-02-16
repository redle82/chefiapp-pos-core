-- =============================================================================
-- RESTAURANT LOGO — Coluna logo_url em gm_restaurants
-- =============================================================================
-- Data: 2026-02-25
-- Objetivo: Logo do restaurante (URL) para identidade visual em web pública,
--           KDS, TPV, AppStaff e configuração. Contrato: RESTAURANT_LOGO_IDENTITY_CONTRACT.md
-- =============================================================================

-- migrate:up (dbmate). Para aplicar manualmente: cat este ficheiro | psql ...
ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.gm_restaurants.logo_url
  IS 'URL do logo do restaurante. Carregado na web de configuração (Identidade). Exibido na web pública, KDS, TPV e AppStaff.';
