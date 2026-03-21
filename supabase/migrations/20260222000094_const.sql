ALTER TABLE public.gm_tasks ADD CONSTRAINT gm_tasks_priority_check CHECK (priority = ANY (ARRAY['LOW'::text, 'MEDIA'::text, 'ALTA'::text, 'CRITICA'::text]));
