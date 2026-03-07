CREATE TABLE IF NOT EXISTS public.gm_stock_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  location_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  qty numeric NOT NULL DEFAULT 0,
  min_qty numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
