-- Migration: Add pos_x / pos_y to gm_tables for free-form floor plan placement
-- Gap #7 (Competitive): floor plan drag & drop

ALTER TABLE gm_tables
  ADD COLUMN IF NOT EXISTS pos_x REAL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pos_y REAL DEFAULT NULL;

COMMENT ON COLUMN gm_tables.pos_x IS 'Horizontal position (px) on the floor-plan canvas';
COMMENT ON COLUMN gm_tables.pos_y IS 'Vertical position (px) on the floor-plan canvas';
