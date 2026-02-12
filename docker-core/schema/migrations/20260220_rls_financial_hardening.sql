-- =============================================================================
-- Migration: 20260220_rls_financial_hardening.sql
-- Purpose: Close critical RLS bypass on financial tables
-- Risk: WITHOUT THIS, any authenticated user sees ALL restaurants' cash
--        registers, payments, and transactions.
--
-- Root cause: Original schema_part_6.sql created PERMISSIVE policies with
--   USING (true) WITH CHECK (true) on gm_cash_registers, gm_payments,
--   gm_cash_register_transactions. The 20260212 hardening migration added
--   NEW policies with has_restaurant_access() but NEVER DROPPED the old
--   permissive ones. In PostgreSQL, if ANY permissive policy grants access,
--   the row is visible — making the new policies useless.
--
-- Fixes:
--   1. DROP old permissive "Enable all for authenticated" policies
--   2. Add restaurant_id to gm_cash_register_transactions (missing FK)
--   3. Add proper RLS to gm_cash_register_transactions
--   4. REVOKE anon access to financial tables
--   5. Add service_role bypass for RPCs (SECURITY DEFINER functions need it)
-- =============================================================================

BEGIN;

-- =========================================================================
-- PHASE 1: Drop old permissive policies (the actual vulnerability)
-- =========================================================================

-- gm_cash_registers: drop the USING(true) policy
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_cash_registers;

-- gm_payments: drop the USING(true) policy
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_payments;

-- gm_cash_register_transactions: drop the USING(true) policy
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_cash_register_transactions;

-- =========================================================================
-- PHASE 2: Fix gm_cash_register_transactions (no restaurant_id column)
-- =========================================================================

-- Add restaurant_id column — required for direct RLS check
ALTER TABLE public.gm_cash_register_transactions
    ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;

-- Backfill from parent gm_cash_registers
UPDATE public.gm_cash_register_transactions t
SET restaurant_id = cr.restaurant_id
FROM public.gm_cash_registers cr
WHERE t.cash_register_id = cr.id
  AND t.restaurant_id IS NULL;

-- Make NOT NULL after backfill
-- (wrapped in DO block to handle case where column already NOT NULL)
DO $$
BEGIN
    ALTER TABLE public.gm_cash_register_transactions
        ALTER COLUMN restaurant_id SET NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Index for RLS performance
CREATE INDEX IF NOT EXISTS idx_cash_register_transactions_restaurant
    ON public.gm_cash_register_transactions(restaurant_id);

-- =========================================================================
-- PHASE 3: Add RLS to gm_cash_register_transactions
-- =========================================================================

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.gm_cash_register_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_register_transactions_select"
    ON public.gm_cash_register_transactions
    FOR SELECT
    USING (public.has_restaurant_access(restaurant_id));

CREATE POLICY "cash_register_transactions_insert"
    ON public.gm_cash_register_transactions
    FOR INSERT
    WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "cash_register_transactions_update"
    ON public.gm_cash_register_transactions
    FOR UPDATE
    USING (public.has_restaurant_access(restaurant_id))
    WITH CHECK (public.has_restaurant_access(restaurant_id));

CREATE POLICY "cash_register_transactions_delete"
    ON public.gm_cash_register_transactions
    FOR DELETE
    USING (public.has_restaurant_access(restaurant_id));

-- =========================================================================
-- PHASE 4: Revoke anon access to financial tables
-- =========================================================================

-- anon should NEVER touch financial tables
REVOKE ALL ON public.gm_cash_registers FROM anon;
REVOKE ALL ON public.gm_payments FROM anon;
REVOKE ALL ON public.gm_cash_register_transactions FROM anon;
REVOKE ALL ON public.gm_payment_audit_logs FROM anon;

-- =========================================================================
-- PHASE 5: Ensure service_role bypasses RLS (for SECURITY DEFINER RPCs)
-- =========================================================================

-- service_role needs to bypass RLS for RPCs like open_cash_register_atomic,
-- process_order_payment, close_cash_register_atomic
-- In PostgREST, SECURITY DEFINER functions run as the function owner (postgres),
-- which bypasses RLS by default. But grant explicitly for safety.
GRANT ALL ON public.gm_cash_registers TO service_role;
GRANT ALL ON public.gm_payments TO service_role;
GRANT ALL ON public.gm_cash_register_transactions TO service_role;
GRANT ALL ON public.gm_payment_audit_logs TO service_role;

-- =========================================================================
-- PHASE 6: Verify — expected outcome after migration
-- =========================================================================

-- After this migration, RLS state should be:
--
-- gm_cash_registers:
--   ✅ has_restaurant_access() via 20260212 migration (SELECT/INSERT/UPDATE/DELETE)
--   ❌ "Enable all for authenticated" DROPPED (was USING(true))
--
-- gm_payments:
--   ✅ has_restaurant_access() via 20260212 migration (SELECT/INSERT/UPDATE/DELETE)
--   ❌ "Enable all for authenticated" DROPPED (was USING(true))
--
-- gm_cash_register_transactions:
--   ✅ has_restaurant_access() via THIS migration (SELECT/INSERT/UPDATE/DELETE)
--   ❌ "Enable all for authenticated" DROPPED (was USING(true))
--   ✅ restaurant_id column added + backfilled
--
-- anon role: REVOKED from all 4 financial tables

COMMIT;
