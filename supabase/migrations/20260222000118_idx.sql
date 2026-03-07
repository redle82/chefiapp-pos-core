CREATE UNIQUE INDEX IF NOT EXISTS billing_configs_restaurant_id_provider_key ON public.billing_configs USING btree (restaurant_id, provider);
