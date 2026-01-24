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
