ALTER TABLE public.gm_terminals ADD CONSTRAINT gm_terminals_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
