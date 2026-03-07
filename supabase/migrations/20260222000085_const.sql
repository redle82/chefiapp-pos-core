ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
