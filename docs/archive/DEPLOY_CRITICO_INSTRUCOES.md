# 🚨 DEPLOY CRÍTICO — INSTRUÇÕES IMEDIATAS

**Data:** 2026-01-16  
**Status:** ✅ Migrations commitadas | ⏳ **AGUARDANDO DEPLOY**

---

## ✅ FASE 1 COMPLETA: Migrations Commitadas

```bash
✅ Commit criado: 56a0754
✅ Arquivos commitados:
   - supabase/migrations/20260117000001_rls_orders.sql
   - supabase/migrations/20260117000002_prevent_race_conditions.sql
```

---

## 🚀 OPÇÃO 1: DEPLOY VIA SUPABASE DASHBOARD (RECOMENDADO - 5 MIN)

### Passo 1: Acessar SQL Editor
1. Abra: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new
2. Ou navegue: Dashboard → SQL Editor → New Query

### Passo 2: Aplicar Migration 1 (RLS)
1. Abra o arquivo: `supabase/migrations/20260117000001_rls_orders.sql`
2. Copie TODO o conteúdo (Cmd+A, Cmd+C)
3. Cole no SQL Editor
4. Execute (Cmd+Enter ou botão Run)
5. Verifique que não há erros

### Passo 3: Aplicar Migration 2 (Race Conditions)
1. Abra o arquivo: `supabase/migrations/20260117000002_prevent_race_conditions.sql`
2. Copie TODO o conteúdo (Cmd+A, Cmd+C)
3. Cole no SQL Editor
4. Execute (Cmd+Enter ou botão Run)
5. Verifique que não há erros

### Passo 4: Validar Deploy
Execute no SQL Editor:

```sql
-- Verificar RLS ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments');

-- Verificar policies criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments')
ORDER BY tablename, policyname;

-- Verificar indexes criados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('gm_orders', 'gm_cash_registers')
  AND (indexname LIKE '%active%' OR indexname LIKE '%race%' OR indexname LIKE '%idempotency%')
ORDER BY tablename, indexname;
```

**Resultado Esperado:**
- ✅ 5 tabelas com `rowsecurity = true`
- ✅ Múltiplas policies criadas (SELECT, INSERT, UPDATE, DELETE)
- ✅ 4+ indexes criados (incluindo unique indexes)

---

## 🚀 OPÇÃO 2: DEPLOY VIA SUPABASE CLI (SE AUTENTICADO)

### Passo 1: Autenticar (se necessário)
```bash
supabase login
```

### Passo 2: Linkar Projeto
```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
supabase link --project-ref qonfbtwsxeggxbkhqnxl
```

### Passo 3: Deploy Migrations
```bash
supabase db push
```

### Passo 4: Verificar
```bash
supabase migration list
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### Teste 1: Verificar RLS Ativo
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments');
```

**Esperado:** Todas as 5 tabelas com `rowsecurity = true`

### Teste 2: Verificar Policies
```sql
SELECT COUNT(*) as policy_count, tablename
FROM pg_policies 
WHERE tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments')
GROUP BY tablename
ORDER BY tablename;
```

**Esperado:** Múltiplas policies por tabela (SELECT, INSERT, UPDATE, DELETE)

### Teste 3: Verificar Unique Indexes
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'gm_orders'
  AND indexname = 'idx_gm_orders_active_table';
```

**Esperado:** Index único criado para prevenir race conditions

### Teste 4: Verificar Helper Function
```sql
SELECT proname, pg_get_function_arguments(oid) 
FROM pg_proc 
WHERE proname = 'user_restaurant_ids';
```

**Esperado:** Função `auth.user_restaurant_ids()` criada

---

## 📊 CHECKLIST DE DEPLOY

- [ ] Migration 1 aplicada (RLS)
- [ ] Migration 2 aplicada (Race Conditions)
- [ ] RLS ativo em 5 tabelas
- [ ] Policies criadas
- [ ] Unique indexes criados
- [ ] Helper function criada
- [ ] Nenhum erro no deploy

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

### FASE 2: Validação de Segurança (4h)
- [ ] Teste RLS multi-tenant
- [ ] Teste race condition
- [ ] Teste performance

### FASE 3: Refatoração localStorage (8h)
- [ ] Refatorar TPV.tsx
- [ ] Refatorar FlowGate.tsx
- [ ] Refatorar OrderContextReal.tsx
- [ ] Refatorar resto do codebase

---

## 🚨 IMPORTÂNCIA CRÍTICA

**Estas migrations são CRÍTICAS para segurança:**
- ✅ **RLS** previne vazamento de dados entre restaurantes
- ✅ **Race Conditions** previne pedidos duplicados
- ✅ **Unique Indexes** garantem integridade de dados

**SEM ESTAS MIGRATIONS:**
- ❌ Sistema vulnerável a vazamento de dados
- ❌ Possibilidade de pedidos duplicados
- ❌ Violação de isolamento multi-tenant

**COM ESTAS MIGRATIONS:**
- ✅ Segurança garantida no banco de dados
- ✅ Race conditions prevenidas
- ✅ Isolamento multi-tenant garantido

---

**AÇÃO OBRIGATÓRIA:** Aplicar migrations AGORA via Dashboard ou CLI

**Construído com 💛 pelo Goldmonkey Empire**  
**Data:** 2026-01-16
