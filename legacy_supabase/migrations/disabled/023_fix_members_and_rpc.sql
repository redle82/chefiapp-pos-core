-- 023_fix_members_and_rpc.sql
-- Neutralized by Protocol Airlock Recovery Process
-- Legacy schema (restaurant_members) is a View in Genesis V4, cannot confirm RLS.
DO $$ BEGIN RAISE NOTICE 'Skipping 023 legacy RLS fix';
END $$;