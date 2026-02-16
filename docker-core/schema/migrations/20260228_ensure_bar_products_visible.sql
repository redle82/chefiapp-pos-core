-- =============================================================================
-- Migration: 20260228 — Garantir produtos do bar visíveis no KDS
-- Purpose: Produtos de bebidas/bar devem ter station = 'BAR' para aparecerem
--          na secção Bar no KDS. Inclui categorias em espanhol (Sofia seed)
--          e fallback por nome do produto.
-- =============================================================================
-- migrate:up (dbmate).
-- =============================================================================

-- 1. Por categoria (complementa 20260224): padrões em espanhol e PT
UPDATE public.gm_products p
SET station = 'BAR', prep_category = COALESCE(p.prep_category, 'drink')
FROM public.gm_menu_categories c
WHERE p.category_id = c.id
  AND p.restaurant_id = c.restaurant_id
  AND (p.station IS NULL OR p.station = 'KITCHEN')
  AND (
    c.name ILIKE '%bebida%'
    OR c.name ILIKE '%bar%'
    OR c.name ILIKE '%cerveja%'
    OR c.name ILIKE '%cerveza%'
    OR c.name ILIKE '%vinho%'
    OR c.name ILIKE '%vino%'
    OR c.name ILIKE '%café%'
    OR c.name ILIKE '%cafe%'
    OR c.name ILIKE '%infus%'
    OR c.name ILIKE '%sumo%'
    OR c.name ILIKE '%zumo%'
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

-- 2. Por nome do produto (fallback: bebidas por nome mesmo sem categoria de bar)
UPDATE public.gm_products
SET station = 'BAR', prep_category = COALESCE(prep_category, 'drink')
WHERE (station IS NULL OR station = 'KITCHEN')
  AND (
    name ILIKE '%água%' OR name ILIKE '%agua%'
    OR name ILIKE '%refrigerante%' OR name ILIKE '%cola%' OR name ILIKE '%pepsi%' OR name ILIKE '%coca%'
    OR name ILIKE '%cerveja%' OR name ILIKE '%cerveza%' OR name ILIKE '%beer%'
    OR name ILIKE '%vinho%' OR name ILIKE '%vino%' OR name ILIKE '%wine%'
    OR name ILIKE '%cocktail%' OR name ILIKE '%coctel%' OR name ILIKE '%drink%' OR name ILIKE '%bebida%'
    OR name ILIKE '%café%' OR name ILIKE '%cafe%' OR name ILIKE '%espresso%' OR name ILIKE '%infus%'
    OR name ILIKE '%sumo%' OR name ILIKE '%zumo%' OR name ILIKE '%sangría%' OR name ILIKE '%sangria%'
    OR name ILIKE '%licor%' OR name ILIKE '%chupito%' OR name ILIKE '%copas%'
    OR name ILIKE '%espumante%' OR name ILIKE '%refresco%'
  );

-- 3. prep_category = 'drink' já existente (garantir station BAR)
UPDATE public.gm_products
SET station = 'BAR'
WHERE prep_category = 'drink'
  AND (station IS NULL OR station = 'KITCHEN');

-- 4. Itens de pedido já criados: alinhar station com o produto (para aparecerem na secção Bar do KDS)
UPDATE public.gm_order_items oi
SET station = 'BAR'
FROM public.gm_products p
WHERE oi.product_id = p.id
  AND p.station = 'BAR'
  AND (oi.station IS NULL OR oi.station = 'KITCHEN');
