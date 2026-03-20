-- =============================================================================
-- Migration: 20260320_rls_hardening.sql
-- Purpose: Replace all remaining permissive RLS policies (USING true / WITH CHECK true)
--   with proper tenant-isolated policies across ALL multi-tenant tables.
--
-- Pattern:
--   - Authenticated users: scoped to restaurants they belong to via gm_restaurant_members
--   - Service role: full unrestricted access (BYPASSRLS, explicit policies for clarity)
--   - Anon: NO access to any tenant-scoped table
--
-- This migration is IDEMPOTENT: it drops policies before creating them.
--
-- DEPENDS ON:
--   - public.gm_restaurant_members (user_id, restaurant_id)
--   - public.has_restaurant_access(uuid) from 20260212_fix_tenancy_rls_hardening.sql
--   - public.is_restaurant_member(uuid) from 20260224_core_rls_policies.sql
-- =============================================================================

BEGIN;

-- =============================================================================
-- HELPER: Ensure has_restaurant_access exists (safe re-create)
-- This is the canonical tenant isolation function used across all policies.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.has_restaurant_access(p_restaurant_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Owner check
    SELECT 1 FROM public.gm_restaurants r
    WHERE r.id = p_restaurant_id AND r.owner_id = auth.uid()
  )
  OR EXISTS (
    -- Member check
    SELECT 1 FROM public.gm_restaurant_members rm
    WHERE rm.restaurant_id = p_restaurant_id AND rm.user_id = auth.uid()
  )
  OR (
    -- JWT claim check (for service-level access via PostgREST)
    (auth.jwt() ->> 'restaurant_id')::uuid = p_restaurant_id
  )
$$;

-- =============================================================================
-- MACRO: For each tenant-scoped table with restaurant_id, drop old permissive
-- policies and create new tenant-isolated ones.
--
-- Tables covered (30 tables):
--   gm_orders, gm_order_items(*), gm_products, gm_tables, gm_staff,
--   gm_customers, gm_reservations, gm_discounts, gm_coupons,
--   gm_receipt_log, gm_tip_log, gm_waste_log, gm_campaigns,
--   gm_product_translations, integration_orders, gm_reconciliations,
--   shift_logs, gm_cash_registers, gm_terminals, gm_locations,
--   gm_stock_levels, gm_stock_ledger, gm_ingredients, gm_equipment,
--   gm_tasks, gm_payments, gm_payment_audit_logs, webhook_events, api_keys
--
-- (*) gm_order_items uses order_id join, not restaurant_id directly
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. gm_orders
-- ---------------------------------------------------------------------------
ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "orders_all" ON public.gm_orders;
DROP POLICY IF EXISTS "tenant_isolation_select_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "tenant_isolation_insert_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "tenant_isolation_update_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "tenant_isolation_delete_orders" ON public.gm_orders;
DROP POLICY IF EXISTS "orders_service_all" ON public.gm_orders;

CREATE POLICY "tenant_isolation_select_orders" ON public.gm_orders
  FOR SELECT TO authenticated
  USING (has_restaurant_access(restaurant_id));

CREATE POLICY "tenant_isolation_insert_orders" ON public.gm_orders
  FOR INSERT TO authenticated
  WITH CHECK (has_restaurant_access(restaurant_id));

CREATE POLICY "tenant_isolation_update_orders" ON public.gm_orders
  FOR UPDATE TO authenticated
  USING (has_restaurant_access(restaurant_id))
  WITH CHECK (has_restaurant_access(restaurant_id));

CREATE POLICY "tenant_isolation_delete_orders" ON public.gm_orders
  FOR DELETE TO authenticated
  USING (has_restaurant_access(restaurant_id));

CREATE POLICY "orders_service_all" ON public.gm_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 2. gm_order_items (via order_id → gm_orders.restaurant_id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "order_items_all" ON public.gm_order_items;
DROP POLICY IF EXISTS "tenant_isolation_select_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "tenant_isolation_insert_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "tenant_isolation_update_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "tenant_isolation_delete_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "order_items_service_all" ON public.gm_order_items;

CREATE POLICY "tenant_isolation_select_order_items" ON public.gm_order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.gm_orders WHERE has_restaurant_access(restaurant_id)));

CREATE POLICY "tenant_isolation_insert_order_items" ON public.gm_order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.gm_orders WHERE has_restaurant_access(restaurant_id)));

CREATE POLICY "tenant_isolation_update_order_items" ON public.gm_order_items
  FOR UPDATE TO authenticated
  USING (order_id IN (SELECT id FROM public.gm_orders WHERE has_restaurant_access(restaurant_id)))
  WITH CHECK (order_id IN (SELECT id FROM public.gm_orders WHERE has_restaurant_access(restaurant_id)));

CREATE POLICY "tenant_isolation_delete_order_items" ON public.gm_order_items
  FOR DELETE TO authenticated
  USING (order_id IN (SELECT id FROM public.gm_orders WHERE has_restaurant_access(restaurant_id)));

