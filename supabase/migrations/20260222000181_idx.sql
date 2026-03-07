CREATE INDEX IF NOT EXISTS idx_tasks_order_item ON public.gm_tasks USING btree (order_item_id) WHERE (status = 'OPEN'::text);
