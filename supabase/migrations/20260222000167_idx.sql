CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.gm_orders USING btree (created_at DESC);
