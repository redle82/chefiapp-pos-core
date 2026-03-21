CREATE INDEX IF NOT EXISTS idx_order_items_author ON public.gm_order_items USING btree (order_id, created_by_user_id, created_by_role);
