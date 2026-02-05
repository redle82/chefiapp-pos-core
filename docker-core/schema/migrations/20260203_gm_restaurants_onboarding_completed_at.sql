-- =============================================================================
-- gm_restaurants: coluna onboarding_completed_at
-- =============================================================================
-- Data: 2026-02-03
-- Objetivo: Coluna usada pelo merchant-portal ao concluir onboarding (First Product)
--           para marcar restaurante como ativo e permitir acesso ao TPV.
-- =============================================================================

ALTER TABLE public.gm_restaurants
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.gm_restaurants.onboarding_completed_at IS 'Data/hora em que o onboarding foi concluído (ex: primeiro produto criado). Usado pelo FlowGate e billing.';
