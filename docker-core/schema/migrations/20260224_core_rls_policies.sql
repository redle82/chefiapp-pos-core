-- =============================================================================
-- Migration: Core Production RLS Policies
-- Date: 2026-02-24
-- Purpose: Add Row-Level Security policies for all core tenant-scoped tables.
--   Previously these tables had RLS *enabled* (from the baseline migration)
--   but no policies defined — meaning all authenticated client queries were
--   silently denied. This migration adds the complete policy set.
--
-- Pattern:
--   - Service role → full unrestricted access (server + edge functions)
--   - Owner → full read/write on their own restaurant's data
--   - Members (gm_restaurant_members) → appropriate scoped access
--   - Tables with no tenant scope (saas_tenants, event_store) → service role only
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: is_restaurant_member(rid)
-- Returns true if the current authenticated user is owner or member of rid.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_restaurant_member(rid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gm_restaurants r
    WHERE r.id = rid AND r.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.gm_restaurant_members rm
    WHERE rm.restaurant_id = rid AND rm.user_id = auth.uid()
  )
$$;

-- ---------------------------------------------------------------------------
-- gm_restaurants
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_restaurants" ON public.gm_restaurants;
DROP POLICY IF EXISTS "owner_select_restaurant"       ON public.gm_restaurants;
DROP POLICY IF EXISTS "owner_update_restaurant"       ON public.gm_restaurants;
DROP POLICY IF EXISTS "owner_insert_restaurant"       ON public.gm_restaurants;
DROP POLICY IF EXISTS "member_select_restaurant"      ON public.gm_restaurants;

CREATE POLICY "service_role_all_restaurants"
  ON public.gm_restaurants FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "owner_insert_restaurant"
  ON public.gm_restaurants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_update_restaurant"
  ON public.gm_restaurants FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "member_select_restaurant"
  ON public.gm_restaurants FOR SELECT
  USING (
    owner_id = auth.uid()
    OR public.is_restaurant_member(id)
  );

-- ---------------------------------------------------------------------------
-- gm_restaurant_members
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_members"         ON public.gm_restaurant_members;
DROP POLICY IF EXISTS "owner_manage_members"             ON public.gm_restaurant_members;
DROP POLICY IF EXISTS "member_view_own_membership"       ON public.gm_restaurant_members;

CREATE POLICY "service_role_all_members"
  ON public.gm_restaurant_members FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "owner_manage_members"
  ON public.gm_restaurant_members FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "member_view_own_membership"
  ON public.gm_restaurant_members FOR SELECT
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- gm_orders
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_orders"  ON public.gm_orders;
DROP POLICY IF EXISTS "staff_all_orders"         ON public.gm_orders;

CREATE POLICY "service_role_all_orders"
  ON public.gm_orders FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "staff_all_orders"
  ON public.gm_orders FOR ALL
  USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- gm_order_items
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_order_items" ON public.gm_order_items;
DROP POLICY IF EXISTS "staff_all_order_items"        ON public.gm_order_items;

CREATE POLICY "service_role_all_order_items"
  ON public.gm_order_items FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "staff_all_order_items"
  ON public.gm_order_items FOR ALL
  USING (
    order_id IN (
      SELECT id FROM public.gm_orders WHERE public.is_restaurant_member(restaurant_id)
    )
  );

-- ---------------------------------------------------------------------------
-- gm_payments
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_payments" ON public.gm_payments;
DROP POLICY IF EXISTS "staff_select_payments"     ON public.gm_payments;

CREATE POLICY "service_role_all_payments"
  ON public.gm_payments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "staff_select_payments"
  ON public.gm_payments FOR SELECT
  USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- gm_payment_audit_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_payment_audit" ON public.gm_payment_audit_logs;
DROP POLICY IF EXISTS "staff_select_payment_audit"     ON public.gm_payment_audit_logs;

CREATE POLICY "service_role_all_payment_audit"
  ON public.gm_payment_audit_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "staff_select_payment_audit"
  ON public.gm_payment_audit_logs FOR SELECT
  USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- gm_products
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_products" ON public.gm_products;
DROP POLICY IF EXISTS "staff_all_products"        ON public.gm_products;

