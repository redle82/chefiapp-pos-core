-- Migration: 20260220_rls_operational_hardening.sql
-- Purpose: Fix remaining USING(true) permissive bypasses on operational tables
-- Scope: gm_restaurant_settings, inventory_items, gm_order_requests, gm_reconciliation_queue, gamification tables
-- Depends on: 20260212_fix_tenancy_rls_hardening.sql (has_restaurant_access function)
--
-- CRITICAL: These tables had "simplified" USING(true) policies with TODO comments
-- acknowledging the need for proper tenant isolation. This migration closes that gap.

BEGIN;

-- ========================================================================
-- 1. gm_restaurant_settings — Fiscal config, operational settings
-- Original: USING(true) WITH CHECK(true) "Simplified for immediate fix"
-- ========================================================================

DROP POLICY IF EXISTS "Enable all access for authenticated users to their restaurant settings"
  ON public.gm_restaurant_settings;

CREATE POLICY "settings_select" ON public.gm_restaurant_settings
  FOR SELECT TO authenticated
  USING (has_restaurant_access(restaurant_id));

CREATE POLICY "settings_insert" ON public.gm_restaurant_settings
  FOR INSERT TO authenticated
  WITH CHECK (has_restaurant_access(restaurant_id));

CREATE POLICY "settings_update" ON public.gm_restaurant_settings
  FOR UPDATE TO authenticated
  USING (has_restaurant_access(restaurant_id))
  WITH CHECK (has_restaurant_access(restaurant_id));

CREATE POLICY "settings_delete" ON public.gm_restaurant_settings
  FOR DELETE TO authenticated
  USING (has_restaurant_access(restaurant_id));

-- Service role bypass for RPCs
CREATE POLICY "settings_service_role" ON public.gm_restaurant_settings
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ========================================================================
-- 2. inventory_items — Stock data, cost-per-unit
-- Original: USING(true) WITH CHECK(true)
-- ========================================================================

DROP POLICY IF EXISTS "Enable all access for authenticated users to inventory"
  ON public.inventory_items;

CREATE POLICY "inventory_select" ON public.inventory_items
  FOR SELECT TO authenticated
  USING (has_restaurant_access(restaurant_id));

CREATE POLICY "inventory_insert" ON public.inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (has_restaurant_access(restaurant_id));

CREATE POLICY "inventory_update" ON public.inventory_items
  FOR UPDATE TO authenticated
  USING (has_restaurant_access(restaurant_id))
  WITH CHECK (has_restaurant_access(restaurant_id));

CREATE POLICY "inventory_delete" ON public.inventory_items
  FOR DELETE TO authenticated
  USING (has_restaurant_access(restaurant_id));

CREATE POLICY "inventory_service_role" ON public.inventory_items
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ========================================================================
-- 3. gm_order_requests — Incoming web/QR orders
-- Uses tenant_id instead of restaurant_id.
-- Original: USING(true) WITH CHECK(true) for authenticated
-- Note: Public INSERT with CHECK(true) is INTENTIONAL (QR ordering)
-- ========================================================================

-- Drop the overly permissive ALL policy
DROP POLICY IF EXISTS "Enable all access for authenticated users to order requests"
  ON public.gm_order_requests;

-- Keep public insert (web/QR orders from anonymous users)
-- The existing "Public can insert requests" policy is fine

-- Authenticated users see only their tenant's requests
CREATE POLICY "order_requests_select_tenant" ON public.gm_order_requests
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.current_user_restaurants()
    )
  );

CREATE POLICY "order_requests_update_tenant" ON public.gm_order_requests
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.current_user_restaurants()
    )
  );

CREATE POLICY "order_requests_delete_tenant" ON public.gm_order_requests
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT restaurant_id FROM public.current_user_restaurants()
    )
  );

CREATE POLICY "order_requests_service_role" ON public.gm_order_requests
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ========================================================================
-- 4. gm_reconciliation_queue — Financial reconciliation jobs
-- Original: SELECT USING(true), INSERT WITH CHECK(true)
-- Comment: "Simplified. In PROD restrict to auth.uid() mapped to restaurant."
-- ========================================================================

DROP POLICY IF EXISTS "Enable select for users based on restaurant_id"
  ON public.gm_reconciliation_queue;
DROP POLICY IF EXISTS "Enable insert for authenticated users with matching tenant"
  ON public.gm_reconciliation_queue;

CREATE POLICY "reconciliation_select" ON public.gm_reconciliation_queue
  FOR SELECT TO authenticated
  USING (has_restaurant_access(restaurant_id));

CREATE POLICY "reconciliation_insert" ON public.gm_reconciliation_queue
  FOR INSERT TO authenticated
  WITH CHECK (has_restaurant_access(restaurant_id));

CREATE POLICY "reconciliation_update" ON public.gm_reconciliation_queue
  FOR UPDATE TO authenticated
  USING (has_restaurant_access(restaurant_id))
  WITH CHECK (has_restaurant_access(restaurant_id));

CREATE POLICY "reconciliation_service_role" ON public.gm_reconciliation_queue
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ========================================================================
-- 5. Gamification tables — user_scores, user_achievements, point_transactions
-- Original: "Service can manage" USING(true) WITHOUT restricting to service_role
-- Fix: Restrict ALL policies to service_role only
-- The SELECT policies with restaurant_members check are CORRECT — keep them.
-- ========================================================================

-- user_scores: Fix "Service can manage scores" — was missing role restriction
DROP POLICY IF EXISTS "Service can manage scores" ON public.user_scores;
CREATE POLICY "scores_service_manage" ON public.user_scores
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- user_achievements: Fix "Service can manage achievements"
DROP POLICY IF EXISTS "Service can manage achievements" ON public.user_achievements;
CREATE POLICY "achievements_service_manage" ON public.user_achievements
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- point_transactions: Fix "Service can manage transactions"
DROP POLICY IF EXISTS "Service can manage transactions" ON public.point_transactions;
CREATE POLICY "transactions_service_manage" ON public.point_transactions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ========================================================================
-- 6. Revoke anon from operational tables (defense in depth)
-- ========================================================================

REVOKE ALL ON public.gm_restaurant_settings FROM anon;
REVOKE ALL ON public.inventory_items FROM anon;
REVOKE ALL ON public.gm_reconciliation_queue FROM anon;
-- gm_order_requests: anon INSERT is intentional (QR ordering) — do NOT revoke

COMMIT;
