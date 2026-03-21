CREATE OR REPLACE FUNCTION public.simulate_order_stock_impact(p_restaurant_id uuid, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  WITH req AS (
    SELECT
      (i->>'product_id')::UUID AS product_id,
      COALESCE((i->>'quantity')::INT, 1) AS qty
    FROM jsonb_array_elements(p_items) i
  ),
  needed AS (
    SELECT
      b.ingredient_id,
      b.station,
      SUM(b.qty_per_unit * r.qty) AS needed_qty
    FROM req r
    JOIN public.gm_product_bom b
      ON b.product_id = r.product_id AND b.restaurant_id = p_restaurant_id
    GROUP BY b.ingredient_id, b.station
  ),
  stock AS (
    SELECT
      sl.ingredient_id,
      SUM(sl.qty) AS available_qty,
      SUM(sl.min_qty) AS min_total
    FROM public.gm_stock_levels sl
    WHERE sl.restaurant_id = p_restaurant_id
    GROUP BY sl.ingredient_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'ingredient_id', n.ingredient_id,
    'needed_qty', n.needed_qty,
    'available_qty', COALESCE(s.available_qty, 0),
    'will_be', COALESCE(s.available_qty, 0) - n.needed_qty,
    'below_min', (COALESCE(s.available_qty, 0) - n.needed_qty) < COALESCE(s.min_total, 0),
    'station', n.station
  ))
  INTO v_result
  FROM needed n
  LEFT JOIN stock s ON s.ingredient_id = n.ingredient_id;
  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$function$;
