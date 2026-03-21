ALTER TABLE public.gm_catalog_menus ADD CONSTRAINT gm_catalog_menus_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
