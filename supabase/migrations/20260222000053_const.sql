ALTER TABLE public.gm_menu_categories ADD CONSTRAINT gm_menu_categories_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
