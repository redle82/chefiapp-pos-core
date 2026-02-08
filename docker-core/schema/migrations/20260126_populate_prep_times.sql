-- =============================================================================
-- POPULATE PREP TIMES — Valores Realistas por Produto
-- =============================================================================
-- Data: 2026-01-26
-- Objetivo: Popular prep_time_seconds e station com valores realistas
-- 
-- Baseado em exemplos reais de restaurantes profissionais.
-- =============================================================================

-- Atualizar produtos baseado no nome (valores realistas)
UPDATE public.gm_products
SET 
  prep_time_seconds = CASE 
    -- Bebidas (BAR)
    WHEN name ILIKE '%água%' OR name ILIKE '%agua%' THEN 30
    WHEN name ILIKE '%refrigerante%' OR name ILIKE '%cola%' OR name ILIKE '%pepsi%' OR name ILIKE '%coca%' THEN 45
    WHEN name ILIKE '%cerveja%' OR name ILIKE '%beer%' THEN 60
    WHEN name ILIKE '%vinho%' OR name ILIKE '%wine%' THEN 90
    WHEN name ILIKE '%cocktail%' OR name ILIKE '%drink%' OR name ILIKE '%bebida%' THEN 240
    
    -- Entradas (KITCHEN)
    WHEN name ILIKE '%bruschetta%' OR name ILIKE '%nachos%' OR name ILIKE '%croquetas%' THEN 240  -- 4 min
    WHEN name ILIKE '%entrada%' OR name ILIKE '%starter%' THEN 300  -- 5 min
    
    -- Principais (KITCHEN)
    WHEN name ILIKE '%hambúrguer%' OR name ILIKE '%hamburger%' OR name ILIKE '%burger%' THEN 720  -- 12 min
    WHEN name ILIKE '%pizza%' THEN 900  -- 15 min
    WHEN name ILIKE '%paella%' THEN 1200  -- 20 min
    WHEN name ILIKE '%risotto%' THEN 1080  -- 18 min
    WHEN name ILIKE '%filete%' OR name ILIKE '%mignon%' OR name ILIKE '%steak%' THEN 900  -- 15 min
    WHEN name ILIKE '%prato%' OR name ILIKE '%principal%' OR name ILIKE '%main%' THEN 720  -- 12 min
    
    -- Sobremesas (KITCHEN)
    WHEN name ILIKE '%tiramisú%' OR name ILIKE '%tiramisu%' OR name ILIKE '%sobremesa%' OR name ILIKE '%dessert%' THEN 300  -- 5 min
    
    -- Padrão
    ELSE 300  -- 5 min padrão
  END,
  station = CASE 
    -- Bebidas → BAR
    WHEN name ILIKE '%água%' OR name ILIKE '%agua%' 
      OR name ILIKE '%refrigerante%' OR name ILIKE '%cola%' OR name ILIKE '%pepsi%' OR name ILIKE '%coca%'
      OR name ILIKE '%cerveja%' OR name ILIKE '%beer%'
      OR name ILIKE '%vinho%' OR name ILIKE '%wine%'
      OR name ILIKE '%cocktail%' OR name ILIKE '%drink%' OR name ILIKE '%bebida%' THEN 'BAR'
    -- Resto → KITCHEN
    ELSE 'KITCHEN'
  END,
  prep_category = CASE 
    -- Bebidas
    WHEN name ILIKE '%água%' OR name ILIKE '%agua%' 
      OR name ILIKE '%refrigerante%' OR name ILIKE '%cola%' OR name ILIKE '%pepsi%' OR name ILIKE '%coca%'
      OR name ILIKE '%cerveja%' OR name ILIKE '%beer%'
      OR name ILIKE '%vinho%' OR name ILIKE '%wine%'
      OR name ILIKE '%cocktail%' OR name ILIKE '%drink%' OR name ILIKE '%bebida%' THEN 'drink'
    -- Entradas
    WHEN name ILIKE '%bruschetta%' OR name ILIKE '%nachos%' OR name ILIKE '%croquetas%' 
      OR name ILIKE '%entrada%' OR name ILIKE '%starter%' THEN 'starter'
    -- Sobremesas
    WHEN name ILIKE '%tiramisú%' OR name ILIKE '%tiramisu%' OR name ILIKE '%sobremesa%' OR name ILIKE '%dessert%' THEN 'dessert'
    -- Principais (padrão)
    ELSE 'main'
  END
WHERE prep_time_seconds = 300 OR prep_time_seconds IS NULL;
