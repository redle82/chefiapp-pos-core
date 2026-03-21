CREATE INDEX IF NOT EXISTS idx_payment_audit_restaurant_date ON public.gm_payment_audit_logs USING btree (restaurant_id, created_at);
