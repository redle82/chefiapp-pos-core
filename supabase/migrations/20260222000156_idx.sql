CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.gm_stock_ledger USING btree (order_id) WHERE (order_id IS NOT NULL);
