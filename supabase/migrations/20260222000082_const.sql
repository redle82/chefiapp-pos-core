ALTER TABLE public.gm_stock_ledger ADD CONSTRAINT gm_stock_ledger_location_id_fkey FOREIGN KEY (location_id) REFERENCES gm_locations(id) ON DELETE CASCADE;
