-- Migration: Add Idempotency and Sequence ID to event_store
-- Date: 2026-01-29 (Planned)

-- 1. Add Sequence ID (Global Ordering)
ALTER TABLE public.event_store
ADD COLUMN IF NOT EXISTS sequence_id BIGSERIAL; -- Implicitly unique index? No, purely generator.
-- Note: BIGSERIAL creates a sequence.

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_sequence ON public.event_store(sequence_id);

-- 2. Add Idempotency Key (Risk 3 Solved)
-- We need to extract idempotency_key from JSONB meta if it exists or add a column.
-- The audit recommended checking (stream_id, idempotency_key).
-- We'll add a generated column or functional unique index?
-- Easier: Add explicit optional column for indexability and constraint.

ALTER TABLE public.event_store
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Populate it from meta for existing records?
UPDATE public.event_store
SET idempotency_key = meta->>'idempotency_key'
WHERE idempotency_key IS NULL AND meta->>'idempotency_key' IS NOT NULL;

-- 3. Constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_store_idempotency 
ON public.event_store(stream_id, idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 4. Comments
COMMENT ON COLUMN public.event_store.sequence_id IS 'Global monotonic cursor for replay/subscription.';
COMMENT ON COLUMN public.event_store.idempotency_key IS 'Deduplication key. Unique per stream.';
