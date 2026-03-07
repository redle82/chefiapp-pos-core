ALTER TABLE public.billing_configs ADD CONSTRAINT billing_configs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
