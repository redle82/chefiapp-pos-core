-- Docker Core: Adiciona address_text e opening_hours_text à gm_restaurants
-- Necessário para PublicPresenceFields (Config → Página web).

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS address_text TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours_text TEXT;

COMMENT ON COLUMN public.gm_restaurants.address_text IS
  'Endereço ou localização para exibir na página pública (/public/:slug).';
COMMENT ON COLUMN public.gm_restaurants.opening_hours_text IS
  'Horários de funcionamento em texto livre (ex: Seg-Sex 9h-18h) para a página pública.';
