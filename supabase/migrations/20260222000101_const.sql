ALTER TABLE public.gm_terminals ADD CONSTRAINT gm_terminals_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'revoked'::text]));
