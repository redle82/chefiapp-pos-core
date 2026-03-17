-- Table Radar: add last_state_change_at for time-in-state tracking
-- Non-breaking: nullable column with default

ALTER TABLE public.gm_tables
  ADD COLUMN IF NOT EXISTS last_state_change_at TIMESTAMPTZ DEFAULT now();

-- Backfill from seated_at where available
UPDATE public.gm_tables
  SET last_state_change_at = seated_at
  WHERE seated_at IS NOT NULL AND last_state_change_at IS NULL;
