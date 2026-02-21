-- =============================================================================
-- STOCK BRAIN ENGINE — Phase 1: Ingredient Presets + Import RPC
-- =============================================================================
-- Date: 2026-02-19
-- Purpose:
--   1. Create gm_ingredient_presets table with curated ingredient packs
--      for quick restaurant onboarding.
--   2. Seed BAR_RESTAURANT pack with ~30 common ingredients.
--   3. RPC import_ingredient_pack() for one-click import.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Presets table (system-wide, not per restaurant)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gm_ingredient_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_unit TEXT NOT NULL CHECK (base_unit IN ('g','kg','ml','l','unit')),
  purchase_unit TEXT,
  conversion_factor NUMERIC NOT NULL DEFAULT 1,
  perishable BOOLEAN NOT NULL DEFAULT false,
  shelf_life_days INTEGER,
  UNIQUE (pack, name)
);

COMMENT ON TABLE public.gm_ingredient_presets IS
'Packs pré-definidos de ingredientes para importação rápida no onboarding.';

-- =============================================================================
-- 2. Seed: BAR_RESTAURANT pack
-- =============================================================================

INSERT INTO public.gm_ingredient_presets (pack, name, category, base_unit, purchase_unit, conversion_factor, perishable, shelf_life_days)
VALUES
  -- Hortaliças
  ('BAR_RESTAURANT', 'Tomate',     'HORTALIÇA', 'kg', 'caixa',   5,  true,  7),
  ('BAR_RESTAURANT', 'Cebola',     'HORTALIÇA', 'kg', 'saco',   10,  true, 14),
  ('BAR_RESTAURANT', 'Alho',       'HORTALIÇA', 'kg', 'kg',      1,  true, 30),
  ('BAR_RESTAURANT', 'Batata',     'HORTALIÇA', 'kg', 'saco',   20,  true, 21),
  ('BAR_RESTAURANT', 'Limão',      'HORTALIÇA', 'kg', 'kg',      1,  true, 14),
  ('BAR_RESTAURANT', 'Alface',     'HORTALIÇA', 'unit', 'unidade', 1, true,  5),
  ('BAR_RESTAURANT', 'Pimento',    'HORTALIÇA', 'kg', 'kg',      1,  true,  7),
  ('BAR_RESTAURANT', 'Cenoura',    'HORTALIÇA', 'kg', 'saco',    5,  true, 14),

  -- Proteínas
  ('BAR_RESTAURANT', 'Frango',        'PROTEÍNA', 'kg', 'kg',      1, true,  3),
  ('BAR_RESTAURANT', 'Carne bovina',  'PROTEÍNA', 'kg', 'kg',      1, true,  3),
  ('BAR_RESTAURANT', 'Bacon',         'PROTEÍNA', 'kg', 'kg',      1, true,  7),
  ('BAR_RESTAURANT', 'Salmão',        'PROTEÍNA', 'kg', 'kg',      1, true,  2),
  ('BAR_RESTAURANT', 'Camarão',       'PROTEÍNA', 'kg', 'kg',      1, true,  2),
  ('BAR_RESTAURANT', 'Ovo',           'PROTEÍNA', 'unit', 'caixa', 30, true, 21),

  -- Laticínios
  ('BAR_RESTAURANT', 'Queijo mozzarella', 'LATICÍNIO', 'kg', 'kg',      1, true,  14),
  ('BAR_RESTAURANT', 'Natas',             'LATICÍNIO', 'l',  'litro',   1, true,   5),
  ('BAR_RESTAURANT', 'Manteiga',          'LATICÍNIO', 'kg', 'kg',      1, true,  30),
  ('BAR_RESTAURANT', 'Leite',             'LATICÍNIO', 'l',  'litro',   1, true,   5),

  -- Secos
  ('BAR_RESTAURANT', 'Farinha de trigo', 'SECO', 'kg', 'saco',  25, false, 180),
  ('BAR_RESTAURANT', 'Açúcar',          'SECO', 'kg', 'saco',  25, false, 365),
  ('BAR_RESTAURANT', 'Sal',             'SECO', 'kg', 'saco',  25, false, 365),
  ('BAR_RESTAURANT', 'Arroz',           'SECO', 'kg', 'saco',  25, false, 365),
  ('BAR_RESTAURANT', 'Massa',           'SECO', 'kg', 'pacote', 1, false, 365),
  ('BAR_RESTAURANT', 'Azeite',          'SECO', 'l',  'garrafa', 1, false, 365),

  -- Condimentos
  ('BAR_RESTAURANT', 'Pimenta preta',   'CONDIMENTO', 'g',  'frasco', 100, false, 365),
  ('BAR_RESTAURANT', 'Orégãos',         'CONDIMENTO', 'g',  'frasco', 50,  false, 365),

  -- Bebidas (Bar)
  ('BAR_RESTAURANT', 'Vodka',        'BEBIDA', 'l', 'garrafa', 1,   false, 730),
  ('BAR_RESTAURANT', 'Gin',          'BEBIDA', 'l', 'garrafa', 1,   false, 730),
  ('BAR_RESTAURANT', 'Rum',          'BEBIDA', 'l', 'garrafa', 1,   false, 730),
  ('BAR_RESTAURANT', 'Cerveja',      'BEBIDA', 'l', 'barril',  30,  false, 90),
  ('BAR_RESTAURANT', 'Refrigerante', 'BEBIDA', 'l', 'pack',    6,   false, 180),
  ('BAR_RESTAURANT', 'Vinho tinto',  'BEBIDA', 'l', 'garrafa', 0.75, false, 730),
  ('BAR_RESTAURANT', 'Água mineral', 'BEBIDA', 'l', 'pack',    6,   false, 365)
