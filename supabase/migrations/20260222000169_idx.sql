CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.gm_orders USING btree (table_id) WHERE (table_id IS NOT NULL);
