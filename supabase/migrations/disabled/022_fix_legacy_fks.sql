-- 022_fix_legacy_fks.sql
-- Neutralized by Protocol Airlock Recovery Process
-- Legacy schema (menu_categories) replaced by gm_menu_categories or handled in Genesis.
DO $$ BEGIN RAISE NOTICE 'Skipping 022 legacy FK fix';
END $$;