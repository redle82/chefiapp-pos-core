CREATE INDEX IF NOT EXISTS idx_tasks_restaurant_status ON public.gm_tasks USING btree (restaurant_id, status);
