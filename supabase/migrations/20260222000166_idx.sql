CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.gm_order_items USING btree (order_id);
