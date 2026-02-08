-- =============================================================================
-- CONFIG GENERAL — Colunas extra em gm_restaurants
-- =============================================================================
-- Data: 2026-02-08
-- Objetivo: Adicionar phone, email, receipt_extra_text, google_place_id
--           para que os 4 cards de Configuração > General persistam no DB
-- =============================================================================

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS receipt_extra_text TEXT,
  ADD COLUMN IF NOT EXISTS google_place_id TEXT;

COMMENT ON COLUMN public.gm_restaurants.phone
  IS 'Telefone de contacto do restaurante';
COMMENT ON COLUMN public.gm_restaurants.email
  IS 'E-mail de contacto do restaurante';
COMMENT ON COLUMN public.gm_restaurants.receipt_extra_text
  IS 'Texto extra impresso nos recibos (fiscal, agradecimento)';
COMMENT ON COLUMN public.gm_restaurants.google_place_id
  IS 'Google Place ID para reviews e integrações';

-- Seed: preencher dados do restaurante demo
UPDATE public.gm_restaurants
SET
  phone  = '+34 692 054 892',
  email  = 'hola@sofiagastrobar.com'
WHERE id = '00000000-0000-0000-0000-000000000100';
