-- FASE 1 Vendável PT: trial_ends_at para paywall e countdown
-- gm_restaurants: coluna trial_ends_at (timestamptz); ao criar restaurante definir created_at + 14 days.

ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN public.gm_restaurants.trial_ends_at IS 'Fim do período de trial (14 dias a partir da criação). Usado para paywall e countdown.';
