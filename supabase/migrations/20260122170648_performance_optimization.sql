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
