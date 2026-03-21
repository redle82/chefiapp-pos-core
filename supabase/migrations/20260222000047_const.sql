ALTER TABLE public.gm_ingredients ADD CONSTRAINT gm_ingredients_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
