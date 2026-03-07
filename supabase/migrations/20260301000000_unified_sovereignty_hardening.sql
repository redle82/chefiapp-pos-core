-- 20260301000000_unified_sovereignty_hardening.sql
-- Purpose: Transform Supabase into the Sovereign Kernel Data Layer for ChefIApp OS.
-- Author: Antigravity Architect Unit
-- Mode: TOTAL_SOVEREIGNTY_ENFORCEMENT (Hierarchical RLS)

DO $atomic_deploy$
BEGIN

-- 1. Essential Helper Functions
EXECUTE 'CREATE OR REPLACE FUNCTION public.has_restaurant_access(p_restaurant_id uuid)
RETURNS boolean AS $f$
BEGIN
  -- Handle NULL case
  IF p_restaurant_id IS NULL THEN RETURN FALSE; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.gm_restaurant_members
    WHERE restaurant_id = p_restaurant_id
    AND user_id = auth.uid()
    AND disabled_at IS NULL
  );
END;
$f$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public';

-- 2. Hardening search_path for ALL SECURITY DEFINER functions
EXECUTE 'ALTER FUNCTION public.assign_task(uuid, uuid, uuid) SET search_path = public';
EXECUTE 'ALTER FUNCTION public.complete_task(uuid, uuid, uuid) SET search_path = public';
EXECUTE 'ALTER FUNCTION public.create_order_atomic(uuid, jsonb, text, jsonb) SET search_path = public';
EXECUTE 'ALTER FUNCTION public.create_task(uuid, text, text, text, text, uuid, uuid, jsonb, boolean) SET search_path = public';
EXECUTE 'ALTER FUNCTION public.fn_log_payment_attempt(uuid, uuid, uuid, integer, text, text, text, text, text, uuid, integer, text) SET search_path = public';
EXECUTE 'ALTER FUNCTION public.get_operational_metrics(uuid, timestamp with time zone, timestamp with time zone) SET search_path = public';
EXECUTE 'ALTER FUNCTION public.get_payment_health(uuid) SET search_path = public';

-- 3. CONSOLIDATED RLS BLOCK (Direct restaurant_id)
DECLARE
    t TEXT;
    tables_to_harden TEXT[] := ARRAY[
        'gm_orders', 'gm_payments', 'gm_tasks',
        'gm_cash_registers', 'gm_products',
        'gm_catalog_menus', 'gm_ingredients',
        'gm_stock_levels', 'gm_stock_ledger', 'gm_equipment',
        'gm_locations', 'gm_tables', 'gm_restaurant_members',
        'gm_payment_audit_logs', 'shift_logs', 'installed_modules',
        'module_permissions', 'billing_configs'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_harden LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "sovereign_tenant_isolation" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "sovereign_tenant_isolation" ON public.%I ' ||
                       'FOR ALL USING (has_restaurant_access(restaurant_id));', t);
    END LOOP;
END;

-- 4. HIERARCHICAL RLS (Recursive lookup)

-- gm_order_items (via gm_orders)
ALTER TABLE public.gm_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sovereign_tenant_isolation" ON public.gm_order_items;
CREATE POLICY "sovereign_tenant_isolation" ON public.gm_order_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.gm_orders o
    WHERE o.id = order_id AND has_restaurant_access(o.restaurant_id)
  )
);

-- gm_catalog_categories (via gm_catalog_menus)
ALTER TABLE public.gm_catalog_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sovereign_tenant_isolation" ON public.gm_catalog_categories;
CREATE POLICY "sovereign_tenant_isolation" ON public.gm_catalog_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.gm_catalog_menus m
    WHERE m.id = menu_id AND has_restaurant_access(m.restaurant_id)
  )
);

-- gm_catalog_items (via gm_catalog_categories -> gm_catalog_menus)
ALTER TABLE public.gm_catalog_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sovereign_tenant_isolation" ON public.gm_catalog_items;
CREATE POLICY "sovereign_tenant_isolation" ON public.gm_catalog_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.gm_catalog_categories c
    JOIN public.gm_catalog_menus m ON c.menu_id = m.id
    WHERE c.id = category_id AND has_restaurant_access(m.restaurant_id)
  )
);

-- 5. Special Case: gm_restaurants
EXECUTE 'ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY';
EXECUTE 'DROP POLICY IF EXISTS "sovereign_tenant_isolation_restaurants" ON public.gm_restaurants';
EXECUTE 'CREATE POLICY "sovereign_tenant_isolation_restaurants" ON public.gm_restaurants
FOR ALL USING (has_restaurant_access(id))';

-- 6. Structural Defect Fixes
IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gm_tasks' AND column_name='restaurant_id'
) THEN
    EXECUTE 'ALTER TABLE public.gm_tasks ADD COLUMN restaurant_id UUID REFERENCES public.gm_restaurants(id)';
END IF;

-- 7. Audit Layer Reinforcement
EXECUTE 'ALTER TABLE public.gm_payment_audit_logs ENABLE ROW LEVEL SECURITY';
EXECUTE 'DROP POLICY IF EXISTS "audit_write_only" ON public.gm_payment_audit_logs';
EXECUTE 'CREATE POLICY "audit_write_only" ON public.gm_payment_audit_logs FOR INSERT WITH CHECK (true)';
EXECUTE 'DROP POLICY IF EXISTS "audit_read_protection" ON public.gm_payment_audit_logs';
EXECUTE 'CREATE POLICY "audit_read_protection" ON public.gm_payment_audit_logs FOR SELECT USING (has_restaurant_access(restaurant_id))';

END $atomic_deploy$;
