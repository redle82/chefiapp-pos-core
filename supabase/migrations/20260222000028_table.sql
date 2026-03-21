CREATE TABLE IF NOT EXISTS public.module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  module_id character varying NOT NULL,
  role character varying NOT NULL,
  permissions text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
