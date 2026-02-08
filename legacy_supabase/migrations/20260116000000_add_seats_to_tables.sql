-- Migration: Add seats/capacity field to gm_tables
-- Date: 2026-01-16
-- Purpose: Support table capacity management in UI

-- Add seats column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gm_tables' 
        AND column_name = 'seats'
    ) THEN
        ALTER TABLE public.gm_tables 
        ADD COLUMN seats INTEGER DEFAULT 4 NOT NULL;
        
        COMMENT ON COLUMN public.gm_tables.seats IS 'Number of seats/capacity for this table';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist (for tracking changes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gm_tables' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.gm_tables 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        
        COMMENT ON COLUMN public.gm_tables.updated_at IS 'Last update timestamp';
    END IF;
END $$;

-- Update status enum to match TableContext
-- Ensure status can be 'free', 'occupied', 'reserved' (not just 'closed')
-- Note: If status is TEXT, no migration needed. If it's an enum, we'd need to alter the enum type.

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_gm_tables_restaurant_status 
ON public.gm_tables(restaurant_id, status);
