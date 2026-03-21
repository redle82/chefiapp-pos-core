CREATE TABLE IF NOT EXISTS public.event_store (
  sequence_id bigint NOT NULL DEFAULT nextval('event_store_sequence_id_seq'::regclass),
  event_id uuid NOT NULL,
  stream_type text NOT NULL,
  stream_id text NOT NULL,
  stream_version integer NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  idempotency_key text
);
