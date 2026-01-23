-- Script de Verificação: Tabelas de Billing
-- Execute no Supabase SQL Editor

-- 1. Verificar se tabelas existem
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('subscriptions', 'billing_events', 'billing_payments') 
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'billing_events', 'billing_payments')
ORDER BY table_name;

-- 2. Se alguma tabela não existir, você verá apenas as que existem
-- Se todas existirem, você verá 3 linhas com ✅ EXISTE

-- 3. Verificar estrutura da tabela subscriptions (se existir)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 4. Verificar RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'billing_events', 'billing_payments')
ORDER BY tablename, policyname;
