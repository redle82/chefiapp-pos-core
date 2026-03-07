ALTER TABLE public.shift_logs ADD CONSTRAINT shift_logs_status_check CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text]));
