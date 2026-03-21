CREATE INDEX IF NOT EXISTS idx_gm_payments_external_checkout ON public.gm_payments USING btree (external_checkout_id) WHERE (external_checkout_id IS NOT NULL);
