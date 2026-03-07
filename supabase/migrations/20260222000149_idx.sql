CREATE INDEX IF NOT EXISTS idx_gm_terminals_restaurant_type ON public.gm_terminals USING btree (restaurant_id, type);
