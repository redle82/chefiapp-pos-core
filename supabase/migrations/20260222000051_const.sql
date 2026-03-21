ALTER TABLE public.gm_locations ADD CONSTRAINT gm_locations_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
