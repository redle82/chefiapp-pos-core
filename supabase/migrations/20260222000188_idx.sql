CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_id_key ON public.webhook_events USING btree (provider, event_id);
