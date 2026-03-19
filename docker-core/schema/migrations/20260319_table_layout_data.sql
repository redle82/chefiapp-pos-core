-- Migration: Add layout_data JSONB to gm_tables for full floor plan layout
-- Stores shape, width, height, rotation, zone per table
-- Complements existing pos_x / pos_y columns

ALTER TABLE public.gm_tables
  ADD COLUMN IF NOT EXISTS layout_data JSONB DEFAULT NULL;

COMMENT ON COLUMN public.gm_tables.layout_data IS 'Floor plan layout: {x, y, width, height, shape, rotation, zone}';

-- Add seats column if not present (some schemas may lack it)
ALTER TABLE public.gm_tables
  ADD COLUMN IF NOT EXISTS seats INTEGER DEFAULT 4;
