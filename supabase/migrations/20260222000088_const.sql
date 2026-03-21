ALTER TABLE public.gm_stock_levels ADD CONSTRAINT gm_stock_levels_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
