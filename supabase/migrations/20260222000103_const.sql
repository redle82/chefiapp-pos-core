ALTER TABLE public.installed_modules ADD CONSTRAINT installed_modules_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