CREATE POLICY "order_items_service_all" ON public.gm_order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 3. gm_products
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_products') THEN
  ALTER TABLE public.gm_products ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_products" ON public.gm_products;
  DROP POLICY IF EXISTS "products_all" ON public.gm_products;
  DROP POLICY IF EXISTS "tenant_isolation_select_products" ON public.gm_products;
  DROP POLICY IF EXISTS "tenant_isolation_insert_products" ON public.gm_products;
  DROP POLICY IF EXISTS "tenant_isolation_update_products" ON public.gm_products;
  DROP POLICY IF EXISTS "tenant_isolation_delete_products" ON public.gm_products;
  DROP POLICY IF EXISTS "products_service_all" ON public.gm_products;

  CREATE POLICY "tenant_isolation_select_products" ON public.gm_products
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_products" ON public.gm_products
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_products" ON public.gm_products
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_products" ON public.gm_products
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "products_service_all" ON public.gm_products
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. gm_tables
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_tables') THEN
  ALTER TABLE public.gm_tables ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_tables" ON public.gm_tables;
  DROP POLICY IF EXISTS "tables_all" ON public.gm_tables;
  DROP POLICY IF EXISTS "tenant_isolation_select_tables" ON public.gm_tables;
  DROP POLICY IF EXISTS "tenant_isolation_insert_tables" ON public.gm_tables;
  DROP POLICY IF EXISTS "tenant_isolation_update_tables" ON public.gm_tables;
  DROP POLICY IF EXISTS "tenant_isolation_delete_tables" ON public.gm_tables;
  DROP POLICY IF EXISTS "tables_service_all" ON public.gm_tables;

  CREATE POLICY "tenant_isolation_select_tables" ON public.gm_tables
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_tables" ON public.gm_tables
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_tables" ON public.gm_tables
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_tables" ON public.gm_tables
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tables_service_all" ON public.gm_tables
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. gm_staff
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_staff') THEN
  ALTER TABLE public.gm_staff ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_staff" ON public.gm_staff;
  DROP POLICY IF EXISTS "staff_all" ON public.gm_staff;
  DROP POLICY IF EXISTS "tenant_isolation_select_staff" ON public.gm_staff;
  DROP POLICY IF EXISTS "tenant_isolation_insert_staff" ON public.gm_staff;
  DROP POLICY IF EXISTS "tenant_isolation_update_staff" ON public.gm_staff;
  DROP POLICY IF EXISTS "tenant_isolation_delete_staff" ON public.gm_staff;
  DROP POLICY IF EXISTS "staff_service_all" ON public.gm_staff;

  CREATE POLICY "tenant_isolation_select_staff" ON public.gm_staff
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_staff" ON public.gm_staff
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_staff" ON public.gm_staff
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_staff" ON public.gm_staff
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "staff_service_all" ON public.gm_staff
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. gm_customers
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_customers') THEN
  ALTER TABLE public.gm_customers ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_customers" ON public.gm_customers;
  DROP POLICY IF EXISTS "customers_all" ON public.gm_customers;
  DROP POLICY IF EXISTS "tenant_isolation_select_customers" ON public.gm_customers;
  DROP POLICY IF EXISTS "tenant_isolation_insert_customers" ON public.gm_customers;
  DROP POLICY IF EXISTS "tenant_isolation_update_customers" ON public.gm_customers;
  DROP POLICY IF EXISTS "tenant_isolation_delete_customers" ON public.gm_customers;
  DROP POLICY IF EXISTS "customers_service_all" ON public.gm_customers;

  CREATE POLICY "tenant_isolation_select_customers" ON public.gm_customers
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_customers" ON public.gm_customers
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_customers" ON public.gm_customers
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_customers" ON public.gm_customers
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "customers_service_all" ON public.gm_customers
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. gm_reservations
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_reservations') THEN
  ALTER TABLE public.gm_reservations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_reservations" ON public.gm_reservations;
  DROP POLICY IF EXISTS "reservations_all" ON public.gm_reservations;
  DROP POLICY IF EXISTS "reservations_select" ON public.gm_reservations;
  DROP POLICY IF EXISTS "reservations_insert" ON public.gm_reservations;
  DROP POLICY IF EXISTS "reservations_update" ON public.gm_reservations;
  DROP POLICY IF EXISTS "reservations_delete" ON public.gm_reservations;
  DROP POLICY IF EXISTS "tenant_isolation_select_reservations" ON public.gm_reservations;
  DROP POLICY IF EXISTS "tenant_isolation_insert_reservations" ON public.gm_reservations;
  DROP POLICY IF EXISTS "tenant_isolation_update_reservations" ON public.gm_reservations;
  DROP POLICY IF EXISTS "tenant_isolation_delete_reservations" ON public.gm_reservations;
  DROP POLICY IF EXISTS "reservations_service_all" ON public.gm_reservations;

  CREATE POLICY "tenant_isolation_select_reservations" ON public.gm_reservations
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_reservations" ON public.gm_reservations
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_reservations" ON public.gm_reservations
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_reservations" ON public.gm_reservations
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "reservations_service_all" ON public.gm_reservations
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 8. gm_discounts
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_discounts') THEN
  ALTER TABLE public.gm_discounts ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_discounts" ON public.gm_discounts;
  DROP POLICY IF EXISTS "discounts_all" ON public.gm_discounts;
  DROP POLICY IF EXISTS "tenant_isolation_select_discounts" ON public.gm_discounts;
  DROP POLICY IF EXISTS "tenant_isolation_insert_discounts" ON public.gm_discounts;
  DROP POLICY IF EXISTS "tenant_isolation_update_discounts" ON public.gm_discounts;
  DROP POLICY IF EXISTS "tenant_isolation_delete_discounts" ON public.gm_discounts;
  DROP POLICY IF EXISTS "discounts_service_all" ON public.gm_discounts;

  CREATE POLICY "tenant_isolation_select_discounts" ON public.gm_discounts
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_discounts" ON public.gm_discounts
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_discounts" ON public.gm_discounts
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_discounts" ON public.gm_discounts
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "discounts_service_all" ON public.gm_discounts
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 9. gm_coupons
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_coupons') THEN
  ALTER TABLE public.gm_coupons ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_coupons" ON public.gm_coupons;
  DROP POLICY IF EXISTS "coupons_all" ON public.gm_coupons;
  DROP POLICY IF EXISTS "tenant_isolation_select_coupons" ON public.gm_coupons;
  DROP POLICY IF EXISTS "tenant_isolation_insert_coupons" ON public.gm_coupons;
  DROP POLICY IF EXISTS "tenant_isolation_update_coupons" ON public.gm_coupons;
  DROP POLICY IF EXISTS "tenant_isolation_delete_coupons" ON public.gm_coupons;
  DROP POLICY IF EXISTS "coupons_service_all" ON public.gm_coupons;

  CREATE POLICY "tenant_isolation_select_coupons" ON public.gm_coupons
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_coupons" ON public.gm_coupons
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_coupons" ON public.gm_coupons
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_coupons" ON public.gm_coupons
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "coupons_service_all" ON public.gm_coupons
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 10. gm_receipt_log
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_receipt_log') THEN
  ALTER TABLE public.gm_receipt_log ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_receipt_log" ON public.gm_receipt_log;
  DROP POLICY IF EXISTS "receipt_log_all" ON public.gm_receipt_log;
  DROP POLICY IF EXISTS "tenant_isolation_select_receipt_log" ON public.gm_receipt_log;
  DROP POLICY IF EXISTS "tenant_isolation_insert_receipt_log" ON public.gm_receipt_log;
  DROP POLICY IF EXISTS "tenant_isolation_update_receipt_log" ON public.gm_receipt_log;
  DROP POLICY IF EXISTS "tenant_isolation_delete_receipt_log" ON public.gm_receipt_log;
  DROP POLICY IF EXISTS "receipt_log_service_all" ON public.gm_receipt_log;

  CREATE POLICY "tenant_isolation_select_receipt_log" ON public.gm_receipt_log
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_receipt_log" ON public.gm_receipt_log
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  -- receipt_log is append-only: no update/delete for authenticated users
  CREATE POLICY "receipt_log_service_all" ON public.gm_receipt_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 11. gm_tip_log
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_tip_log') THEN
  ALTER TABLE public.gm_tip_log ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_tip_log" ON public.gm_tip_log;
  DROP POLICY IF EXISTS "tip_log_all" ON public.gm_tip_log;
  DROP POLICY IF EXISTS "tenant_isolation_select_tip_log" ON public.gm_tip_log;
  DROP POLICY IF EXISTS "tenant_isolation_insert_tip_log" ON public.gm_tip_log;
  DROP POLICY IF EXISTS "tip_log_service_all" ON public.gm_tip_log;

  CREATE POLICY "tenant_isolation_select_tip_log" ON public.gm_tip_log
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_tip_log" ON public.gm_tip_log
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  -- tip_log is append-only: no update/delete for authenticated users
  CREATE POLICY "tip_log_service_all" ON public.gm_tip_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 12. gm_waste_log
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_waste_log') THEN
  ALTER TABLE public.gm_waste_log ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_waste_log" ON public.gm_waste_log;
  DROP POLICY IF EXISTS "waste_log_all" ON public.gm_waste_log;
  DROP POLICY IF EXISTS "tenant_isolation_select_waste_log" ON public.gm_waste_log;
  DROP POLICY IF EXISTS "tenant_isolation_insert_waste_log" ON public.gm_waste_log;
  DROP POLICY IF EXISTS "waste_log_service_all" ON public.gm_waste_log;

  CREATE POLICY "tenant_isolation_select_waste_log" ON public.gm_waste_log
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_waste_log" ON public.gm_waste_log
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "waste_log_service_all" ON public.gm_waste_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 13. gm_campaigns
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_campaigns') THEN
  ALTER TABLE public.gm_campaigns ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_campaigns" ON public.gm_campaigns;
  DROP POLICY IF EXISTS "campaigns_all" ON public.gm_campaigns;
  DROP POLICY IF EXISTS "tenant_isolation_select_campaigns" ON public.gm_campaigns;
  DROP POLICY IF EXISTS "tenant_isolation_insert_campaigns" ON public.gm_campaigns;
  DROP POLICY IF EXISTS "tenant_isolation_update_campaigns" ON public.gm_campaigns;
  DROP POLICY IF EXISTS "tenant_isolation_delete_campaigns" ON public.gm_campaigns;
  DROP POLICY IF EXISTS "campaigns_service_all" ON public.gm_campaigns;

  CREATE POLICY "tenant_isolation_select_campaigns" ON public.gm_campaigns
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_campaigns" ON public.gm_campaigns
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_campaigns" ON public.gm_campaigns
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_campaigns" ON public.gm_campaigns
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "campaigns_service_all" ON public.gm_campaigns
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 14. gm_product_translations
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_product_translations') THEN
  ALTER TABLE public.gm_product_translations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_product_translations" ON public.gm_product_translations;
  DROP POLICY IF EXISTS "product_translations_all" ON public.gm_product_translations;
  DROP POLICY IF EXISTS "tenant_isolation_select_product_translations" ON public.gm_product_translations;
  DROP POLICY IF EXISTS "tenant_isolation_insert_product_translations" ON public.gm_product_translations;
  DROP POLICY IF EXISTS "tenant_isolation_update_product_translations" ON public.gm_product_translations;
  DROP POLICY IF EXISTS "tenant_isolation_delete_product_translations" ON public.gm_product_translations;
  DROP POLICY IF EXISTS "product_translations_service_all" ON public.gm_product_translations;

  CREATE POLICY "tenant_isolation_select_product_translations" ON public.gm_product_translations
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_product_translations" ON public.gm_product_translations
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_product_translations" ON public.gm_product_translations
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_product_translations" ON public.gm_product_translations
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "product_translations_service_all" ON public.gm_product_translations
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 15. integration_orders
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='integration_orders') THEN
  ALTER TABLE public.integration_orders ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_integration_orders" ON public.integration_orders;
  DROP POLICY IF EXISTS "integration_orders_all" ON public.integration_orders;
  DROP POLICY IF EXISTS "tenant_isolation_select_integration_orders" ON public.integration_orders;
  DROP POLICY IF EXISTS "tenant_isolation_insert_integration_orders" ON public.integration_orders;
  DROP POLICY IF EXISTS "tenant_isolation_update_integration_orders" ON public.integration_orders;
  DROP POLICY IF EXISTS "tenant_isolation_delete_integration_orders" ON public.integration_orders;
  DROP POLICY IF EXISTS "integration_orders_service_all" ON public.integration_orders;

  CREATE POLICY "tenant_isolation_select_integration_orders" ON public.integration_orders
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_integration_orders" ON public.integration_orders
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_integration_orders" ON public.integration_orders
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_integration_orders" ON public.integration_orders
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "integration_orders_service_all" ON public.integration_orders
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 16. gm_reconciliations
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_reconciliations') THEN
  ALTER TABLE public.gm_reconciliations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_reconciliations" ON public.gm_reconciliations;
  DROP POLICY IF EXISTS "reconciliations_all" ON public.gm_reconciliations;
  DROP POLICY IF EXISTS "tenant_isolation_select_reconciliations" ON public.gm_reconciliations;
  DROP POLICY IF EXISTS "tenant_isolation_insert_reconciliations" ON public.gm_reconciliations;
  DROP POLICY IF EXISTS "tenant_isolation_update_reconciliations" ON public.gm_reconciliations;
  DROP POLICY IF EXISTS "tenant_isolation_delete_reconciliations" ON public.gm_reconciliations;
  DROP POLICY IF EXISTS "reconciliations_service_all" ON public.gm_reconciliations;

  CREATE POLICY "tenant_isolation_select_reconciliations" ON public.gm_reconciliations
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_reconciliations" ON public.gm_reconciliations
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_reconciliations" ON public.gm_reconciliations
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_reconciliations" ON public.gm_reconciliations
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "reconciliations_service_all" ON public.gm_reconciliations
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 17. shift_logs
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='shift_logs') THEN
  ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_shift_logs" ON public.shift_logs;
  DROP POLICY IF EXISTS "shift_logs_all" ON public.shift_logs;
  DROP POLICY IF EXISTS "shift_logs_select" ON public.shift_logs;
  DROP POLICY IF EXISTS "shift_logs_insert" ON public.shift_logs;
  DROP POLICY IF EXISTS "shift_logs_update" ON public.shift_logs;
  DROP POLICY IF EXISTS "shift_logs_delete" ON public.shift_logs;
  DROP POLICY IF EXISTS "tenant_isolation_select_shift_logs" ON public.shift_logs;
  DROP POLICY IF EXISTS "tenant_isolation_insert_shift_logs" ON public.shift_logs;
  DROP POLICY IF EXISTS "tenant_isolation_update_shift_logs" ON public.shift_logs;
  DROP POLICY IF EXISTS "tenant_isolation_delete_shift_logs" ON public.shift_logs;
  DROP POLICY IF EXISTS "shift_logs_service_all" ON public.shift_logs;

  CREATE POLICY "tenant_isolation_select_shift_logs" ON public.shift_logs
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_shift_logs" ON public.shift_logs
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_shift_logs" ON public.shift_logs
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_shift_logs" ON public.shift_logs
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "shift_logs_service_all" ON public.shift_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 18. gm_cash_registers
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_cash_registers') THEN
  ALTER TABLE public.gm_cash_registers ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_cash_registers" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "cash_registers_all" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "cash_registers_select" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "cash_registers_insert" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "cash_registers_update" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "cash_registers_delete" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "tenant_isolation_select_cash_registers" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "tenant_isolation_insert_cash_registers" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "tenant_isolation_update_cash_registers" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "tenant_isolation_delete_cash_registers" ON public.gm_cash_registers;
  DROP POLICY IF EXISTS "cash_registers_service_all" ON public.gm_cash_registers;

  CREATE POLICY "tenant_isolation_select_cash_registers" ON public.gm_cash_registers
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_cash_registers" ON public.gm_cash_registers
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_cash_registers" ON public.gm_cash_registers
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_cash_registers" ON public.gm_cash_registers
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "cash_registers_service_all" ON public.gm_cash_registers
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 19. gm_terminals
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_terminals') THEN
  ALTER TABLE public.gm_terminals ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_terminals" ON public.gm_terminals;
  DROP POLICY IF EXISTS "terminals_all" ON public.gm_terminals;
  DROP POLICY IF EXISTS "tenant_isolation_select_terminals" ON public.gm_terminals;
  DROP POLICY IF EXISTS "tenant_isolation_insert_terminals" ON public.gm_terminals;
  DROP POLICY IF EXISTS "tenant_isolation_update_terminals" ON public.gm_terminals;
  DROP POLICY IF EXISTS "tenant_isolation_delete_terminals" ON public.gm_terminals;
  DROP POLICY IF EXISTS "terminals_service_all" ON public.gm_terminals;

  CREATE POLICY "tenant_isolation_select_terminals" ON public.gm_terminals
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_terminals" ON public.gm_terminals
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_terminals" ON public.gm_terminals
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_terminals" ON public.gm_terminals
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "terminals_service_all" ON public.gm_terminals
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 20. gm_locations
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_locations') THEN
  ALTER TABLE public.gm_locations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_locations" ON public.gm_locations;
  DROP POLICY IF EXISTS "locations_all" ON public.gm_locations;
  DROP POLICY IF EXISTS "tenant_isolation_select_locations" ON public.gm_locations;
  DROP POLICY IF EXISTS "tenant_isolation_insert_locations" ON public.gm_locations;
  DROP POLICY IF EXISTS "tenant_isolation_update_locations" ON public.gm_locations;
  DROP POLICY IF EXISTS "tenant_isolation_delete_locations" ON public.gm_locations;
  DROP POLICY IF EXISTS "locations_service_all" ON public.gm_locations;

  CREATE POLICY "tenant_isolation_select_locations" ON public.gm_locations
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_locations" ON public.gm_locations
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_locations" ON public.gm_locations
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_locations" ON public.gm_locations
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "locations_service_all" ON public.gm_locations
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 21. gm_stock_levels
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_stock_levels') THEN
  ALTER TABLE public.gm_stock_levels ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_stock_levels" ON public.gm_stock_levels;
  DROP POLICY IF EXISTS "stock_levels_all" ON public.gm_stock_levels;
  DROP POLICY IF EXISTS "tenant_isolation_select_stock_levels" ON public.gm_stock_levels;
  DROP POLICY IF EXISTS "tenant_isolation_insert_stock_levels" ON public.gm_stock_levels;
  DROP POLICY IF EXISTS "tenant_isolation_update_stock_levels" ON public.gm_stock_levels;
  DROP POLICY IF EXISTS "tenant_isolation_delete_stock_levels" ON public.gm_stock_levels;
  DROP POLICY IF EXISTS "stock_levels_service_all" ON public.gm_stock_levels;

  CREATE POLICY "tenant_isolation_select_stock_levels" ON public.gm_stock_levels
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_stock_levels" ON public.gm_stock_levels
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_stock_levels" ON public.gm_stock_levels
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_stock_levels" ON public.gm_stock_levels
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "stock_levels_service_all" ON public.gm_stock_levels
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 22. gm_stock_ledger
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_stock_ledger') THEN
  ALTER TABLE public.gm_stock_ledger ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_stock_ledger" ON public.gm_stock_ledger;
  DROP POLICY IF EXISTS "stock_ledger_all" ON public.gm_stock_ledger;
  DROP POLICY IF EXISTS "tenant_isolation_select_stock_ledger" ON public.gm_stock_ledger;
  DROP POLICY IF EXISTS "tenant_isolation_insert_stock_ledger" ON public.gm_stock_ledger;
  DROP POLICY IF EXISTS "stock_ledger_service_all" ON public.gm_stock_ledger;

  CREATE POLICY "tenant_isolation_select_stock_ledger" ON public.gm_stock_ledger
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_stock_ledger" ON public.gm_stock_ledger
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  -- stock_ledger is append-only: no update/delete for authenticated users
  CREATE POLICY "stock_ledger_service_all" ON public.gm_stock_ledger
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 23. gm_ingredients
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_ingredients') THEN
  ALTER TABLE public.gm_ingredients ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_ingredients" ON public.gm_ingredients;
  DROP POLICY IF EXISTS "ingredients_all" ON public.gm_ingredients;
  DROP POLICY IF EXISTS "tenant_isolation_select_ingredients" ON public.gm_ingredients;
  DROP POLICY IF EXISTS "tenant_isolation_insert_ingredients" ON public.gm_ingredients;
  DROP POLICY IF EXISTS "tenant_isolation_update_ingredients" ON public.gm_ingredients;
  DROP POLICY IF EXISTS "tenant_isolation_delete_ingredients" ON public.gm_ingredients;
  DROP POLICY IF EXISTS "ingredients_service_all" ON public.gm_ingredients;

  CREATE POLICY "tenant_isolation_select_ingredients" ON public.gm_ingredients
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_ingredients" ON public.gm_ingredients
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_ingredients" ON public.gm_ingredients
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_ingredients" ON public.gm_ingredients
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "ingredients_service_all" ON public.gm_ingredients
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 24. gm_equipment
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_equipment') THEN
  ALTER TABLE public.gm_equipment ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_equipment" ON public.gm_equipment;
  DROP POLICY IF EXISTS "equipment_all" ON public.gm_equipment;
  DROP POLICY IF EXISTS "tenant_isolation_select_equipment" ON public.gm_equipment;
  DROP POLICY IF EXISTS "tenant_isolation_insert_equipment" ON public.gm_equipment;
  DROP POLICY IF EXISTS "tenant_isolation_update_equipment" ON public.gm_equipment;
  DROP POLICY IF EXISTS "tenant_isolation_delete_equipment" ON public.gm_equipment;
  DROP POLICY IF EXISTS "equipment_service_all" ON public.gm_equipment;

  CREATE POLICY "tenant_isolation_select_equipment" ON public.gm_equipment
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_equipment" ON public.gm_equipment
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_equipment" ON public.gm_equipment
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_equipment" ON public.gm_equipment
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "equipment_service_all" ON public.gm_equipment
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 25. gm_tasks
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_tasks') THEN
  ALTER TABLE public.gm_tasks ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_tasks" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tasks_all" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tasks_select" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tasks_insert" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tasks_update" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tasks_delete" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tenant_isolation_select_tasks" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tenant_isolation_insert_tasks" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tenant_isolation_update_tasks" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tenant_isolation_delete_tasks" ON public.gm_tasks;
  DROP POLICY IF EXISTS "tasks_service_all" ON public.gm_tasks;

  CREATE POLICY "tenant_isolation_select_tasks" ON public.gm_tasks
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_tasks" ON public.gm_tasks
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_tasks" ON public.gm_tasks
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_tasks" ON public.gm_tasks
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tasks_service_all" ON public.gm_tasks
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 26. gm_payments
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_payments') THEN
  ALTER TABLE public.gm_payments ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_payments" ON public.gm_payments;
  DROP POLICY IF EXISTS "payments_all" ON public.gm_payments;
  DROP POLICY IF EXISTS "payments_select" ON public.gm_payments;
  DROP POLICY IF EXISTS "payments_insert" ON public.gm_payments;
  DROP POLICY IF EXISTS "payments_update" ON public.gm_payments;
  DROP POLICY IF EXISTS "payments_delete" ON public.gm_payments;
  DROP POLICY IF EXISTS "tenant_isolation_select_payments" ON public.gm_payments;
  DROP POLICY IF EXISTS "tenant_isolation_insert_payments" ON public.gm_payments;
  DROP POLICY IF EXISTS "tenant_isolation_update_payments" ON public.gm_payments;
  DROP POLICY IF EXISTS "tenant_isolation_delete_payments" ON public.gm_payments;
  DROP POLICY IF EXISTS "payments_service_all" ON public.gm_payments;

  CREATE POLICY "tenant_isolation_select_payments" ON public.gm_payments
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_payments" ON public.gm_payments
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_payments" ON public.gm_payments
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_payments" ON public.gm_payments
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "payments_service_all" ON public.gm_payments
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 27. gm_payment_audit_logs (immutable — select + insert only)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_payment_audit_logs') THEN
  ALTER TABLE public.gm_payment_audit_logs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_payment_audit_logs" ON public.gm_payment_audit_logs;
  DROP POLICY IF EXISTS "payment_audit_logs_all" ON public.gm_payment_audit_logs;
  DROP POLICY IF EXISTS "payment_audit_logs_select" ON public.gm_payment_audit_logs;
  DROP POLICY IF EXISTS "payment_audit_logs_insert" ON public.gm_payment_audit_logs;
  DROP POLICY IF EXISTS "tenant_isolation_select_payment_audit_logs" ON public.gm_payment_audit_logs;
  DROP POLICY IF EXISTS "tenant_isolation_insert_payment_audit_logs" ON public.gm_payment_audit_logs;
  DROP POLICY IF EXISTS "payment_audit_logs_service_all" ON public.gm_payment_audit_logs;

  CREATE POLICY "tenant_isolation_select_payment_audit_logs" ON public.gm_payment_audit_logs
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_payment_audit_logs" ON public.gm_payment_audit_logs
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  -- Audit logs are immutable: no update/delete for authenticated users
  CREATE POLICY "payment_audit_logs_service_all" ON public.gm_payment_audit_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 28. webhook_events
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='webhook_events') THEN
  ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_webhook_events" ON public.webhook_events;
  DROP POLICY IF EXISTS "webhook_events_all" ON public.webhook_events;
  DROP POLICY IF EXISTS "tenant_isolation_select_webhook_events" ON public.webhook_events;
  DROP POLICY IF EXISTS "tenant_isolation_insert_webhook_events" ON public.webhook_events;
  DROP POLICY IF EXISTS "webhook_events_service_all" ON public.webhook_events;

  CREATE POLICY "tenant_isolation_select_webhook_events" ON public.webhook_events
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_webhook_events" ON public.webhook_events
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  -- webhook_events are append-only: no update/delete for authenticated users
  CREATE POLICY "webhook_events_service_all" ON public.webhook_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 29. api_keys
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_keys') THEN
  ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_api_keys" ON public.api_keys;
  DROP POLICY IF EXISTS "api_keys_all" ON public.api_keys;
  DROP POLICY IF EXISTS "tenant_isolation_select_api_keys" ON public.api_keys;
  DROP POLICY IF EXISTS "tenant_isolation_insert_api_keys" ON public.api_keys;
  DROP POLICY IF EXISTS "tenant_isolation_update_api_keys" ON public.api_keys;
  DROP POLICY IF EXISTS "tenant_isolation_delete_api_keys" ON public.api_keys;
  DROP POLICY IF EXISTS "api_keys_service_all" ON public.api_keys;

  CREATE POLICY "tenant_isolation_select_api_keys" ON public.api_keys
    FOR SELECT TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_insert_api_keys" ON public.api_keys
    FOR INSERT TO authenticated WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_update_api_keys" ON public.api_keys
    FOR UPDATE TO authenticated USING (has_restaurant_access(restaurant_id)) WITH CHECK (has_restaurant_access(restaurant_id));
  CREATE POLICY "tenant_isolation_delete_api_keys" ON public.api_keys
    FOR DELETE TO authenticated USING (has_restaurant_access(restaurant_id));
  CREATE POLICY "api_keys_service_all" ON public.api_keys
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- =============================================================================
-- TABLES WITHOUT restaurant_id — special policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 30. gm_companies (company-level isolation via owner_id or member lookup)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_companies') THEN
  ALTER TABLE public.gm_companies ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "allow_all_companies" ON public.gm_companies;
  DROP POLICY IF EXISTS "companies_all" ON public.gm_companies;
  DROP POLICY IF EXISTS "tenant_isolation_select_companies" ON public.gm_companies;
  DROP POLICY IF EXISTS "tenant_isolation_insert_companies" ON public.gm_companies;
  DROP POLICY IF EXISTS "tenant_isolation_update_companies" ON public.gm_companies;
  DROP POLICY IF EXISTS "companies_service_all" ON public.gm_companies;

  -- Users can see companies that own restaurants they belong to
  CREATE POLICY "tenant_isolation_select_companies" ON public.gm_companies
    FOR SELECT TO authenticated
    USING (
      id IN (
        SELECT DISTINCT r.tenant_id FROM public.gm_restaurants r
        JOIN public.gm_restaurant_members rm ON rm.restaurant_id = r.id
        WHERE rm.user_id = auth.uid()
      )
      OR id IN (
        SELECT DISTINCT r.tenant_id FROM public.gm_restaurants r
        WHERE r.owner_id = auth.uid()
      )
    );

  -- Only authenticated users can create companies (self-service onboarding)
  CREATE POLICY "tenant_isolation_insert_companies" ON public.gm_companies
    FOR INSERT TO authenticated WITH CHECK (true);

  -- Users can only update companies they are associated with
  CREATE POLICY "tenant_isolation_update_companies" ON public.gm_companies
    FOR UPDATE TO authenticated
    USING (
      id IN (
        SELECT DISTINCT r.tenant_id FROM public.gm_restaurants r
        WHERE r.owner_id = auth.uid()
      )
    );

  CREATE POLICY "companies_service_all" ON public.gm_companies
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 31. gm_restaurant_members (membership table — special rules)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gm_restaurant_members') THEN
  ALTER TABLE public.gm_restaurant_members ENABLE ROW LEVEL SECURITY;

  -- Drop ALL old permissive policies
  DROP POLICY IF EXISTS "Public read for own membership" ON public.gm_restaurant_members;
  DROP POLICY IF EXISTS "Public insert for bootstrap" ON public.gm_restaurant_members;
  DROP POLICY IF EXISTS "allow_all_members" ON public.gm_restaurant_members;
  DROP POLICY IF EXISTS "members_all" ON public.gm_restaurant_members;
  DROP POLICY IF EXISTS "tenant_isolation_select_members" ON public.gm_restaurant_members;
  DROP POLICY IF EXISTS "tenant_isolation_insert_members" ON public.gm_restaurant_members;
  DROP POLICY IF EXISTS "tenant_isolation_update_members" ON public.gm_restaurant_members;
  DROP POLICY IF EXISTS "tenant_isolation_delete_members" ON public.gm_restaurant_members;
  DROP POLICY IF EXISTS "members_service_all" ON public.gm_restaurant_members;

  -- Users can see their own memberships and members of restaurants they own
  CREATE POLICY "tenant_isolation_select_members" ON public.gm_restaurant_members
    FOR SELECT TO authenticated
    USING (
      user_id = auth.uid()
      OR restaurant_id IN (
        SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid()
      )
    );

  -- Only restaurant owners can add members
  CREATE POLICY "tenant_isolation_insert_members" ON public.gm_restaurant_members
    FOR INSERT TO authenticated
    WITH CHECK (
      restaurant_id IN (
        SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid()
      )
    );

  -- Only restaurant owners can update members
  CREATE POLICY "tenant_isolation_update_members" ON public.gm_restaurant_members
    FOR UPDATE TO authenticated
    USING (
      restaurant_id IN (
        SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid()
      )
    );

  -- Only restaurant owners can remove members
  CREATE POLICY "tenant_isolation_delete_members" ON public.gm_restaurant_members
    FOR DELETE TO authenticated
    USING (
      restaurant_id IN (
        SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid()
      )
    );

  CREATE POLICY "members_service_all" ON public.gm_restaurant_members
    FOR ALL TO service_role USING (true) WITH CHECK (true);
