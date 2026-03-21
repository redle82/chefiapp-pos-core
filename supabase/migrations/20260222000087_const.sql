ALTER TABLE public.gm_stock_levels ADD CONSTRAINT gm_stock_levels_location_id_fkey FOREIGN KEY (location_id) REFERENCES gm_locations(id) ON DELETE CASCADE;
