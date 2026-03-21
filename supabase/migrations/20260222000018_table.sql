CREATE TABLE IF NOT EXISTS public.gm_restaurant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  user_id uuid NOT NULL,
  role text DEFAULT 'staff'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
