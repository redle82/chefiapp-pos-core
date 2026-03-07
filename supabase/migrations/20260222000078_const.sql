ALTER TABLE public.gm_staff ADD CONSTRAINT gm_staff_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