ON CONFLICT (pack, name) DO NOTHING;

-- =============================================================================
-- 3. Seed: PIZZERIA pack (extends BAR_RESTAURANT with pizza-specific)
-- =============================================================================

INSERT INTO public.gm_ingredient_presets (pack, name, category, base_unit, purchase_unit, conversion_factor, perishable, shelf_life_days)
VALUES
  ('PIZZERIA', 'Tomate',              'HORTALIÇA', 'kg', 'caixa',    5,  true,  7),
  ('PIZZERIA', 'Cebola',              'HORTALIÇA', 'kg', 'saco',    10,  true, 14),
  ('PIZZERIA', 'Alho',                'HORTALIÇA', 'kg', 'kg',       1,  true, 30),
  ('PIZZERIA', 'Cogumelos',           'HORTALIÇA', 'kg', 'kg',       1,  true,  5),
  ('PIZZERIA', 'Rúcula',              'HORTALIÇA', 'kg', 'kg',       1,  true,  3),
  ('PIZZERIA', 'Azeitonas',           'HORTALIÇA', 'kg', 'frasco',   1,  false, 365),
  ('PIZZERIA', 'Queijo mozzarella',   'LATICÍNIO', 'kg', 'kg',       1,  true, 14),
  ('PIZZERIA', 'Queijo parmesão',     'LATICÍNIO', 'kg', 'kg',       1,  true, 30),
  ('PIZZERIA', 'Presunto',            'PROTEÍNA',  'kg', 'kg',       1,  true,  7),
  ('PIZZERIA', 'Salame',              'PROTEÍNA',  'kg', 'kg',       1,  true, 14),
  ('PIZZERIA', 'Bacon',               'PROTEÍNA',  'kg', 'kg',       1,  true,  7),
  ('PIZZERIA', 'Farinha de trigo',    'SECO',      'kg', 'saco',    25,  false, 180),
  ('PIZZERIA', 'Farinha tipo 00',     'SECO',      'kg', 'saco',    25,  false, 180),
  ('PIZZERIA', 'Fermento',            'SECO',      'kg', 'pacote',   1,  true,  30),
  ('PIZZERIA', 'Azeite',              'SECO',      'l',  'garrafa',  1,  false, 365),
  ('PIZZERIA', 'Molho de tomate',     'CONDIMENTO','l',  'lata',     5,  false, 365),
  ('PIZZERIA', 'Orégãos',             'CONDIMENTO','g',  'frasco',  50,  false, 365),
  ('PIZZERIA', 'Manjericão',          'CONDIMENTO','g',  'frasco',  30,  true,   5)
