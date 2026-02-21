-- =============================================================================
-- STOCK BRAIN ENGINE — Phase 1: Ingredient Intelligence
-- =============================================================================
-- Date: 2026-02-19
-- Purpose:
--   1. Enrich gm_ingredients with category, purchase_unit, conversion,
--      perishability, barcode, supplier_code, and cost_per_unit.
--   2. Add cost columns to gm_stock_ledger for full cost traceability.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Enrich gm_ingredients
-- =============================================================================

-- Category: what kind of ingredient is this?
ALTER TABLE public.gm_ingredients
  ADD COLUMN IF NOT EXISTS category TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_ingredient_category'
  ) THEN
    ALTER TABLE public.gm_ingredients
      ADD CONSTRAINT chk_ingredient_category
      CHECK (category IS NULL OR category IN (
        'HORTALIÇA','PROTEÍNA','SECO','LATICÍNIO','BEBIDA',
        'CONDIMENTO','CONGELADO','OUTRO'
      ));
  END IF;
END $$;

-- Purchase unit: how it's bought (caixa, saco, garrafa, etc.)
ALTER TABLE public.gm_ingredients
  ADD COLUMN IF NOT EXISTS purchase_unit TEXT;

-- Conversion factor: 1 purchase_unit = X base_units (e.g., 1 caixa = 5 kg)
ALTER TABLE public.gm_ingredients
  ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC NOT NULL DEFAULT 1;

-- Perishability
ALTER TABLE public.gm_ingredients
  ADD COLUMN IF NOT EXISTS perishable BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.gm_ingredients
  ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER;

-- Barcode / Scanner integration
ALTER TABLE public.gm_ingredients
  ADD COLUMN IF NOT EXISTS barcode TEXT;

ALTER TABLE public.gm_ingredients
  ADD COLUMN IF NOT EXISTS supplier_code TEXT;

-- Cost tracking: weighted average cost per base unit
ALTER TABLE public.gm_ingredients
  ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC NOT NULL DEFAULT 0;

-- Barcode index for fast lookup during scanning
CREATE INDEX IF NOT EXISTS idx_ingredients_barcode
  ON public.gm_ingredients(restaurant_id, barcode)
  WHERE barcode IS NOT NULL;

-- Category index for filtering
CREATE INDEX IF NOT EXISTS idx_ingredients_category
  ON public.gm_ingredients(restaurant_id, category)
  WHERE category IS NOT NULL;

COMMENT ON COLUMN public.gm_ingredients.category IS
'Categoria do ingrediente: HORTALIÇA, PROTEÍNA, SECO, LATICÍNIO, BEBIDA, CONDIMENTO, CONGELADO, OUTRO';
COMMENT ON COLUMN public.gm_ingredients.purchase_unit IS
'Unidade de compra (caixa, saco, garrafa, etc.). Diferente da unidade base de medida.';
COMMENT ON COLUMN public.gm_ingredients.conversion_factor IS
'Factor de conversão: 1 purchase_unit = X base_units. Ex: 1 caixa = 5 kg → factor = 5';
COMMENT ON COLUMN public.gm_ingredients.perishable IS
'Se true, ingrediente é perecível e tem shelf_life_days';
COMMENT ON COLUMN public.gm_ingredients.shelf_life_days IS
'Vida útil em dias (relevante apenas para perecíveis)';
COMMENT ON COLUMN public.gm_ingredients.barcode IS
'Código de barras (EAN/UPC) para leitura com scanner';
COMMENT ON COLUMN public.gm_ingredients.supplier_code IS
'Código do fornecedor para este ingrediente';
COMMENT ON COLUMN public.gm_ingredients.cost_per_unit IS
'Custo médio ponderado por unidade base (atualizado automaticamente nas entradas)';

-- =============================================================================
-- 2. Add cost columns to gm_stock_ledger
-- =============================================================================

ALTER TABLE public.gm_stock_ledger
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC;

ALTER TABLE public.gm_stock_ledger
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC;

COMMENT ON COLUMN public.gm_stock_ledger.unit_cost IS
'Custo por unidade no momento do movimento (para IN: custo de compra; para CONSUME/OUT: custo médio)';
COMMENT ON COLUMN public.gm_stock_ledger.total_cost IS
'Custo total do movimento (qty × unit_cost)';

-- =============================================================================
-- 3. RPC: Lookup ingredient by barcode
-- =============================================================================

CREATE OR REPLACE FUNCTION public.lookup_ingredient_by_barcode(
  p_restaurant_id UUID,
  p_barcode TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_ingredient RECORD;
BEGIN
  SELECT id, name, unit, category, cost_per_unit, barcode
  INTO v_ingredient
  FROM public.gm_ingredients
  WHERE restaurant_id = p_restaurant_id
    AND barcode = p_barcode
  LIMIT 1;

  IF v_ingredient IS NULL THEN
    RETURN jsonb_build_object(
      'found', false,
      'barcode', p_barcode
    );
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'barcode', p_barcode,
    'ingredient_id', v_ingredient.id,
    'name', v_ingredient.name,
    'unit', v_ingredient.unit,
    'category', v_ingredient.category,
    'cost_per_unit', v_ingredient.cost_per_unit
  );
END;
$$;

COMMENT ON FUNCTION public.lookup_ingredient_by_barcode IS
'Busca ingrediente por código de barras. Retorna {found: true/false, ...dados}.';

-- =============================================================================
-- 4. RPC: Associate barcode with existing ingredient
-- =============================================================================

CREATE OR REPLACE FUNCTION public.associate_barcode(
  p_ingredient_id UUID,
  p_barcode TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.gm_ingredients
  SET barcode = p_barcode,
      updated_at = NOW()
  WHERE id = p_ingredient_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INGREDIENT_NOT_FOUND: %', p_ingredient_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'ingredient_id', p_ingredient_id,
    'barcode', p_barcode
  );
END;
$$;

COMMENT ON FUNCTION public.associate_barcode IS
'Associa um código de barras a um ingrediente existente.';

-- Grant permissions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
    GRANT EXECUTE ON FUNCTION public.lookup_ingredient_by_barcode TO postgres;
    GRANT EXECUTE ON FUNCTION public.associate_barcode TO postgres;
  END IF;
END;
$$;

COMMIT;
