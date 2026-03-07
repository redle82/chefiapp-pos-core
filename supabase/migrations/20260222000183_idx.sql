CREATE INDEX IF NOT EXISTS idx_tasks_station_priority ON public.gm_tasks USING btree (station, priority) WHERE (status = 'OPEN'::text);
