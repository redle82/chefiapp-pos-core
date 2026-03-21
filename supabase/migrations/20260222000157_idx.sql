CREATE INDEX IF NOT EXISTS idx_ledger_restaurant_time ON public.gm_stock_ledger USING btree (restaurant_id, created_at DESC);
