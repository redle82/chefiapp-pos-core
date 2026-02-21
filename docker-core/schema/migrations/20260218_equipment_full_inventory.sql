-- =============================================================================
-- 20260218_equipment_full_inventory.sql
-- Expande gm_equipment para inventário completo de restaurante:
--   - description (para que serve)
--   - categoria (COOKING, STORAGE, PREPARATION, CLEANING, SERVICE, SYSTEM)
--   - temperatura ideal (min/max em °C)
--   - mais kinds de equipamento
-- Cria gm_equipment_ingredients para mapear ingredientes armazenados em cada equipamento.
-- =============================================================================

BEGIN;

-- 1. Adicionar novas colunas ao gm_equipment
ALTER TABLE public.gm_equipment
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS ideal_temp_min NUMERIC,
  ADD COLUMN IF NOT EXISTS ideal_temp_max NUMERIC,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT;

-- 2. Expandir o CHECK do kind para incluir mais equipamentos reais de restaurante
--    Remover o antigo constraint e criar novo com mais opções
ALTER TABLE public.gm_equipment DROP CONSTRAINT IF EXISTS gm_equipment_kind_check;
ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_kind_check CHECK (kind IN (
  -- Armazenamento (temperature-controlled)
  'FRIDGE', 'FREEZER', 'WALK_IN_COOLER', 'WALK_IN_FREEZER', 'WINE_COOLER',
  -- Cooking
  'OVEN', 'CONVECTION_OVEN', 'PIZZA_OVEN', 'GRILL', 'CHARCOAL_GRILL', 'PLANCHA',
  'FRYER', 'DEEP_FRYER', 'STEAM_OVEN', 'COMBI_OVEN', 'SALAMANDER',
  'INDUCTION_COOKER', 'GAS_RANGE', 'WOK_BURNER',
  -- Beverage
  'COFFEE_MACHINE', 'ESPRESSO_MACHINE', 'ICE_MACHINE', 'KEG_SYSTEM', 'DRAFT_TOWER',
  'BLENDER', 'JUICER', 'SODA_FOUNTAIN',
  -- Preparation
  'FOOD_PROCESSOR', 'MIXER', 'SLICER', 'VACUUM_SEALER', 'SOUS_VIDE',
  'DOUGH_SHEETER', 'MEAT_GRINDER', 'SCALE',
  -- Storage (non-temperature)
  'SHELF', 'DRY_STORAGE', 'SPICE_RACK', 'CONTAINER',
  -- Cleaning
  'DISHWASHER', 'GLASS_WASHER', 'SINK',
  -- Service
  'WARMING_STATION', 'BAIN_MARIE', 'HOT_PLATE', 'DISPLAY_CASE',
  'PASS_WINDOW',
  -- System/Digital
  'TPV', 'KDS', 'PRINTER', 'TABLET',
  -- Generic
  'OTHER'
));

-- 3. Adicionar constraint de categoria
ALTER TABLE public.gm_equipment ADD CONSTRAINT gm_equipment_category_check CHECK (
  category IS NULL OR category IN (
    'COOKING', 'STORAGE', 'PREPARATION', 'BEVERAGE', 'CLEANING', 'SERVICE', 'SYSTEM', 'OTHER'
  )
);

-- 4. Tabela para mapear ingredientes armazenados em cada equipamento
--    "Congelador 1 contém: Massa de Pizza, Pão"
--    "Geladeira 2 contém: Queijos, Lacticínios"
CREATE TABLE IF NOT EXISTS public.gm_equipment_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.gm_equipment(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.gm_ingredients(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, equipment_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_eq_ing_restaurant ON public.gm_equipment_ingredients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_eq_ing_equipment ON public.gm_equipment_ingredients(equipment_id);
CREATE INDEX IF NOT EXISTS idx_eq_ing_ingredient ON public.gm_equipment_ingredients(ingredient_id);

COMMENT ON TABLE public.gm_equipment_ingredients IS 'Mapa de ingredientes armazenados por equipamento. Ex: Congelador 1 → Massa Pizza, Queijo.';
COMMENT ON COLUMN public.gm_equipment.description IS 'Descrição/propósito do equipamento.';
COMMENT ON COLUMN public.gm_equipment.category IS 'Categoria funcional: COOKING, STORAGE, PREPARATION, BEVERAGE, CLEANING, SERVICE, SYSTEM.';
COMMENT ON COLUMN public.gm_equipment.ideal_temp_min IS 'Temperatura ideal mínima em °C (ex: -18 para congelador).';
COMMENT ON COLUMN public.gm_equipment.ideal_temp_max IS 'Temperatura ideal máxima em °C (ex: 4 para geladeira).';
COMMENT ON COLUMN public.gm_equipment.brand IS 'Marca do equipamento.';
COMMENT ON COLUMN public.gm_equipment.model IS 'Modelo do equipamento.';

-- 5. Backfill category para equipamentos existentes (baseado no kind)
UPDATE public.gm_equipment SET category = CASE
  WHEN kind IN ('FRIDGE','FREEZER','WALK_IN_COOLER','WALK_IN_FREEZER','WINE_COOLER','SHELF','DRY_STORAGE','SPICE_RACK','CONTAINER') THEN 'STORAGE'
  WHEN kind IN ('OVEN','CONVECTION_OVEN','PIZZA_OVEN','GRILL','CHARCOAL_GRILL','PLANCHA','FRYER','DEEP_FRYER','STEAM_OVEN','COMBI_OVEN','SALAMANDER','INDUCTION_COOKER','GAS_RANGE','WOK_BURNER') THEN 'COOKING'
  WHEN kind IN ('COFFEE_MACHINE','ESPRESSO_MACHINE','ICE_MACHINE','KEG_SYSTEM','DRAFT_TOWER','BLENDER','JUICER','SODA_FOUNTAIN') THEN 'BEVERAGE'
  WHEN kind IN ('FOOD_PROCESSOR','MIXER','SLICER','VACUUM_SEALER','SOUS_VIDE','DOUGH_SHEETER','MEAT_GRINDER','SCALE') THEN 'PREPARATION'
  WHEN kind IN ('DISHWASHER','GLASS_WASHER','SINK') THEN 'CLEANING'
  WHEN kind IN ('WARMING_STATION','BAIN_MARIE','HOT_PLATE','DISPLAY_CASE','PASS_WINDOW') THEN 'SERVICE'
  WHEN kind IN ('TPV','KDS','PRINTER','TABLET') THEN 'SYSTEM'
  ELSE 'OTHER'
END
WHERE category IS NULL;

-- 6. Backfill temperaturas para equipamentos de armazenamento
UPDATE public.gm_equipment SET ideal_temp_min = -22, ideal_temp_max = -16
  WHERE kind IN ('FREEZER','WALK_IN_FREEZER') AND ideal_temp_min IS NULL;
UPDATE public.gm_equipment SET ideal_temp_min = 1, ideal_temp_max = 5
  WHERE kind IN ('FRIDGE','WALK_IN_COOLER') AND ideal_temp_min IS NULL;
UPDATE public.gm_equipment SET ideal_temp_min = 8, ideal_temp_max = 14
  WHERE kind = 'WINE_COOLER' AND ideal_temp_min IS NULL;

COMMIT;
