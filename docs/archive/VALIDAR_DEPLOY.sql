-- ==============================================================================
-- VALIDAÇÃO PÓS-DEPLOY: RLS + RACE CONDITIONS
-- ==============================================================================
-- Execute estas queries após aplicar DEPLOY_MIGRATIONS_CONSOLIDADO.sql
-- ==============================================================================

-- ==============================================================================
-- TESTE 1: VERIFICAR RLS ATIVO
-- ==============================================================================

SELECT 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVO'
        ELSE '❌ RLS INATIVO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments')
ORDER BY tablename;

-- Esperado: Todas as 5 tabelas com rowsecurity = true

-- ==============================================================================
-- TESTE 2: VERIFICAR POLICIES CRIADAS
-- ==============================================================================

SELECT 
    tablename, 
    policyname,
    CASE 
        WHEN cmd = 'SELECT' THEN '📖 SELECT'
        WHEN cmd = 'INSERT' THEN '➕ INSERT'
        WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
        WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
        ELSE cmd
    END as operation
FROM pg_policies 
WHERE tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments')
ORDER BY tablename, policyname;

-- Esperado: Múltiplas policies por tabela (SELECT, INSERT, UPDATE, DELETE)

-- ==============================================================================
-- TESTE 3: VERIFICAR UNIQUE INDEXES (RACE CONDITIONS)
-- ==============================================================================

SELECT 
    tablename,
    indexname, 
    indexdef,
    CASE 
        WHEN indexdef LIKE '%UNIQUE%' THEN '✅ UNIQUE'
        ELSE '📊 INDEX'
    END as type
FROM pg_indexes 
WHERE tablename IN ('gm_orders', 'gm_cash_registers')
  AND (indexname LIKE '%active%' OR indexname LIKE '%race%' OR indexname LIKE '%idempotency%' OR indexname LIKE '%one_open%')
ORDER BY tablename, indexname;

-- Esperado: 
-- - idx_gm_orders_active_table (UNIQUE)
-- - idx_gm_cash_registers_one_open (UNIQUE)
-- - idx_gm_payments_idempotency (UNIQUE, se coluna existir)

-- ==============================================================================
-- TESTE 4: VERIFICAR HELPER FUNCTION
-- ==============================================================================

SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    CASE 
        WHEN proname = 'user_restaurant_ids' THEN '✅ CRIADA'
        ELSE '❌ NÃO ENCONTRADA'
    END as status
FROM pg_proc 
WHERE proname = 'user_restaurant_ids'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');

-- Esperado: Função auth.user_restaurant_ids() criada

-- ==============================================================================
-- TESTE 5: VERIFICAR PERFORMANCE INDEXES
-- ==============================================================================

SELECT 
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE '%active%' THEN '🔥 Hot Path'
        WHEN indexname LIKE '%order%' THEN '📦 Order Query'
        WHEN indexname LIKE '%date%' THEN '📅 Date Query'
        ELSE '📊 General'
    END as purpose
FROM pg_indexes 
WHERE tablename IN ('gm_orders', 'gm_order_items', 'gm_payments')
  AND (indexname LIKE '%restaurant_active%' 
       OR indexname LIKE '%order_status%'
       OR indexname LIKE '%date_status%'
       OR indexname LIKE '%order_created%')
ORDER BY tablename, indexname;

-- Esperado: 4+ performance indexes criados

-- ==============================================================================
-- TESTE 6: RESUMO GERAL
-- ==============================================================================

SELECT 
    'RLS Policies' as metric,
    COUNT(*)::text as value,
    CASE 
        WHEN COUNT(*) >= 20 THEN '✅ OK'
        ELSE '⚠️ INCOMPLETO'
    END as status
FROM pg_policies 
WHERE tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments')

UNION ALL

SELECT 
    'RLS Enabled Tables' as metric,
    COUNT(*)::text as value,
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ OK'
        ELSE '⚠️ INCOMPLETO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments')
  AND rowsecurity = true

UNION ALL

SELECT 
    'Unique Indexes (Race Conditions)' as metric,
    COUNT(*)::text as value,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ OK'
        ELSE '⚠️ INCOMPLETO'
    END as status
FROM pg_indexes 
WHERE tablename IN ('gm_orders', 'gm_cash_registers')
  AND indexdef LIKE '%UNIQUE%'
  AND (indexname LIKE '%active%' OR indexname LIKE '%one_open%')

UNION ALL

SELECT 
    'Performance Indexes' as metric,
    COUNT(*)::text as value,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ OK'
        ELSE '⚠️ INCOMPLETO'
    END as status
FROM pg_indexes 
WHERE tablename IN ('gm_orders', 'gm_order_items', 'gm_payments')
  AND (indexname LIKE '%restaurant_active%' 
       OR indexname LIKE '%order_status%'
       OR indexname LIKE '%date_status%'
       OR indexname LIKE '%order_created%');

-- ==============================================================================
-- VALIDAÇÃO COMPLETA
-- ==============================================================================
-- Se todos os testes retornarem ✅ OK, o deploy foi bem-sucedido!
-- ==============================================================================
