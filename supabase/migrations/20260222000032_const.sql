ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_currency_check CHECK (currency = ANY (ARRAY['EUR'::text, 'USD'::text, 'BRL'::text]));
