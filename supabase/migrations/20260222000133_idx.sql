CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_idempotency ON public.event_store USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);
