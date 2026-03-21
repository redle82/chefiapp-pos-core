ALTER TABLE public.gm_tables ADD CONSTRAINT gm_tables_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
