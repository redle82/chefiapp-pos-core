CREATE TABLE IF NOT EXISTS public.billing_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  provider text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR'::text,
  enabled boolean NOT NULL DEFAULT false,
  credentials_ref text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
