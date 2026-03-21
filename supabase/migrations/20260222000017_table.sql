CREATE TABLE IF NOT EXISTS public.gm_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  category_id uuid,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  photo_url text,
  available boolean DEFAULT true,
  track_stock boolean DEFAULT false,
  stock_quantity numeric DEFAULT 0,
  cost_price_cents integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  prep_time_seconds integer DEFAULT 300,
  prep_category text DEFAULT 'main'::text,
  station text DEFAULT 'KITCHEN'::text
);
