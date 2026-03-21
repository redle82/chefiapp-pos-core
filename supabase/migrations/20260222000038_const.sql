ALTER TABLE public.gm_cash_registers ADD CONSTRAINT gm_cash_registers_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