CREATE POLICY "service_role_all_products"
  ON public.gm_products FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "staff_all_products"
  ON public.gm_products FOR ALL
  USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- gm_catalog_items / gm_catalog_categories / gm_catalog_menus / gm_menu_categories
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_catalog_items" ON public.gm_catalog_items;
DROP POLICY IF EXISTS "staff_all_catalog_items"        ON public.gm_catalog_items;
CREATE POLICY "service_role_all_catalog_items"
  ON public.gm_catalog_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_catalog_items"
  ON public.gm_catalog_items FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_catalog_categories" ON public.gm_catalog_categories;
DROP POLICY IF EXISTS "staff_all_catalog_categories"        ON public.gm_catalog_categories;
CREATE POLICY "service_role_all_catalog_categories"
  ON public.gm_catalog_categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_catalog_categories"
  ON public.gm_catalog_categories FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_catalog_menus" ON public.gm_catalog_menus;
DROP POLICY IF EXISTS "staff_all_catalog_menus"        ON public.gm_catalog_menus;
CREATE POLICY "service_role_all_catalog_menus"
  ON public.gm_catalog_menus FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_catalog_menus"
  ON public.gm_catalog_menus FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_menu_categories" ON public.gm_menu_categories;
DROP POLICY IF EXISTS "staff_all_menu_categories"        ON public.gm_menu_categories;
CREATE POLICY "service_role_all_menu_categories"
  ON public.gm_menu_categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_menu_categories"
  ON public.gm_menu_categories FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- gm_tables / gm_terminals / gm_tasks
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_tables" ON public.gm_tables;
DROP POLICY IF EXISTS "staff_all_tables"        ON public.gm_tables;
CREATE POLICY "service_role_all_tables"
  ON public.gm_tables FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_tables"
  ON public.gm_tables FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_terminals" ON public.gm_terminals;
DROP POLICY IF EXISTS "staff_all_terminals"        ON public.gm_terminals;
CREATE POLICY "service_role_all_terminals"
  ON public.gm_terminals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_terminals"
  ON public.gm_terminals FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_tasks" ON public.gm_tasks;
DROP POLICY IF EXISTS "staff_all_tasks"        ON public.gm_tasks;
CREATE POLICY "service_role_all_tasks"
  ON public.gm_tasks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_tasks"
  ON public.gm_tasks FOR ALL USING (
    restaurant_id IN (
      SELECT r.id FROM public.gm_restaurants r
      WHERE r.owner_id = auth.uid()
        OR public.is_restaurant_member(r.id)
    )
  );

-- ---------------------------------------------------------------------------
-- gm_cash_registers
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_cash_registers" ON public.gm_cash_registers;
DROP POLICY IF EXISTS "staff_all_cash_registers"        ON public.gm_cash_registers;
CREATE POLICY "service_role_all_cash_registers"
  ON public.gm_cash_registers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_cash_registers"
  ON public.gm_cash_registers FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- gm_staff
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_staff" ON public.gm_staff;
DROP POLICY IF EXISTS "staff_select_own_entry" ON public.gm_staff;
DROP POLICY IF EXISTS "owner_manage_staff"     ON public.gm_staff;

CREATE POLICY "service_role_all_staff"
  ON public.gm_staff FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "staff_select_own_entry"
  ON public.gm_staff FOR SELECT
  USING (user_id = auth.uid() OR public.is_restaurant_member(restaurant_id));

CREATE POLICY "owner_manage_staff"
  ON public.gm_staff FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM public.gm_restaurants WHERE owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- shift_logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_shift_logs" ON public.shift_logs;
DROP POLICY IF EXISTS "staff_all_shift_logs"        ON public.shift_logs;
CREATE POLICY "service_role_all_shift_logs"
  ON public.shift_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_shift_logs"
  ON public.shift_logs FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- gm_locations / gm_equipment / gm_ingredients
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_locations" ON public.gm_locations;
DROP POLICY IF EXISTS "staff_all_locations"        ON public.gm_locations;
CREATE POLICY "service_role_all_locations"
  ON public.gm_locations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_locations"
  ON public.gm_locations FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_equipment" ON public.gm_equipment;
