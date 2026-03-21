CREATE INDEX IF NOT EXISTS idx_order_items_device ON public.gm_order_items USING btree (device_id) WHERE (device_id IS NOT NULL);
