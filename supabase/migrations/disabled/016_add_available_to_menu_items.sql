-- 016_add_available_to_menu_items.sql
-- Neutralized by Protocol Airlock Recovery Process
-- Legacy 'menu_items' table is replaced by 'gm_products' in Genesis Recovery.
DO $$ BEGIN -- Payload removed to prevent schema collision.
RAISE NOTICE 'Skipping 016 legacy patch';
END $$;