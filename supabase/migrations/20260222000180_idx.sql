CREATE INDEX IF NOT EXISTS idx_tasks_order ON public.gm_tasks USING btree (order_id) WHERE (status = 'OPEN'::text);
