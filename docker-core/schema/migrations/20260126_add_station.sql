-- =============================================================================
-- ADD STATION (BAR vs KITCHEN) TO PRODUCTS AND ORDER ITEMS
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Separar fluxos de Bar e Cozinha
-- 
-- Regra: Produto define station (BAR ou KITCHEN)
-- OrderItem copia station como snapshot no momento do pedido.
-- =============================================================================

-- 1. Adicionar station ao gm_products
ALTER TABLE public.gm_products
ADD COLUMN IF NOT EXISTS station TEXT DEFAULT 'KITCHEN' CHECK (station IN ('BAR', 'KITCHEN'));

-- 2. Adicionar station snapshot ao gm_order_items
ALTER TABLE public.gm_order_items
ADD COLUMN IF NOT EXISTS station TEXT CHECK (station IN ('BAR', 'KITCHEN'));

-- 3. Comentários para documentação
COMMENT ON COLUMN public.gm_products.station IS 'Estação de preparo: BAR (bebidas) ou KITCHEN (comida)';
COMMENT ON COLUMN public.gm_order_items.station IS 'Snapshot do station do produto no momento da criação do pedido';

-- 4. Valores padrão baseados em categoria (para produtos existentes)
UPDATE public.gm_products
SET station = CASE 
  WHEN prep_category = 'drink' THEN 'BAR'
  ELSE 'KITCHEN'
END
WHERE station IS NULL OR station = 'KITCHEN';
