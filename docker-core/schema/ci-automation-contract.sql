-- =============================================================================
-- ci-automation-contract.sql
-- Minimal schema for automation dispatch CI contract test.
-- Only what gm_automation_events depends on — no full stack required.
-- =============================================================================

-- Foundation: tenants reference (nullable FK in gm_restaurants)
CREATE TABLE IF NOT EXISTS public.saas_tenants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    slug       TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Core entity: restaurants (FK target for automation events)
CREATE TABLE IF NOT EXISTS public.gm_restaurants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID REFERENCES public.saas_tenants(id),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE,
    description TEXT,
    owner_id    UUID,
    status      TEXT NOT NULL DEFAULT 'draft',
    logo_url    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Automation events table (copy of the actual migration — kept in sync)
CREATE TABLE IF NOT EXISTS public.gm_automation_events (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id      UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    trigger            TEXT NOT NULL,
    score              NUMERIC(10,2) NOT NULL DEFAULT 0,
    classification     TEXT NOT NULL,
    recommended_action JSONB NOT NULL DEFAULT '{}'::JSONB,
    payload_json       JSONB NOT NULL DEFAULT '{}'::JSONB,
    idempotency_key    VARCHAR(128) NOT NULL,
    status             TEXT NOT NULL DEFAULT 'queued',
    channel            TEXT NOT NULL DEFAULT 'internal_dispatch',
    attempt_count      INTEGER NOT NULL DEFAULT 0,
    last_error         TEXT,
    dispatched_at      TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_gm_automation_events_status
      CHECK (status IN ('queued', 'sent', 'failed')),
    CONSTRAINT chk_gm_automation_events_trigger
      CHECK (trigger IN ('activation_velocity_low', 'churn_risk')),
    CONSTRAINT chk_gm_automation_events_idempotency_key
      CHECK (idempotency_key ~ '^[a-zA-Z0-9:_-]{8,128}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gm_automation_events_idempotency
  ON public.gm_automation_events(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_gm_automation_events_restaurant_created
  ON public.gm_automation_events(restaurant_id, created_at DESC);
