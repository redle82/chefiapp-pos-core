-- Migration: Adicionar índices em restaurant_id para performance
-- Data: 2026-01-22
-- Objetivo: Garantir que todas as tabelas com restaurant_id têm índices para performance

-- ============================================================================
-- ÍNDICES EM restaurant_id (criar se não existirem)
-- ============================================================================

-- Tabelas principais que já têm restaurant_id (verificar índices)
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_id 
ON public.gm_orders(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_status 
ON public.gm_orders(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_gm_products_restaurant_id 
ON public.gm_products(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_tables_restaurant_id 
ON public.gm_tables(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_menu_categories_restaurant_id 
ON public.gm_menu_categories(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_order_items_order_restaurant 
ON public.gm_order_items(order_id) 
WHERE EXISTS (SELECT 1 FROM public.gm_orders o WHERE o.id = gm_order_items.order_id);

-- Tabelas de associação e configuração
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_restaurant_id 
ON public.gm_restaurant_members(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_user_id 
ON public.gm_restaurant_members(user_id);

-- Tabelas de sistema (se existirem)
CREATE INDEX IF NOT EXISTS idx_gm_shifts_restaurant_id 
ON public.gm_shifts(restaurant_id) 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gm_shifts');

CREATE INDEX IF NOT EXISTS idx_gm_cash_registers_restaurant_id 
ON public.gm_cash_registers(restaurant_id) 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gm_cash_registers');

CREATE INDEX IF NOT EXISTS idx_gm_payments_restaurant_id 
ON public.gm_payments(restaurant_id) 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gm_payments');

-- Audit logs (usa tenant_id, mas é equivalente)
CREATE INDEX IF NOT EXISTS idx_gm_audit_logs_tenant_created 
ON public.gm_audit_logs(tenant_id, created_at DESC);

-- Customer profiles
CREATE INDEX IF NOT EXISTS idx_customer_profiles_restaurant 
ON public.customer_profiles(restaurant_id);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON INDEX idx_gm_orders_restaurant_id IS 'Performance: Filtro por restaurante em queries de pedidos';
COMMENT ON INDEX idx_gm_products_restaurant_id IS 'Performance: Filtro por restaurante em queries de produtos';
COMMENT ON INDEX idx_gm_tables_restaurant_id IS 'Performance: Filtro por restaurante em queries de mesas';
COMMENT ON INDEX idx_gm_menu_categories_restaurant_id IS 'Performance: Filtro por restaurante em queries de categorias';
COMMENT ON INDEX idx_gm_restaurant_members_restaurant_id IS 'Performance: Busca de membros por restaurante';
COMMENT ON INDEX idx_gm_restaurant_members_user_id IS 'Performance: Busca de restaurantes por usuário';