ON CONFLICT (pack, name) DO NOTHING;

-- =============================================================================
-- 4. Seed: CAFE pack
-- =============================================================================

INSERT INTO public.gm_ingredient_presets (pack, name, category, base_unit, purchase_unit, conversion_factor, perishable, shelf_life_days)
VALUES
  ('CAFE', 'Café em grão',      'BEBIDA',    'kg', 'saco',    1,   false, 180),
  ('CAFE', 'Leite',             'LATICÍNIO', 'l',  'litro',   1,   true,   5),
  ('CAFE', 'Natas',             'LATICÍNIO', 'l',  'litro',   1,   true,   5),
  ('CAFE', 'Açúcar',            'SECO',      'kg', 'saco',   25,   false, 365),
  ('CAFE', 'Chocolate em pó',   'SECO',      'kg', 'caixa',   1,   false, 180),
  ('CAFE', 'Chá (sortido)',     'BEBIDA',    'unit','caixa', 100,   false, 365),
  ('CAFE', 'Croissant',         'SECO',      'unit','caixa',  20,   true,   2),
  ('CAFE', 'Pão de queijo',     'SECO',      'unit','pacote', 30,   true,   3),
  ('CAFE', 'Manteiga',          'LATICÍNIO', 'kg', 'kg',      1,   true,  30),
  ('CAFE', 'Compota',           'CONDIMENTO','g',  'frasco', 300,   false, 365)
ON CONFLICT (pack, name) DO NOTHING;

-- =============================================================================
-- 5. RPC: Import ingredient pack into restaurant
-- =============================================================================

CREATE OR REPLACE FUNCTION public.import_ingredient_pack(
  p_restaurant_id UUID,
  p_pack TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_preset RECORD;
  v_imported INTEGER := 0;
  v_skipped INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  -- Validate pack exists
  SELECT COUNT(*) INTO v_total
  FROM public.gm_ingredient_presets
  WHERE pack = p_pack;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'PACK_NOT_FOUND: Pack "%" does not exist', p_pack;
  END IF;

  FOR v_preset IN
    SELECT name, category, base_unit, purchase_unit,
           conversion_factor, perishable, shelf_life_days
    FROM public.gm_ingredient_presets
    WHERE pack = p_pack
    ORDER BY category, name
  LOOP
    BEGIN
      INSERT INTO public.gm_ingredients (
        restaurant_id, name, unit, category, purchase_unit,
        conversion_factor, perishable, shelf_life_days
      )
      VALUES (
        p_restaurant_id, v_preset.name, v_preset.base_unit, v_preset.category,
        v_preset.purchase_unit, v_preset.conversion_factor,
        v_preset.perishable, v_preset.shelf_life_days
      );
      v_imported := v_imported + 1;
    EXCEPTION WHEN unique_violation THEN
      -- Ingredient already exists for this restaurant, skip
      v_skipped := v_skipped + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'pack', p_pack,
    'imported', v_imported,
    'skipped', v_skipped,
    'total_in_pack', v_total
  );
END;
$$;

COMMENT ON FUNCTION public.import_ingredient_pack IS
'Importa um pack pré-definido de ingredientes para o restaurante. Ingredientes duplicados são ignorados.';

-- =============================================================================
-- 6. RPC: List available packs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.list_ingredient_packs()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSONB := '[]'::JSONB;
  v_pack RECORD;
BEGIN
  FOR v_pack IN
    SELECT pack, COUNT(*) AS count
    FROM public.gm_ingredient_presets
    GROUP BY pack
    ORDER BY pack
  LOOP
    v_result := v_result || jsonb_build_object(
      'pack', v_pack.pack,
      'count', v_pack.count
    );
  END LOOP;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.list_ingredient_packs IS
'Lista os packs de ingredientes disponíveis para importação.';

-- Grant permissions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    GRANT EXECUTE ON FUNCTION public.import_ingredient_pack TO postgres;
    GRANT EXECUTE ON FUNCTION public.list_ingredient_packs TO postgres;
  END IF;
END;
$$;

COMMIT;
