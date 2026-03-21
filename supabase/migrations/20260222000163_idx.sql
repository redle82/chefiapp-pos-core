CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_order_per_table ON public.gm_orders USING btree (table_id) WHERE ((status = 'OPEN'::text) AND (table_id IS NOT NULL));
