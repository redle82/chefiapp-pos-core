ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_status_check CHECK (status = ANY (ARRAY['OPEN'::text, 'ACKNOWLEDGED'::text, 'RESOLVED'::text, 'DISMISSED'::text]));
