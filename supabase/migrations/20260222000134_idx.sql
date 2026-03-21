CREATE INDEX IF NOT EXISTS idx_event_store_stream ON public.event_store USING btree (stream_type, stream_id);
