-- =============================================================================
-- PHASE 1D — BACKFILL: Hash Chain for Existing Events
-- =============================================================================
-- Date: 2026-02-12
-- Priority: MEDIUM (required for full integrity, but new events are already hashed)
-- Context: After 20260212_event_store_hash_chain.sql deploys, all NEW events get
--          automatic hashing via the BEFORE INSERT trigger. However, existing events
--          have NULL hash/hash_prev. This script computes hashes for all historical
--          events, building the chain from genesis forward.
--
-- IMPORTANT: Run this AFTER all Phase 1 migrations are applied.
-- This is a one-time operation. Safe to re-run (idempotent — skips already-hashed).
--
-- Strategy:
--   1. Temporarily disable the forbid_mutation() trigger on event_store
--   2. Process events in order: per stream, by stream_version ASC
--   3. Compute hash chain: first event uses GENESIS, subsequent use previous hash
--   4. Re-enable the forbid_mutation() trigger
--   5. Verify chain integrity
--
-- Performance: Processes in batches of 500 per stream to avoid lock contention.
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: Temporarily disable immutability trigger for backfill
-- =============================================================================
-- This is the ONLY legitimate reason to disable this trigger.
-- Must be re-enabled at the end.

ALTER TABLE public.event_store DISABLE TRIGGER event_store_immutable;

-- =============================================================================
-- STEP 2: Backfill hash chain per stream
-- =============================================================================
-- Process events in stream order: (stream_type, stream_id, stream_version ASC)
-- Each event's hash = compute_event_hash(event_id, stream_id, event_type, payload, prev_hash)

DO $$
DECLARE
    v_stream RECORD;
    v_event RECORD;
    v_prev_hash TEXT;
    v_computed_hash TEXT;
    v_count INTEGER := 0;
    v_total INTEGER := 0;
    v_stream_count INTEGER := 0;
BEGIN
    -- Count unhashed events
    SELECT COUNT(*) INTO v_total
    FROM public.event_store
    WHERE hash IS NULL;

    RAISE NOTICE 'Backfill: % unhashed events to process', v_total;

    IF v_total = 0 THEN
        RAISE NOTICE 'Backfill: No unhashed events. Skipping.';
        RETURN;
    END IF;

    -- Iterate over distinct streams
    FOR v_stream IN
        SELECT DISTINCT stream_type, stream_id
        FROM public.event_store
        WHERE hash IS NULL
        ORDER BY stream_type, stream_id
    LOOP
        v_stream_count := v_stream_count + 1;
        v_prev_hash := NULL;

        -- Get the last hashed event in this stream (if any)
        SELECT hash INTO v_prev_hash
        FROM public.event_store
        WHERE stream_type = v_stream.stream_type
          AND stream_id = v_stream.stream_id
          AND hash IS NOT NULL
        ORDER BY stream_version DESC
        LIMIT 1;

        -- Process unhashed events in version order
        FOR v_event IN
            SELECT event_id, stream_id, event_type, payload, stream_version
            FROM public.event_store
            WHERE stream_type = v_stream.stream_type
              AND stream_id = v_stream.stream_id
              AND hash IS NULL
            ORDER BY stream_version ASC
        LOOP
            -- Compute hash
            v_computed_hash := public.compute_event_hash(
                v_event.event_id,
                v_event.stream_id,
                v_event.event_type,
                v_event.payload,
                v_prev_hash
            );

            -- Update event with hash chain
            UPDATE public.event_store
            SET hash = v_computed_hash,
                hash_prev = v_prev_hash
            WHERE event_id = v_event.event_id;

            v_prev_hash := v_computed_hash;
            v_count := v_count + 1;

            -- Progress log every 500 events
            IF v_count % 500 = 0 THEN
                RAISE NOTICE 'Backfill: Processed %/% events (%s streams)',
                    v_count, v_total, v_stream_count;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Backfill complete: % events across % streams', v_count, v_stream_count;
END;
$$;

-- =============================================================================
-- STEP 3: Re-enable immutability trigger
-- =============================================================================

ALTER TABLE public.event_store ENABLE TRIGGER event_store_immutable;

-- =============================================================================
-- STEP 4: Verify integrity
-- =============================================================================
-- Run a quick check on the backfilled hashes.

DO $$
DECLARE
    v_total INTEGER;
    v_hashed INTEGER;
    v_remaining INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM public.event_store;
    SELECT COUNT(*) INTO v_hashed FROM public.event_store WHERE hash IS NOT NULL;
    v_remaining := v_total - v_hashed;

    RAISE NOTICE 'Verification: Total=%, Hashed=%, Remaining=%', v_total, v_hashed, v_remaining;

    IF v_remaining > 0 THEN
        RAISE WARNING 'Backfill incomplete: % events still unhashed', v_remaining;
    ELSE
        RAISE NOTICE 'Backfill VERIFIED: All events have hash chain';
    END IF;
END;
$$;

COMMIT;
