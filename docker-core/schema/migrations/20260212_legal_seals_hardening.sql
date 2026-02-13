-- =============================================================================
-- PHASE 1C — LEGAL SEALS HARDENING
-- =============================================================================
-- Date: 2026-02-12
-- Priority: HIGH (legal boundary integrity)
-- Context: Production legal_seals table is missing constraints and protections
--          that exist in the design schema (schema.sql GATE 3):
--          - No FK to event_store(event_id)
--          - No CHECK constraints on entity_type, legal_state
--          - No forbid_mutation() trigger (added by Phase 0, but confirm here)
--          - seal_id is TEXT (design uses UUID)
--          - financial_state is JSONB (design uses TEXT)
--          - Missing stream_hash NOT EMPTY check
--
-- This migration:
--   1. Adds FK from seal_event_id → event_store(event_id)
--   2. Adds CHECK constraints on entity_type and legal_state
--   3. Adds CHECK on stream_hash not empty
--   4. Ensures forbid_mutation() triggers exist
--   5. Adds is_entity_sealed() utility function
--   6. Adds get_stream_version() utility function
--   7. Additional indexes for audit queries
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: FOREIGN KEY — seal_event_id → event_store
-- =============================================================================
-- Links every legal seal to the event that triggered it.
-- Critical for auditability: seal → event → full event chain.

-- First check if FK already exists to be idempotent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'legal_seals_seal_event_fk'
          AND conrelid = 'public.legal_seals'::regclass
    ) THEN
        ALTER TABLE public.legal_seals
            ADD CONSTRAINT legal_seals_seal_event_fk
            FOREIGN KEY (seal_event_id) REFERENCES public.event_store(event_id);
    END IF;
END;
$$;

-- =============================================================================
-- PART 2: CHECK CONSTRAINTS
-- =============================================================================

-- entity_type must be one of the known entity types
ALTER TABLE public.legal_seals
    DROP CONSTRAINT IF EXISTS legal_seals_entity_type_check;
ALTER TABLE public.legal_seals
    ADD CONSTRAINT legal_seals_entity_type_check
    CHECK (entity_type IN ('ORDER', 'PAYMENT', 'SESSION'));

-- legal_state must be a valid legal state
ALTER TABLE public.legal_seals
    DROP CONSTRAINT IF EXISTS legal_seals_legal_state_check;
ALTER TABLE public.legal_seals
    ADD CONSTRAINT legal_seals_legal_state_check
    CHECK (legal_state IN ('PAYMENT_SEALED', 'ORDER_DECLARED', 'ORDER_FINAL'));

-- stream_hash must not be empty (anti-tamper)
ALTER TABLE public.legal_seals
    DROP CONSTRAINT IF EXISTS legal_seals_stream_hash_not_empty;
ALTER TABLE public.legal_seals
    ADD CONSTRAINT legal_seals_stream_hash_not_empty
    CHECK (stream_hash <> '');

-- =============================================================================
-- PART 3: IMMUTABILITY TRIGGERS (defense-in-depth)
-- =============================================================================
-- forbid_mutation() was deployed in Phase 0.
-- Ensure it exists and is applied to legal_seals.

-- Create if not exists (idempotent with Phase 0)
CREATE OR REPLACE FUNCTION public.forbid_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'IMMUTABLE_TABLE: % operations not allowed on %',
        TG_OP, TG_TABLE_NAME
    USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists on legal_seals
DROP TRIGGER IF EXISTS legal_seals_immutable ON public.legal_seals;
CREATE TRIGGER legal_seals_immutable
    BEFORE UPDATE OR DELETE ON public.legal_seals
    FOR EACH ROW EXECUTE FUNCTION public.forbid_mutation();

-- Ensure trigger exists on event_store (also from Phase 0)
DROP TRIGGER IF EXISTS event_store_immutable ON public.event_store;
CREATE TRIGGER event_store_immutable
    BEFORE UPDATE OR DELETE ON public.event_store
    FOR EACH ROW EXECUTE FUNCTION public.forbid_mutation();

-- =============================================================================
-- PART 4: UTILITY FUNCTIONS
-- =============================================================================

