ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
