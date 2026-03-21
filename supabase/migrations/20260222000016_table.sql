CREATE TABLE IF NOT EXISTS public.gm_product_bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  qty_per_unit numeric NOT NULL,
  station text NOT NULL,
  preferred_location_kind text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
