ALTER TABLE public.shift_logs ADD CONSTRAINT shift_logs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
