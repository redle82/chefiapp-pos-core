-- 026_empire_monitor_views.sql
-- Neutralized.
-- Legacy View referencing missing column 'updated_at' in empire_pulses.
DO $$ BEGIN RAISE NOTICE 'Skipping 026 legacy view';
END $$;