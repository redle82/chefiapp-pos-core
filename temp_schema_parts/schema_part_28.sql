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
;
-- Migration: Criar tabelas de billing
-- Data: 2026-01-22
-- Objetivo: Criar estrutura de dados para billing com Stripe
--
-- ⚠️ DEPRECATED: Esta migration é LEGADO
-- ✅ SCHEMA OFICIAL: Use migration 20260130000000_create_billing_core_tables.sql
-- 📋 FONTE DA VERDADE: docs/architecture/BILLING_FLOW.md
--
-- Esta migration é mantida apenas para histórico.
-- NÃO USE estas tabelas (gm_billing_subscriptions, gm_billing_invoices) em novo código.
-- Use as tabelas: subscriptions, billing_events, billing_payments

-- ============================================================================
-- TABELA: gm_billing_subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gm_billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'growth', 'professional', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(restaurant_id) -- Um restaurante só pode ter uma assinatura ativa
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_restaurant 
ON public.gm_billing_subscriptions(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe_subscription 
ON public.gm_billing_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status 
ON public.gm_billing_subscriptions(status);

-- ============================================================================
-- TABELA: gm_billing_invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gm_billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.gm_billing_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('paid', 'open', 'void', 'uncollectible')),
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_billing_invoices_restaurant 
ON public.gm_billing_invoices(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_stripe_invoice 
ON public.gm_billing_invoices(stripe_invoice_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_status 
ON public.gm_billing_invoices(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription 
ON public.gm_billing_invoices(subscription_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.gm_billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_billing_invoices ENABLE ROW LEVEL SECURITY;

-- Policies para subscriptions
CREATE POLICY "Users can view their restaurant's subscriptions"
ON public.gm_billing_subscriptions
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can insert subscriptions for their restaurants"
ON public.gm_billing_subscriptions
FOR INSERT
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can update subscriptions for their restaurants"
ON public.gm_billing_subscriptions
FOR UPDATE
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
)
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

-- Policies para invoices
CREATE POLICY "Users can view their restaurant's invoices"
ON public.gm_billing_invoices
FOR SELECT
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can insert invoices for their restaurants"
ON public.gm_billing_invoices
FOR INSERT
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

CREATE POLICY "Users can update invoices for their restaurants"
ON public.gm_billing_invoices
FOR UPDATE
USING (
  restaurant_id IN (SELECT public.get_user_restaurants())
)
WITH CHECK (
  restaurant_id IN (SELECT public.get_user_restaurants())
);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE public.gm_billing_subscriptions IS 'Assinaturas Stripe por restaurante';
COMMENT ON TABLE public.gm_billing_invoices IS 'Faturas Stripe por restaurante';
COMMENT ON COLUMN public.gm_billing_subscriptions.restaurant_id IS 'Referência ao restaurante (tenant)';
COMMENT ON COLUMN public.gm_billing_invoices.restaurant_id IS 'Referência ao restaurante (tenant)';
;
-- Migration: Otimização de Performance para Multi-Tenant
-- Data: 2026-01-22
-- Objetivo: Adicionar índices e otimizações para suportar até 100 restaurantes

-- ============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

-- Índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_status_created 
ON public.gm_orders(restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_table_status 
ON public.gm_orders(restaurant_id, table_id, status);

CREATE INDEX IF NOT EXISTS idx_gm_order_items_order_status 
ON public.gm_order_items(order_id, status);

CREATE INDEX IF NOT EXISTS idx_gm_products_restaurant_category_available 
ON public.gm_products(restaurant_id, category_id, available) 
WHERE available = true;

CREATE INDEX IF NOT EXISTS idx_gm_tables_restaurant_status 
ON public.gm_tables(restaurant_id, status);

-- Índices para billing
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_restaurant_status 
ON public.gm_billing_subscriptions(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_restaurant_status_created 
ON public.gm_billing_invoices(restaurant_id, status, created_at DESC);

-- Índices para audit logs (queries por tenant)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action_created 
ON public.gm_audit_logs(tenant_id, action, created_at DESC);

-- Índices para restaurant members (queries de permissão)
CREATE INDEX IF NOT EXISTS idx_restaurant_members_user_restaurant_role 
ON public.gm_restaurant_members(user_id, restaurant_id, role);

-- ============================================================================
-- OTIMIZAÇÕES DE QUERIES COMUNS
-- ============================================================================

-- View materializada para pedidos ativos (opcional, atualizar via trigger)
-- CREATE MATERIALIZED VIEW IF NOT EXISTS mv_active_orders AS
-- SELECT 
--   restaurant_id,
--   COUNT(*) FILTER (WHERE status IN ('pending', 'preparing', 'ready')) as active_count,
--   MAX(updated_at) as last_activity
-- FROM gm_orders
-- GROUP BY restaurant_id;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON INDEX idx_gm_orders_restaurant_status_created IS 
'Performance: Queries de pedidos por restaurante, status e data (mais comum)';

COMMENT ON INDEX idx_gm_products_restaurant_category_available IS 
'Performance: Queries de produtos disponíveis por categoria (menu)';

COMMENT ON INDEX idx_audit_logs_tenant_action_created IS 
'Performance: Queries de logs por tenant e ação (debugging)';

-- ============================================================================
-- ANÁLISE DE PERFORMANCE
-- ============================================================================

-- Para analisar performance, usar:
-- EXPLAIN ANALYZE SELECT * FROM gm_orders WHERE restaurant_id = 'xxx' AND status = 'pending';

-- Para identificar queries lentas:
-- SELECT query, calls, total_time, mean_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%gm_orders%'
-- ORDER BY mean_time DESC
-- LIMIT 10;
;
