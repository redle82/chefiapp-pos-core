CREATE TABLE IF NOT EXISTS public.gm_stock_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  location_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  order_id uuid,
  order_item_id uuid,
  action text NOT NULL,
  qty numeric NOT NULL,
  reason text,
  created_by_role text,
  created_by_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
