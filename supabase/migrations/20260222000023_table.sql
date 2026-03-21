CREATE TABLE IF NOT EXISTS public.gm_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  number integer NOT NULL,
  qr_code text,
  status text DEFAULT 'closed'::text,
  created_at timestamp with time zone DEFAULT now()
);
