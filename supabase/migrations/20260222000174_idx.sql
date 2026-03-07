CREATE INDEX IF NOT EXISTS idx_stock_ingredient ON public.gm_stock_levels USING btree (ingredient_id);
