ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_provider_check CHECK (provider = ANY (ARRAY['stripe'::text, 'sumup'::text, 'pix'::text, 'custom'::text]));
