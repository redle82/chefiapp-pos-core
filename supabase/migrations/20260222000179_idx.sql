CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.gm_tasks USING btree (created_at DESC) WHERE (status = 'OPEN'::text);
