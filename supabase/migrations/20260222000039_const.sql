ALTER TABLE public.gm_cash_registers ADD CONSTRAINT gm_cash_registers_status_check CHECK (status = ANY (ARRAY['open'::text, 'closed'::text]));
