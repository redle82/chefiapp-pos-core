CREATE TABLE IF NOT EXISTS public.gm_restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  name text NOT NULL,
  slug text,
  description text,
  owner_id uuid,
  status text NOT NULL DEFAULT 'draft'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  billing_status text DEFAULT 'trial'::text,
  product_mode text NOT NULL DEFAULT 'demo'::text,
  onboarding_completed_at timestamp with time zone,
  menu_catalog_enabled boolean NOT NULL DEFAULT false
);