DROP POLICY IF EXISTS "staff_all_equipment"        ON public.gm_equipment;
CREATE POLICY "service_role_all_equipment"
  ON public.gm_equipment FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_equipment"
  ON public.gm_equipment FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_ingredients" ON public.gm_ingredients;
DROP POLICY IF EXISTS "staff_all_ingredients"        ON public.gm_ingredients;
CREATE POLICY "service_role_all_ingredients"
  ON public.gm_ingredients FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_ingredients"
  ON public.gm_ingredients FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- gm_product_bom / gm_stock_ledger / gm_stock_levels
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_product_bom" ON public.gm_product_bom;
DROP POLICY IF EXISTS "staff_all_product_bom"        ON public.gm_product_bom;
CREATE POLICY "service_role_all_product_bom"
  ON public.gm_product_bom FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_product_bom"
  ON public.gm_product_bom FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_stock_ledger" ON public.gm_stock_ledger;
DROP POLICY IF EXISTS "staff_all_stock_ledger"        ON public.gm_stock_ledger;
CREATE POLICY "service_role_all_stock_ledger"
  ON public.gm_stock_ledger FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_stock_ledger"
  ON public.gm_stock_ledger FOR ALL USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_stock_levels" ON public.gm_stock_levels;
DROP POLICY IF EXISTS "staff_all_stock_levels"        ON public.gm_stock_levels;
CREATE POLICY "service_role_all_stock_levels"
  ON public.gm_stock_levels FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "staff_all_stock_levels"
  ON public.gm_stock_levels FOR ALL USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- installed_modules / module_permissions
-- Service role + restaurant owner (for feature toggles)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_installed_modules" ON public.installed_modules;
DROP POLICY IF EXISTS "owner_select_installed_modules"     ON public.installed_modules;
CREATE POLICY "service_role_all_installed_modules"
  ON public.installed_modules FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "owner_select_installed_modules"
  ON public.installed_modules FOR SELECT USING (public.is_restaurant_member(restaurant_id));

DROP POLICY IF EXISTS "service_role_all_module_permissions" ON public.module_permissions;
DROP POLICY IF EXISTS "owner_select_module_permissions"     ON public.module_permissions;
CREATE POLICY "service_role_all_module_permissions"
  ON public.module_permissions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "owner_select_module_permissions"
  ON public.module_permissions FOR SELECT USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- legal_seals
-- Insert by authenticated (on legal acceptance), select by restaurant member
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_legal_seals"    ON public.legal_seals;
DROP POLICY IF EXISTS "authenticated_insert_legal_seal" ON public.legal_seals;
DROP POLICY IF EXISTS "member_select_legal_seals"       ON public.legal_seals;
CREATE POLICY "service_role_all_legal_seals"
  ON public.legal_seals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "authenticated_insert_legal_seal"
  ON public.legal_seals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "member_select_legal_seals"
  ON public.legal_seals FOR SELECT USING (public.is_restaurant_member(restaurant_id));

-- ---------------------------------------------------------------------------
-- billing_configs — service role only (sensitive; no direct client access)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_billing_configs" ON public.billing_configs;
CREATE POLICY "service_role_all_billing_configs"
  ON public.billing_configs FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- saas_tenants — service role only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_saas_tenants" ON public.saas_tenants;
CREATE POLICY "service_role_all_saas_tenants"
  ON public.saas_tenants FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- event_store — service role only (append-only audit log)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "service_role_all_event_store" ON public.event_store;
CREATE POLICY "service_role_all_event_store"
  ON public.event_store FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- billing_incidents (added in 20260325) — service role only
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'billing_incidents'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "service_role_all_billing_incidents" ON public.billing_incidents';
    EXECUTE 'CREATE POLICY "service_role_all_billing_incidents"
      ON public.billing_incidents FOR ALL USING (auth.role() = ''service_role'')';
    EXECUTE 'ALTER TABLE public.billing_incidents ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
