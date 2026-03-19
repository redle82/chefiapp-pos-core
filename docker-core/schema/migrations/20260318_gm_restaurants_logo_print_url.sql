-- =============================================================================
-- LOGO_PRINT_URL — Logo monocromático para impressão térmica
-- =============================================================================
-- Data: 2026-03-18
-- Objetivo: Logo alternativo preto-sobre-branco para recibos térmicos.
--           Se NULL, o sistema converte logo_url automaticamente via dithering.
-- =============================================================================

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS logo_print_url TEXT;

COMMENT ON COLUMN public.gm_restaurants.logo_print_url
  IS 'Logo monocromático para impressão térmica (opcional). Se NULL, usa logo_url com conversão automática.';
