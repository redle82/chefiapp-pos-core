-- Migration: Garantir RLS completo em todas as tabelas críticas
-- Data: 2026-01-22
-- Objetivo: Verificar e garantir que todas as tabelas críticas têm RLS habilitado e policies adequadas

-- ============================================================================
-- HABILITAR RLS EM TABELAS CRÍTICAS (se ainda não estiver habilitado)
-- ============================================================================

ALTER TABLE IF EXISTS public.gm_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gm_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gm_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gm_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gm_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gm_restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gm_cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gm_payments ENABLE ROW LEVEL SECURITY;

-- Tabelas opcionais (se existirem)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gm_shifts') THEN
        ALTER TABLE public.gm_shifts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gm_tasks') THEN
        ALTER TABLE public.gm_tasks ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_profiles') THEN
        ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gm_inventory_items') THEN
        ALTER TABLE public.gm_inventory_items ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================================
-- RLS POLICIES PARA gm_restaurants
-- ============================================================================

DROP POLICY IF EXISTS "users_select_own_restaurants" ON public.gm_restaurants;
CREATE POLICY "users_select_own_restaurants"
    ON public.gm_restaurants
    FOR SELECT
    USING (
        id IN (SELECT public.get_user_restaurants())
    );

DROP POLICY IF EXISTS "users_insert_own_restaurants" ON public.gm_restaurants;
CREATE POLICY "users_insert_own_restaurants"
    ON public.gm_restaurants
    FOR INSERT
    WITH CHECK (
        -- Apenas owners podem criar restaurantes (ou via função admin)
        EXISTS (
            SELECT 1 FROM public.gm_restaurant_members
            WHERE user_id = auth.uid() AND role = 'owner'
        )
        OR auth.uid() = owner_id
    );

-- ============================================================================
-- RLS POLICIES PARA gm_products (se não existirem)
-- ============================================================================

DROP POLICY IF EXISTS "users_select_own_restaurant_products" ON public.gm_products;
CREATE POLICY "users_select_own_restaurant_products"
    ON public.gm_products
    FOR SELECT
    USING (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    );

DROP POLICY IF EXISTS "users_insert_own_restaurant_products" ON public.gm_products
    FOR INSERT
    WITH CHECK (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    );

DROP POLICY IF EXISTS "users_update_own_restaurant_products" ON public.gm_products;
CREATE POLICY "users_update_own_restaurant_products"
    ON public.gm_products
    FOR UPDATE
    USING (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    )
    WITH CHECK (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    );

DROP POLICY IF EXISTS "users_delete_own_restaurant_products" ON public.gm_products;
CREATE POLICY "users_delete_own_restaurant_products"
    ON public.gm_products
    FOR DELETE
    USING (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    );

-- ============================================================================
-- RLS POLICIES PARA gm_menu_categories (se não existirem)
-- ============================================================================

DROP POLICY IF EXISTS "users_select_own_restaurant_categories" ON public.gm_menu_categories;
CREATE POLICY "users_select_own_restaurant_categories"
    ON public.gm_menu_categories
    FOR SELECT
    USING (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    );

DROP POLICY IF EXISTS "users_insert_own_restaurant_categories" ON public.gm_menu_categories;
CREATE POLICY "users_insert_own_restaurant_categories"
    ON public.gm_menu_categories
    FOR INSERT
    WITH CHECK (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    );

DROP POLICY IF EXISTS "users_update_own_restaurant_categories" ON public.gm_menu_categories;
CREATE POLICY "users_update_own_restaurant_categories"
    ON public.gm_menu_categories
    FOR UPDATE
    USING (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    )
    WITH CHECK (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    );

DROP POLICY IF EXISTS "users_delete_own_restaurant_categories" ON public.gm_menu_categories;
CREATE POLICY "users_delete_own_restaurant_categories"
    ON public.gm_menu_categories
    FOR DELETE
    USING (
        restaurant_id = ANY(SELECT public.get_user_restaurants())
    );

-- ============================================================================
-- NOTA: RLS policies para gm_orders, gm_order_items, gm_tables já existem
-- em 20260117000001_rls_orders.sql. Esta migration garante cobertura completa.
-- ============================================================================
