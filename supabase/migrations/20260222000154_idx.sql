CREATE INDEX IF NOT EXISTS idx_ledger_ingredient ON public.gm_stock_ledger USING btree (ingredient_id);
