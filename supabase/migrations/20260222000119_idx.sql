CREATE UNIQUE INDEX IF NOT EXISTS event_store_stream_type_stream_id_stream_version_key ON public.event_store USING btree (stream_type, stream_id, stream_version);
