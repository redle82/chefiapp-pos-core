CREATE INDEX IF NOT EXISTS idx_stock_restaurant ON public.gm_stock_levels USING btree (restaurant_id);
