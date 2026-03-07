ALTER TABLE public.webhook_events ADD CONSTRAINT webhook_events_provider_event_id_key UNIQUE (provider, event_id);
