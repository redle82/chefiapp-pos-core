-- Migration: Auditoria de restaurant_id
-- Data: 2026-01-22
-- Objetivo: Auditar todas as tabelas e identificar quais têm restaurant_id

-- ============================================================================
-- AUDITORIA: Listar tabelas com e sem restaurant_id
-- ============================================================================

-- Esta migration cria uma função temporária para auditar o schema
-- Execute manualmente para ver resultados

DO $$
DECLARE
    table_record RECORD;
    has_restaurant_id BOOLEAN;
    table_list TEXT := '';
    missing_list TEXT := '';
BEGIN
    -- Iterar sobre todas as tabelas do schema public que começam com 'gm_'
    FOR table_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE 'gm_%'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        -- Verificar se a tabela tem coluna restaurant_id
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = table_record.table_name
            AND column_name = 'restaurant_id'
        ) INTO has_restaurant_id;
        
        IF has_restaurant_id THEN
            table_list := table_list || table_record.table_name || E'\n';
        ELSE
            missing_list := missing_list || table_record.table_name || E'\n';
        END IF;
    END LOOP;
    
    -- Log dos resultados (visível apenas durante execução)
    RAISE NOTICE '=== TABELAS COM restaurant_id ===';
    RAISE NOTICE '%', table_list;
    RAISE NOTICE '=== TABELAS SEM restaurant_id ===';
    RAISE NOTICE '%', missing_list;
END $$;

-- ============================================================================
-- RESULTADO ESPERADO (baseado em análise do código):
-- ============================================================================

-- Tabelas que JÁ TÊM restaurant_id:
-- - gm_restaurants (é a tabela raiz)
-- - gm_products
-- - gm_orders
-- - gm_order_items (via order_id → gm_orders.restaurant_id)
-- - gm_tables
-- - gm_shifts
-- - gm_cash_registers
-- - gm_payments
-- - gm_restaurant_members (tabela de associação)
-- - gm_inventory_items
-- - gm_customer_profiles
-- - gm_loyalty_cards
-- - gm_integration_secrets
-- - gm_fiscal_queue
-- - gm_restaurant_settings
-- - E outras...

-- Tabelas que PODEM PRECISAR restaurant_id:
-- - gm_menu_categories (verificar se já tem)
-- - gm_audit_logs (opcional, mas recomendado)
-- - gm_push_tokens (opcional)
-- - Outras tabelas específicas do domínio

-- ============================================================================
-- PRÓXIMOS PASSOS:
-- ============================================================================
-- 1. Executar esta migration para ver resultados
-- 2. Criar migration para adicionar restaurant_id onde falta
-- 3. Criar índices em restaurant_id para performance
-- 4. Documentar lista final de tabelas com tenant_id
;
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
;
-- Migration: Criar funções helper para RLS
-- Data: 2026-01-22
-- Objetivo: Criar funções helper para facilitar RLS policies

-- ============================================================================
-- FUNÇÃO HELPER: get_user_restaurant_id()
-- ============================================================================
-- Retorna o restaurant_id do usuário logado (primeiro restaurante)
-- Útil para context switching e policies que precisam de um único ID

CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Retorna o primeiro restaurant_id do usuário
    -- Se usuário tem múltiplos restaurantes, retorna o primeiro
    SELECT restaurant_id 
    FROM public.gm_restaurant_members 
    WHERE user_id = auth.uid()
    ORDER BY created_at ASC
    LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_restaurant_id() IS 
'Retorna o restaurant_id do usuário logado (primeiro restaurante). Usado em RLS policies.';

-- ============================================================================
-- FUNÇÃO HELPER: get_user_restaurants()
-- ============================================================================
-- Retorna lista de restaurantes do usuário logado
-- Útil para policies que precisam verificar múltiplos restaurantes

CREATE OR REPLACE FUNCTION public.get_user_restaurants()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Retorna todos os restaurant_ids do usuário
    SELECT restaurant_id 
    FROM public.gm_restaurant_members 
    WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_restaurants() IS 
'Retorna lista de restaurant_ids do usuário logado. Usado em RLS policies.';

-- ============================================================================
-- FUNÇÃO HELPER: is_user_member_of_restaurant(restaurant_id UUID)
-- ============================================================================
-- Verifica se usuário é membro de um restaurante específico

CREATE OR REPLACE FUNCTION public.is_user_member_of_restaurant(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- Verifica se usuário é membro do restaurante
    SELECT EXISTS (
        SELECT 1 
        FROM public.gm_restaurant_members 
        WHERE user_id = auth.uid() 
        AND restaurant_id = p_restaurant_id
    );
$$;

COMMENT ON FUNCTION public.is_user_member_of_restaurant(UUID) IS 
'Verifica se usuário é membro de um restaurante específico. Usado em validações.';

-- ============================================================================
-- NOTA: user_restaurant_ids() já existe e retorna SETOF UUID
-- Esta migration adiciona funções complementares para diferentes casos de uso
-- ============================================================================
;
