ALTER TABLE public.event_store ADD CONSTRAINT event_store_stream_type_stream_id_stream_version_key UNIQUE (stream_type, stream_id, stream_version);
