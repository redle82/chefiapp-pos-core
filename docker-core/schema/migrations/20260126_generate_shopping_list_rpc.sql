-- =============================================================================
-- GENERATE SHOPPING LIST RPC
-- =============================================================================
-- Gera lista de compras baseada em estoque abaixo do mínimo.
-- 
-- Lógica:
-- - Identifica ingredientes com qty <= min_qty
-- - Calcula quantidade sugerida: min_qty * 2 - qty (repor até 2x o mínimo)
-- - Agrupa por ingrediente (soma de todos os locais)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_shopping_list(
  p_restaurant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH stock_by_location AS (
    SELECT
      sl.ingredient_id,
      sl.location_id,
      i.name AS ingredient_name,
      i.unit,
      sl.qty,
      sl.min_qty,
      ROW_NUMBER() OVER (PARTITION BY sl.ingredient_id ORDER BY sl.qty ASC, sl.min_qty DESC) AS rn
    FROM public.gm_stock_levels sl
    JOIN public.gm_ingredients i ON i.id = sl.ingredient_id
    WHERE sl.restaurant_id = p_restaurant_id
  ),
  stock_summary AS (
    SELECT
      ingredient_id,
      ingredient_name,
      unit,
      SUM(qty) AS total_qty,
      SUM(min_qty) AS total_min_qty,
      MAX(min_qty) AS max_min_qty,
      -- Pegar location_id do primeiro registro (mais crítico) usando ARRAY_AGG
      (ARRAY_AGG(location_id ORDER BY rn))[1] AS primary_location_id
    FROM stock_by_location
    GROUP BY ingredient_id, ingredient_name, unit
  ),
  low_stock AS (
    SELECT
      ingredient_id,
      ingredient_name,
      unit,
      primary_location_id,
      total_qty,
      total_min_qty,
      max_min_qty,
      total_min_qty - total_qty AS deficit,
      -- Quantidade sugerida: repor até 2x o mínimo (ou 3x se crítico)
      CASE
        WHEN total_qty <= 0 THEN max_min_qty * 3 -- Crítico: repor 3x
        WHEN total_qty < total_min_qty * 0.5 THEN max_min_qty * 2 -- Muito baixo: repor 2x
        ELSE max_min_qty * 2 - total_qty -- Normal: repor até 2x
      END AS suggested_qty,
      CASE
        WHEN total_qty <= 0 THEN 'CRITICAL'
        WHEN total_qty < total_min_qty * 0.5 THEN 'HIGH'
        ELSE 'MEDIUM'
      END AS urgency
    FROM stock_summary
    WHERE total_qty <= total_min_qty -- Apenas abaixo do mínimo
  )
  SELECT jsonb_agg(jsonb_build_object(
    'ingredient_id', ingredient_id,
    'ingredient_name', ingredient_name,
    'unit', unit,
    'location_id', primary_location_id,
    'current_qty', total_qty,
    'min_qty', total_min_qty,
    'suggested_qty', GREATEST(1, ROUND(suggested_qty)), -- Mínimo 1
    'urgency', urgency,
    'deficit', deficit
  ) ORDER BY 
    CASE urgency
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      ELSE 3
    END,
    deficit DESC
  )
  INTO v_result
  FROM low_stock;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

COMMENT ON FUNCTION public.generate_shopping_list IS 
'Gera lista de compras baseada em estoque abaixo do mínimo. Retorna JSONB com ingredientes, quantidades atuais, mínimas e sugeridas para compra.';
