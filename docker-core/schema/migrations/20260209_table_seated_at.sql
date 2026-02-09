-- Migration: Add seated_at column to gm_tables
-- Purpose: Track when customers are seated to display elapsed time in Waiter/TPV UI
-- Gap #2: Timer mesa/seated_at

ALTER TABLE public.gm_tables
    ADD COLUMN IF NOT EXISTS seated_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.gm_tables.seated_at IS 'Timestamp when table was marked occupied (customers seated). NULL when free/reserved.';
