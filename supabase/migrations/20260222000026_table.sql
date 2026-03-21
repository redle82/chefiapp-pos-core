CREATE TABLE IF NOT EXISTS public.installed_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  module_id character varying NOT NULL,
  module_name character varying NOT NULL,
  version character varying DEFAULT '1.0.0'::character varying,
  installed_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'active'::character varying,
  config jsonb DEFAULT '{}'::jsonb,
  dependencies text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb
);
