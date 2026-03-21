ALTER TABLE public.gm_products ADD CONSTRAINT gm_products_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
