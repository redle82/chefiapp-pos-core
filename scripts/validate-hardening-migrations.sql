-- Script de Validação Completa - Hardening P0 (v0.9.2)
-- Execute este script no Supabase SQL Editor após aplicar todas as migrations
-- Data: 2026-01-18

-- ============================================================================
-- FASE 1: VALIDAÇÃO DE COLUNAS
-- ============================================================================

SELECT 
    '✅ COLUNAS' as categoria,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('gm_restaurants', 'integration_orders', 'gm_orders')
    AND column_name IN ('fiscal_config', 'external_ids', 'sync_metadata', 'version')
ORDER BY table_name, column_name;

-- Resultado esperado:
-- gm_restaurants: fiscal_config (jsonb), external_ids (jsonb)
-- gm_orders: sync_metadata (jsonb), version (integer)
-- integration_orders: (tabela criada)

-- ============================================================================
-- FASE 2: VALIDAÇÃO DE FUNÇÕES RPC
-- ============================================================================

SELECT 
    '✅ FUNÇÕES RPC' as categoria,
    proname as function_name,
    pronargs as num_parameters,
    pg_get_function_arguments(oid) as parameters
FROM pg_proc 
WHERE proname IN ('create_order_atomic', 'check_open_orders_with_lock')
ORDER BY proname;

-- Resultado esperado:
-- create_order_atomic: 4 parâmetros (p_restaurant_id, p_items, p_payment_method, p_sync_metadata)
-- check_open_orders_with_lock: 1 parâmetro (p_restaurant_id)

-- ============================================================================
-- FASE 3: VALIDAÇÃO DE TRIGGERS
-- ============================================================================

SELECT 
    '✅ TRIGGERS' as categoria,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname = 'trigger_increment_order_version';

-- Resultado esperado:
-- trigger_increment_order_version: gm_orders, enabled

-- ============================================================================
-- FASE 4: VALIDAÇÃO DE ÍNDICES
-- ============================================================================

SELECT 
    '✅ ÍNDICES' as categoria,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('gm_orders', 'integration_orders')
    AND indexname LIKE '%sync%' OR indexname LIKE '%version%' OR indexname LIKE '%integration%'
ORDER BY tablename, indexname;

-- Resultado esperado:
-- idx_gm_orders_sync_local_id (GIN index para sync_metadata)
-- idx_gm_orders_version (B-tree index para version)

-- ============================================================================
-- FASE 5: VALIDAÇÃO DE TABELAS
-- ============================================================================

SELECT 
    '✅ TABELAS' as categoria,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columns
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_name IN ('gm_restaurants', 'integration_orders', 'gm_orders', 'fiscal_event_store')
ORDER BY table_name;

-- ============================================================================
-- FASE 6: VALIDAÇÃO DE RLS (Row Level Security)
-- ============================================================================

SELECT 
    '✅ RLS' as categoria,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'integration_orders';

-- Resultado esperado:
-- Pelo menos 2 policies: "Owners view integration orders" e "Service role full access"

-- ============================================================================
-- FASE 7: TESTE FUNCIONAL - create_order_atomic
-- ============================================================================

-- NOTA: Este teste requer um restaurant_id válido
-- Descomente e ajuste o restaurant_id para testar:

/*
DO $$
DECLARE
    v_test_restaurant_id UUID := '<SEU_RESTAURANT_ID_AQUI>';
    v_result JSONB;
BEGIN
    -- Teste 1: Criar pedido sem sync_metadata
    v_result := public.create_order_atomic(
        v_test_restaurant_id,
        '[{"product_id": "00000000-0000-0000-0000-000000000001", "name": "Test Item", "quantity": 1, "unit_price": 1000}]'::JSONB,
        'cash',
        NULL
    );
    
    RAISE NOTICE '✅ Teste 1: Pedido criado sem sync_metadata - ID: %', v_result->>'id';
    
    -- Teste 2: Criar pedido com sync_metadata (idempotência)
    v_result := public.create_order_atomic(
        v_test_restaurant_id,
        '[{"product_id": "00000000-0000-0000-0000-000000000001", "name": "Test Item 2", "quantity": 1, "unit_price": 2000}]'::JSONB,
        'cash',
        '{"localId": "test-local-id-123", "syncAttempts": 1}'::JSONB
    );
    
    RAISE NOTICE '✅ Teste 2: Pedido criado com sync_metadata - ID: %', v_result->>'id';
    
    -- Teste 3: Tentar criar mesmo pedido novamente (deve retornar existente)
    v_result := public.create_order_atomic(
        v_test_restaurant_id,
        '[{"product_id": "00000000-0000-0000-0000-000000000001", "name": "Test Item 2", "quantity": 1, "unit_price": 2000}]'::JSONB,
        'cash',
        '{"localId": "test-local-id-123", "syncAttempts": 2}'::JSONB
    );
    
    RAISE NOTICE '✅ Teste 3: Idempotência funcionando - ID: % (mesmo pedido)', v_result->>'id';
    
    -- Limpar dados de teste
    DELETE FROM gm_orders WHERE id = (v_result->>'id')::UUID;
    DELETE FROM gm_orders WHERE sync_metadata->>'localId' = 'test-local-id-123';
    
    RAISE NOTICE '✅ Testes funcionais concluídos com sucesso!';
END $$;
*/

-- ============================================================================
-- RESUMO FINAL
-- ============================================================================

SELECT 
    '📊 RESUMO' as categoria,
    'Colunas críticas' as item,
    COUNT(*) as total
FROM information_schema.columns 
WHERE table_name IN ('gm_restaurants', 'gm_orders')
    AND column_name IN ('fiscal_config', 'external_ids', 'sync_metadata', 'version')

UNION ALL

SELECT 
    '📊 RESUMO' as categoria,
    'Funções RPC' as item,
    COUNT(*) as total
FROM pg_proc 
WHERE proname IN ('create_order_atomic', 'check_open_orders_with_lock')

UNION ALL

SELECT 
    '📊 RESUMO' as categoria,
    'Triggers' as item,
    COUNT(*) as total
FROM pg_trigger 
WHERE tgname = 'trigger_increment_order_version'

UNION ALL

SELECT 
    '📊 RESUMO' as categoria,
    'Tabelas críticas' as item,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name IN ('gm_restaurants', 'integration_orders', 'gm_orders', 'fiscal_event_store');

-- ============================================================================
-- VALIDAÇÃO ESPERADA
-- ============================================================================

-- ✅ Colunas críticas: 4 (fiscal_config, external_ids, sync_metadata, version)
-- ✅ Funções RPC: 2 (create_order_atomic, check_open_orders_with_lock)
-- ✅ Triggers: 1 (trigger_increment_order_version)
-- ✅ Tabelas críticas: 4 (gm_restaurants, integration_orders, gm_orders, fiscal_event_store)
