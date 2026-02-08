-- 027_security_enforce.sql
-- Neutralized by Protocol Airlock Recovery Process
-- Legacy schema (menu_items, orders) replaced by gm_products/gm_orders.
DO $$ BEGIN RAISE NOTICE 'Skipping 027 legacy security enforce';
END $$;