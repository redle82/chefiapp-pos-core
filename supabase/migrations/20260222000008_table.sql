CREATE TABLE IF NOT EXISTS public.gm_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  location_id uuid,
  name text NOT NULL,
  kind text NOT NULL,
  capacity_note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
