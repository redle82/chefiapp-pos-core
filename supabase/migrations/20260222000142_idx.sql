CREATE INDEX IF NOT EXISTS idx_gm_payments_external_payment ON public.gm_payments USING btree (external_payment_id) WHERE (external_payment_id IS NOT NULL);
