-- Migration: 20260222000000_hardening_audit.sql
-- Description: Closes critical security gaps identified in Audit (Jan 2026)
-- 1. Revokes ANON access to financial tables.
-- 2. Enforces Role-Base Delete protection.
-- 3. Fixes Lazy Policies on Cash Registers.

-- ==============================================================================
-- 1. REVOCATION PROTOCOL (Close Open Doors)
-- ==============================================================================

REVOKE ALL ON public.gm_cash_registers FROM anon;
REVOKE ALL ON public.gm_payments FROM anon;
REVOKE ALL ON public.gm_cash_register_transactions FROM anon;
REVOKE ALL ON public.gm_orders FROM anon;

-- Drop Lazy Policies (Wildcard Access)
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_payments;
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.gm_cash_register_transactions;

-- ==============================================================================
-- 2. HARDENING CASH REGISTER (Money Table)
-- ==============================================================================

-- Ensure strict RLS exists (Re-asserting if dropped)
ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_restaurant_cash_registers" ON public.gm_cash_registers;
CREATE POLICY "users_select_own_restaurant_cash_registers"
    ON public.gm_cash_registers FOR SELECT
    USING (restaurant_id IN (SELECT public.user_restaurant_ids()));

-- ONLY MANAGERS/OWNERS can OPEN/CLOSE (Insert/Update)
DROP POLICY IF EXISTS "users_modify_own_restaurant_cash_registers" ON public.gm_cash_registers;
CREATE POLICY "users_modify_own_restaurant_cash_registers"
    ON public.gm_cash_registers FOR ALL
    USING (
        restaurant_id IN (SELECT public.user_restaurant_ids())
        AND EXISTS (
             SELECT 1 FROM public.gm_restaurant_members 
             WHERE user_id = auth.uid() 
             AND restaurant_id = public.gm_cash_registers.restaurant_id
             AND role IN ('owner', 'manager')
        )
    );

-- ==============================================================================
-- 3. HARDENING ORDERS (Data Integrity)
-- ==============================================================================

-- Restrict DELETE to Managers Only
DROP POLICY IF EXISTS "users_delete_own_restaurant_orders" ON public.gm_orders;
CREATE POLICY "managers_delete_own_restaurant_orders"
    ON public.gm_orders FOR DELETE
    USING (
        restaurant_id IN (SELECT public.user_restaurant_ids())
        AND EXISTS (
             SELECT 1 FROM public.gm_restaurant_members 
             WHERE user_id = auth.uid() 
             AND restaurant_id = public.gm_orders.restaurant_id
             AND role IN ('owner', 'manager')
        )
    );

-- ==============================================================================
-- 4. HARDENING TURN SESSIONS (Session Integrity)
-- ==============================================================================

-- Fix "System can insert sessions" (Wildcard check(true))
DROP POLICY IF EXISTS "System can insert sessions" ON public.turn_sessions;

CREATE POLICY "users_insert_own_sessions"
    ON public.turn_sessions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND restaurant_id IN (SELECT public.user_restaurant_ids())
    );
