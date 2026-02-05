-- FASE 4 Passo 1: Campos de presença digital em gm_restaurants
-- Horários e localização para a página pública (/public/:slug).

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS address_text TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours_text TEXT;

COMMENT ON COLUMN public.gm_restaurants.address_text IS
  'Endereço ou localização para exibir na página pública (FASE 4 Presença Digital).';
COMMENT ON COLUMN public.gm_restaurants.opening_hours_text IS
  'Horários de funcionamento em texto livre (ex: Seg-Sex 9h-18h) para a página pública (FASE 4).';
