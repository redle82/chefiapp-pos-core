CREATE INDEX IF NOT EXISTS idx_stock_location ON public.gm_stock_levels USING btree (location_id);
