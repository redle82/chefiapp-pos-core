-- =============================================================================
-- gm_catalog_items — coluna badges (selos: chef, mais_pedido, novidade, etc.)
-- =============================================================================
-- Objetivo: permitir badges por prato para /menu-v2 e secção Recomendações.
-- Badge component: chef, tripadvisor, mais_pedido, veggie, novidade, recomendado.
-- =============================================================================

ALTER TABLE public.gm_catalog_items
  ADD COLUMN IF NOT EXISTS badges JSONB NOT NULL DEFAULT '[]'::JSONB;

COMMENT ON COLUMN public.gm_catalog_items.badges IS 'Selos por prato (chef, tripadvisor, mais_pedido, veggie, novidade, recomendado). Usado por MenuDishCard e Recomendações.';
