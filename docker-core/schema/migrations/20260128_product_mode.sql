-- =============================================================================
-- PRODUCT MODE — Modo de produto do restaurante (demo | pilot | live)
-- =============================================================================
-- Data: 2026-01-28
-- Objetivo: Persistir product_mode em gm_restaurants para sobreviver a refresh
--           e dispositivos; transições raras e contratuais.
-- =============================================================================

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS product_mode TEXT NOT NULL DEFAULT 'demo'
  CHECK (product_mode IN ('demo', 'pilot', 'live'));

COMMENT ON COLUMN public.gm_restaurants.product_mode IS 'Modo de produto: demo (dados simulados), pilot (operação real controlada), live (operação oficial). Transições definidas pelo contrato.';