END IF;
END $$;

-- =============================================================================
-- REVOKE anon access from ALL tenant-scoped tables
-- =============================================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'gm_orders', 'gm_order_items', 'gm_products', 'gm_tables', 'gm_staff',
    'gm_customers', 'gm_reservations', 'gm_discounts', 'gm_coupons',
    'gm_receipt_log', 'gm_tip_log', 'gm_waste_log', 'gm_campaigns',
    'gm_product_translations', 'integration_orders', 'gm_reconciliations',
    'shift_logs', 'gm_cash_registers', 'gm_terminals', 'gm_locations',
    'gm_stock_levels', 'gm_stock_ledger', 'gm_ingredients', 'gm_equipment',
    'gm_tasks', 'gm_payments', 'gm_payment_audit_logs', 'webhook_events',
    'api_keys', 'gm_companies', 'gm_restaurant_members'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', tbl);
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- PERFORMANCE: Add indexes for RLS policy evaluation
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_user_restaurant
  ON public.gm_restaurant_members(user_id, restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_restaurants_owner_id
  ON public.gm_restaurants(owner_id);

-- Analyze to update query planner statistics
ANALYZE public.gm_restaurant_members;
ANALYZE public.gm_restaurants;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after applying):
-- =============================================================================
-- 1. No permissive (true/true) policies remain:
--    SELECT schemaname, tablename, policyname, qual, with_check
--    FROM pg_policies WHERE schemaname = 'public'
--    AND (qual = 'true' OR with_check = 'true')
--    AND policyname NOT LIKE '%service_all%';
--
-- 2. All tenant tables have RLS enabled:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public'
--    AND tablename IN ('gm_orders','gm_products','gm_staff','gm_payments', ...)
--    AND NOT rowsecurity;
--
-- 3. Verify cross-tenant isolation:
--    SET ROLE authenticated;
--    SET request.jwt.claim.sub = '<user-uuid>';
--    SELECT * FROM gm_orders; -- should only return own restaurant's orders
