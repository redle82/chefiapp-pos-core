CREATE TABLE IF NOT EXISTS public.legal_seals (
  seal_id text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  legal_state text NOT NULL,
  seal_event_id uuid NOT NULL,
  stream_hash text NOT NULL,
  financial_state_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  sealed_at timestamp with time zone NOT NULL DEFAULT now(),
  legal_sequence_id integer NOT NULL DEFAULT nextval('legal_seals_legal_sequence_id_seq'::regclass)
);
