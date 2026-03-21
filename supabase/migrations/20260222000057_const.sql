ALTER TABLE public.gm_orders ADD CONSTRAINT gm_orders_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
