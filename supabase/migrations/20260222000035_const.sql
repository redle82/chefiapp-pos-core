ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_restaurant_id_provider_key UNIQUE (restaurant_id, provider);
