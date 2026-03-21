CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON public.gm_orders USING btree (restaurant_id, status);
