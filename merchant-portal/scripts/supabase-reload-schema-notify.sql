-- =============================================================================
-- E2E config-general: Passo 1 do plano de debug (recarga do schema PostgREST)
-- =============================================================================
-- Colar no Supabase Dashboard → SQL Editor e executar.
-- Objetivo: recarregar o schema cache do PostgREST para que colunas já aplicadas
-- (ex.: gm_restaurants.disabled_at) passem a ser reconhecidas nas requests do browser/E2E.
-- Depois: reexecutar o E2E (Passo 2). Ver docs/ops/P0_CONFIG_GENERAL_VALIDACAO.md §1.1.
-- Se a coluna ainda não existir, aplicar antes: apply-optional-restaurant-columns.ts
-- ou supabase/migrations/20260310000000_gm_restaurants_supabase_optional_columns.sql

NOTIFY pgrst, 'reload schema';
