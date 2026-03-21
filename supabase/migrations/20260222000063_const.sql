ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_status_check CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]));
