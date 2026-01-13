-- 🚀 SCRIPT DE VALIDAÇÃO: P0 MIGRATIONS
-- Execute após aplicar o script consolidado
-- Se tudo estiver OK, você verá resultados positivos em cada query
-- QUERY 1: Verificar sync_metadata e version em gm_orders
SELECT column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'gm_orders'
    AND column_name IN ('sync_metadata', 'version');
-- Esperado: sync_metadata (jsonb), version (integer, NO nullable)
-- QUERY 2: Verificar índices críticos
SELECT tablename,
    indexname
FROM pg_indexes
WHERE tablename = 'gm_orders'
    AND indexname IN (
        'idx_gm_orders_sync_local_id',
        'idx_gm_orders_version'
    );
-- Esperado: Ambas as linhas devem aparecer
-- QUERY 3: Verificar trigger de versionamento
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trigger_increment_order_version';
-- Esperado: 1 linha
-- QUERY 4: Verificar função create_order_atomic (assinatura nova)
SELECT proname,
    pg_get_function_arguments(oid) as args
FROM pg_proc
WHERE proname = 'create_order_atomic';
-- Esperado: args deve incluir "p_sync_metadata jsonb DEFAULT NULL::jsonb"
-- QUERY 5: Verificar função check_open_orders_with_lock
SELECT proname
FROM pg_proc
WHERE proname = 'check_open_orders_with_lock';
-- Esperado: 1 linha
-- QUERY 6: Verificar retry_count em fiscal_event_store
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fiscal_event_store'
    AND column_name = 'retry_count';
-- Esperado: 1 linha
-- Resumo Final (Executar para ver status geral)
SELECT CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'gm_orders'
                AND column_name = 'sync_metadata'
        ) THEN '✅ OK'
        ELSE '❌ MISSING'
    END as sync_metadata,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'gm_orders'
                AND column_name = 'version'
        ) THEN '✅ OK'
        ELSE '❌ MISSING'
    END as version_col,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE indexname = 'idx_gm_orders_sync_local_id'
        ) THEN '✅ OK'
        ELSE '❌ MISSING'
    END as idx_sync,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM pg_proc
            WHERE proname = 'check_open_orders_with_lock'
        ) THEN '✅ OK'
        ELSE '❌ MISSING'
    END as rpc_lock;