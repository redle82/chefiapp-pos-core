-- 20260128_event_store_and_legal_seals.sql
-- Tabelas do Core Engine (Event Sourcing) e Legal Boundary (Seals).
-- Necessário para Gate 4 (PostgresEventStore, PostgresLegalSealStore, CoreTransactionManager).
-- Referência: core-engine/persistence/PostgresEventStore, legal-boundary/persistence/PostgresLegalSealStore.
-- NOTA: Remove tabelas antigas se existirem com schema incompatível (ex.: sem stream_type / financial_state_snapshot).

-- =============================================================================
-- 0. Limpar versões antigas (schema incompatível)
-- =============================================================================
DROP TABLE IF EXISTS public.legal_seals CASCADE;
DROP TABLE IF EXISTS public.event_store CASCADE;

-- =============================================================================
-- 1. event_store (Event Sourcing - Concurrency + Idempotency)
-- =============================================================================
CREATE TABLE public.event_store (
    sequence_id   BIGSERIAL,
    event_id     UUID NOT NULL,
    stream_type  TEXT NOT NULL,
    stream_id    TEXT NOT NULL,
    stream_version INTEGER NOT NULL,
    event_type   TEXT NOT NULL,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    meta         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idempotency_key TEXT,

    PRIMARY KEY (event_id),
    UNIQUE (stream_type, stream_id, stream_version)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_idempotency
  ON public.event_store (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_store_stream
  ON public.event_store (stream_type, stream_id);

COMMENT ON TABLE public.event_store IS 'Event Sourcing store. stream_id in code = stream_type:stream_id. Optimistic concurrency via (stream_type, stream_id, stream_version).';

-- =============================================================================
-- 2. legal_seals (Legal Boundary - Seal state per entity)
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS public.legal_seals_legal_sequence_id_seq;

CREATE TABLE public.legal_seals (
    seal_id       TEXT NOT NULL,
    entity_type   TEXT NOT NULL,
    entity_id     TEXT NOT NULL,
    legal_state   TEXT NOT NULL,
    seal_event_id UUID NOT NULL,
    stream_hash   TEXT NOT NULL,
    financial_state_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    sealed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    legal_sequence_id INTEGER NOT NULL DEFAULT nextval('public.legal_seals_legal_sequence_id_seq'::regclass),

    PRIMARY KEY (seal_id),
    UNIQUE (entity_type, entity_id, legal_state)
);

CREATE INDEX IF NOT EXISTS idx_legal_seals_entity
  ON public.legal_seals (entity_type, entity_id);

COMMENT ON TABLE public.legal_seals IS 'Legal seals per entity. One row per (entity_type, entity_id, legal_state). Used by CoreTransactionManager appendAndSeal.';

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT ALL ON public.event_store TO postgres;
GRANT USAGE, SELECT ON SEQUENCE public.event_store_sequence_id_seq TO postgres;
GRANT ALL ON public.legal_seals TO postgres;
GRANT USAGE, SELECT ON SEQUENCE public.legal_seals_legal_sequence_id_seq TO postgres;
