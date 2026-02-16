-- =============================================================================
-- Migration: 20260224 — Marcar produtos de BAR por categoria
-- Purpose: Produtos em categorias de bebidas/bar devem ter station = 'BAR'
--          para aparecerem na secção Bar no KDS e no Menu Builder.
-- =============================================================================

-- Categorias típicas de bar/bebidas (nomes que indicam estação BAR)
-- Ajustar conforme as categorias do teu menu (gm_menu_categories.name)
UPDATE public.gm_products p
SET station = 'BAR'
FROM public.gm_menu_categories c
WHERE p.category_id = c.id
  AND p.restaurant_id = c.restaurant_id
  AND (
    c.name ILIKE '%bebida%'
    OR c.name ILIKE '%bar%'
    OR c.name ILIKE '%cerveja%'
    OR c.name ILIKE '%vinho%'
    OR c.name ILIKE '%café%'
    OR c.name ILIKE '%cafe%'
    OR c.name ILIKE '%infus%'
    OR c.name ILIKE '%sumo%'
    OR c.name ILIKE '%zumos%'
    OR c.name ILIKE '%sangría%'
    OR c.name ILIKE '%sangria%'
    OR c.name ILIKE '%coctel%'
    OR c.name ILIKE '%cóctel%'
    OR c.name ILIKE '%copas%'
    OR c.name ILIKE '%chupito%'
    OR c.name ILIKE '%licor%'
    OR c.name ILIKE '%espumante%'
    OR c.name ILIKE '%refresco%'
    OR c.name ILIKE '%água%'
    OR c.name ILIKE '%agua%'
  );

-- Alternativa: por prep_category (se já estiver preenchido)
UPDATE public.gm_products
SET station = 'BAR'
WHERE prep_category = 'drink'
  AND (station IS NULL OR station = 'KITCHEN');

COMMENT ON COLUMN public.gm_products.station IS 'Estação de preparo: BAR (bebidas) ou KITCHEN (comida). KDS e Menu Builder usam para separar pedidos.';
