CREATE INDEX IF NOT EXISTS idx_stock_low ON public.gm_stock_levels USING btree (restaurant_id, location_id) WHERE ((qty <= min_qty) AND (min_qty > (0)::numeric));
