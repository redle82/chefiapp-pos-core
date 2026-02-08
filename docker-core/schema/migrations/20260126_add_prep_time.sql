-- =============================================================================
-- ADD PREP TIME TO PRODUCTS AND ORDER ITEMS
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Implementar timer por item (não por pedido)
-- 
-- Regra: Tempo não pertence ao pedido, pertence ao ITEM.
-- O pedido herda o estado do item mais crítico.
-- =============================================================================

-- 1. Adicionar prep_time_seconds e prep_category ao gm_products
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS prep_time_seconds INTEGER DEFAULT 300, -- 5 min padrão
ADD COLUMN IF NOT EXISTS prep_category TEXT DEFAULT 'main' CHECK (prep_category IN ('drink', 'starter', 'main', 'dessert'));

-- 2. Adicionar prep_time_snapshot ao gm_order_items (snapshot no momento do pedido)
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS prep_time_seconds INTEGER, -- Snapshot do prep_time do produto
ADD COLUMN IF NOT EXISTS prep_category TEXT; -- Snapshot da categoria

-- 3. Comentários para documentação
COMMENT ON COLUMN public.gm_products.prep_time_seconds IS 'Tempo esperado de preparo em segundos (ex: 30 para água, 720 para hambúrguer)';
COMMENT ON COLUMN public.gm_products.prep_category IS 'Categoria de preparo: drink, starter, main, dessert';
COMMENT ON COLUMN public.gm_order_items.prep_time_seconds IS 'Snapshot do prep_time_seconds do produto no momento da criação do pedido';
COMMENT ON COLUMN public.gm_order_items.prep_category IS 'Snapshot do prep_category do produto no momento da criação do pedido';

-- 4. Valores padrão por categoria (para produtos existentes)
UPDATE public.gm_products
SET 
  prep_time_seconds = CASE 
    WHEN prep_category = 'drink' THEN 45
    WHEN prep_category = 'starter' THEN 240
    WHEN prep_category = 'main' THEN 720
    WHEN prep_category = 'dessert' THEN 300
    ELSE 300
  END
WHERE prep_time_seconds IS NULL OR prep_time_seconds = 300;
