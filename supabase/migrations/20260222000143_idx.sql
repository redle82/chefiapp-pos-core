CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_payments_idempotency ON public.gm_payments USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);
