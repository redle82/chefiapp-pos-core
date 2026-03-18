-- =============================================================================
-- TAX_ID — NIF/NIPC do restaurante em gm_restaurants
-- =============================================================================
-- Data: 2026-03-18
-- Objetivo: Adicionar tax_id para recibos fiscais (cabeçalho do recibo)
-- =============================================================================

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS tax_id TEXT;

COMMENT ON COLUMN public.gm_restaurants.tax_id
  IS 'NIF/NIPC do restaurante (ex: 123456789). Impresso no cabeçalho dos recibos fiscais.';

-- Seed: preencher dados do restaurante demo
UPDATE public.gm_restaurants
SET tax_id = '123456789'
WHERE id = '00000000-0000-0000-0000-000000000100';