-- is_entity_sealed: Check if an entity has any legal seal
CREATE OR REPLACE FUNCTION public.is_entity_sealed(
    p_entity_type TEXT,
    p_entity_id TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS(
        SELECT 1
        FROM public.legal_seals
        WHERE entity_type = p_entity_type
          AND entity_id = p_entity_id
    );
$$;

COMMENT ON FUNCTION public.is_entity_sealed(TEXT, TEXT) IS
    'Fast check if entity has any legal seal. Used by mutation guards. '
    'Returns TRUE if any seal exists (regardless of legal_state).';

-- is_entity_sealed_at_state: Check if entity is sealed at specific state
CREATE OR REPLACE FUNCTION public.is_entity_sealed_at_state(
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_legal_state TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS(
        SELECT 1
        FROM public.legal_seals
        WHERE entity_type = p_entity_type
          AND entity_id = p_entity_id
          AND legal_state = p_legal_state
    );
$$;

COMMENT ON FUNCTION public.is_entity_sealed_at_state(TEXT, TEXT, TEXT) IS
    'Check if entity is sealed at a specific legal state (e.g., ORDER_FINAL).';

-- get_stream_version: Optimistic concurrency control
CREATE OR REPLACE FUNCTION public.get_stream_version(
    p_stream_type TEXT,
    p_stream_id TEXT
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(MAX(stream_version), 0)
    FROM public.event_store
    WHERE stream_type = p_stream_type
      AND stream_id = p_stream_id;
$$;

COMMENT ON FUNCTION public.get_stream_version(TEXT, TEXT) IS
    'Returns current stream version. 0 if stream does not exist. '
    'Used for optimistic concurrency control.';

-- get_entity_seals: Get all seals for an entity
CREATE OR REPLACE FUNCTION public.get_entity_seals(
    p_entity_type TEXT,
    p_entity_id TEXT
)
RETURNS TABLE (
    seal_id TEXT,
    legal_state TEXT,
    sealed_at TIMESTAMPTZ,
    stream_hash TEXT,
    legal_sequence_id INTEGER
)
LANGUAGE sql
STABLE
AS $$
    SELECT seal_id, legal_state, sealed_at, stream_hash, legal_sequence_id
    FROM public.legal_seals
    WHERE entity_type = p_entity_type
      AND entity_id = p_entity_id
    ORDER BY legal_sequence_id;
$$;

COMMENT ON FUNCTION public.get_entity_seals(TEXT, TEXT) IS
    'Returns all seals for an entity, ordered by sequence. Used by audit mode.';

-- =============================================================================
-- PART 5: CREATE SEAL RPC (Atomic seal creation)
-- =============================================================================
-- Called by the Legal Layer when sealing conditions are met.
-- Computes stream_hash from all events in the entity's stream.

CREATE OR REPLACE FUNCTION public.create_legal_seal(
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_legal_state TEXT,
    p_restaurant_id UUID,
    p_financial_state_snapshot JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seal_id TEXT;
    v_seal_event_id UUID;
    v_stream_hash TEXT;
    v_stream_type TEXT;
    v_next_version INTEGER;
    v_existing_seal TEXT;
BEGIN
    -- Check if already sealed at this state
    SELECT seal_id INTO v_existing_seal
    FROM public.legal_seals
    WHERE entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND legal_state = p_legal_state;

    IF v_existing_seal IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ALREADY_SEALED',
            'existing_seal_id', v_existing_seal
        );
    END IF;

    -- Determine stream type from entity type
    v_stream_type := p_entity_type;

    -- Compute stream hash (SHA-256 of concatenated event hashes)
    SELECT encode(
        digest(
            string_agg(COALESCE(hash, event_id::text), '|' ORDER BY stream_version),
            'sha256'
        ),
        'hex'
    )
    INTO v_stream_hash
    FROM public.event_store
    WHERE stream_type = v_stream_type
      AND stream_id = p_entity_id;

    IF v_stream_hash IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'NO_EVENTS',
            'message', format('No events found for %s:%s', p_entity_type, p_entity_id)
        );
    END IF;

    -- Generate seal event ID (will be used as the seal's triggering event)
    v_seal_event_id := gen_random_uuid();

    -- Get next version for the entity's stream
    SELECT COALESCE(MAX(stream_version), 0) + 1
    INTO v_next_version
    FROM public.event_store
    WHERE stream_type = v_stream_type
      AND stream_id = p_entity_id;

    -- Create the sealing event in event_store
    INSERT INTO public.event_store (
        event_id, stream_type, stream_id, stream_version,
        event_type, payload, meta, restaurant_id,
        actor_ref
    ) VALUES (
        v_seal_event_id,
        v_stream_type,
        p_entity_id,
        v_next_version,
        p_legal_state,  -- event type = legal state name
        jsonb_build_object(
            'entityType', p_entity_type,
            'entityId', p_entity_id,
            'legalState', p_legal_state,
            'streamHash', v_stream_hash,
            'financialStateSnapshot', p_financial_state_snapshot
        ),
        jsonb_build_object(
            'schema_version', '1',
            'trigger', 'legal_seal_creation',
            'fiscal_event', true
        ),
        p_restaurant_id,
        'system:legal_layer'
    );

    -- Generate seal ID
    v_seal_id := format('SEAL-%s-%s-%s', p_entity_type, p_entity_id,
                        to_char(NOW(), 'YYYYMMDD-HH24MISS'));

    -- Create the legal seal
    INSERT INTO public.legal_seals (
        seal_id, entity_type, entity_id, legal_state,
        seal_event_id, stream_hash, financial_state_snapshot,
        sealed_at, restaurant_id
    ) VALUES (
        v_seal_id,
        p_entity_type,
        p_entity_id,
        p_legal_state,
        v_seal_event_id,
        v_stream_hash,
        p_financial_state_snapshot,
        NOW(),
        p_restaurant_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'seal_id', v_seal_id,
        'seal_event_id', v_seal_event_id,
        'stream_hash', v_stream_hash,
        'legal_state', p_legal_state,
        'sealed_at', NOW()
    );
END;
$$;

COMMENT ON FUNCTION public.create_legal_seal(TEXT, TEXT, TEXT, UUID, JSONB) IS
    'Atomic seal creation: computes stream hash, creates seal event, creates seal. '
    'Called by Legal Layer when sealing conditions are met.';

-- =============================================================================
-- PART 6: ADDITIONAL INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_legal_seals_sealed_at
    ON public.legal_seals (sealed_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_seals_legal_sequence
    ON public.legal_seals (legal_sequence_id DESC);

CREATE INDEX IF NOT EXISTS idx_legal_seals_seal_event
    ON public.legal_seals (seal_event_id);

CREATE INDEX IF NOT EXISTS idx_legal_seals_restaurant_id
    ON public.legal_seals (restaurant_id)
    WHERE restaurant_id IS NOT NULL;

-- =============================================================================
-- GRANTS
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.is_entity_sealed(TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.is_entity_sealed_at_state(TEXT, TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.get_stream_version(TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.get_entity_seals(TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.create_legal_seal(TEXT, TEXT, TEXT, UUID, JSONB) TO postgres;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After applying:
--
-- 1. Check constraints exist:
--    SELECT conname FROM pg_constraint
--    WHERE conrelid = 'legal_seals'::regclass;
--    Expected: legal_seals_entity_type_check, legal_seals_legal_state_check,
--              legal_seals_stream_hash_not_empty, legal_seals_seal_event_fk
--
-- 2. Try invalid insert:
--    INSERT INTO legal_seals (seal_id, entity_type, entity_id, legal_state,
--        seal_event_id, stream_hash)
--    VALUES ('test', 'INVALID', '1', 'INVALID', gen_random_uuid(), '');
--    Expected: CHECK violation
--
-- 3. Try update:
--    UPDATE legal_seals SET legal_state = 'foo' WHERE seal_id = 'test';
--    Expected: IMMUTABLE_TABLE exception
--
-- 4. Test create_legal_seal:
--    SELECT create_legal_seal('ORDER', '<order_id>', 'ORDER_DECLARED',
--           '<restaurant_id>');

COMMIT;
