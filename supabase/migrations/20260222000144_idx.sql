CREATE INDEX IF NOT EXISTS idx_gm_payments_provider ON public.gm_payments USING btree (payment_provider, created_at DESC) WHERE (payment_provider IS NOT NULL);
