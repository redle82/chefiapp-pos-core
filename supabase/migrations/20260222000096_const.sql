ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_station_check CHECK (station = ANY (ARRAY['BAR'::text, 'KITCHEN'::text, 'SERVICE'::text]));
