# 🚀 APLICAR MIGRATIONS - CRM/LOYALTY

**Data:** 16 Janeiro 2026  
**Status:** ⚠️ **CRÍTICO - Aplicar antes de validar CRM/Loyalty**

---

## 📋 MIGRATION PENDENTE

**Arquivo:** `supabase/migrations/20260116000003_customer_loyalty.sql`

**Conteúdo:**
- Tabela `customer_profiles` (CRM)
- Tabela `loyalty_tiers` (Tiers de fidelidade)
- Tabela `loyalty_cards` (Cartões de fidelidade)
- Tabela `loyalty_rewards` (Recompensas)
- Tabela `loyalty_transactions` (Transações)
- RLS policies para todas as tabelas
- Indexes de performance

---

## 🔧 COMO APLICAR

### Opção 1: Via Supabase Dashboard (Recomendado)

1. **Acessar Supabase Dashboard**
   - Ir em: https://supabase.com/dashboard
   - Selecionar o projeto

2. **Abrir SQL Editor**
   - Clicar em "SQL Editor" no menu lateral
   - Clicar em "New Query"

3. **Copiar e Colar**
   - Abrir arquivo: `supabase/migrations/20260116000003_customer_loyalty.sql`
   - Copiar todo o conteúdo
   - Colar no SQL Editor

4. **Executar**
   - Clicar em "Run" ou pressionar `Ctrl+Enter`
   - Aguardar execução completa

5. **Validar**
   - Verificar se não há erros
   - Verificar se tabelas foram criadas:
     ```sql
     SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN (
       'customer_profiles',
       'loyalty_tiers',
       'loyalty_cards',
       'loyalty_rewards',
       'loyalty_transactions'
     );
     ```

### Opção 2: Via Supabase CLI

```bash
# 1. Login (se ainda não fez)
supabase login

# 2. Link ao projeto (se ainda não fez)
supabase link --project-ref YOUR_PROJECT_REF

# 3. Aplicar migration
supabase db push
```

---

## ✅ VALIDAÇÃO PÓS-APLICAÇÃO

### 1. Verificar Tabelas Criadas

```sql
SELECT 
    table_name,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVO'
        ELSE '❌ RLS INATIVO'
    END as rls_status
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'customer_profiles',
    'loyalty_tiers',
    'loyalty_cards',
    'loyalty_rewards',
    'loyalty_transactions'
  )
ORDER BY t.tablename;
```

### 2. Verificar RLS Policies

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'customer_profiles',
    'loyalty_tiers',
    'loyalty_cards',
    'loyalty_rewards',
    'loyalty_transactions'
  )
ORDER BY tablename, policyname;
```

### 3. Verificar Indexes

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'customer_profiles',
    'loyalty_tiers',
    'loyalty_cards',
    'loyalty_rewards',
    'loyalty_transactions'
  )
ORDER BY tablename, indexname;
```

### 4. Testar Criação de Cliente

```sql
-- Inserir cliente de teste (substituir restaurant_id)
INSERT INTO public.customer_profiles (
    restaurant_id,
    email,
    phone,
    full_name
) VALUES (
    'YOUR_RESTAURANT_ID',
    'test@example.com',
    '912345678',
    'Cliente Teste'
) RETURNING *;
```

### 5. Testar Criação de Loyalty Card

```sql
-- Inserir loyalty card de teste (substituir IDs)
INSERT INTO public.loyalty_cards (
    restaurant_id,
    customer_id,
    current_points,
    current_tier_id
) VALUES (
    'YOUR_RESTAURANT_ID',
    'YOUR_CUSTOMER_ID',
    0,
    (SELECT id FROM public.loyalty_tiers WHERE name = 'Silver' LIMIT 1)
) RETURNING *;
```

---

## 🚨 PROBLEMAS COMUNS

### Erro: "relation already exists"
- **Causa:** Migration já foi aplicada anteriormente
- **Solução:** Verificar se tabelas já existem. Se sim, migration já está aplicada.

### Erro: "permission denied"
- **Causa:** Usuário não tem permissão para criar tabelas
- **Solução:** Usar service role key ou verificar permissões do usuário.

### Erro: "foreign key constraint"
- **Causa:** Tabela referenciada não existe
- **Solução:** Verificar se `gm_restaurants` existe e tem dados.

---

## 📚 PRÓXIMOS PASSOS

Após aplicar a migration:

1. ✅ Validar CRM/Loyalty no TPV
2. ✅ Testar criação automática de cliente
3. ✅ Testar adição de pontos
4. ✅ Verificar UI de Clientes e Fidelidade

---

**Última atualização:** 2026-01-16  
**Status:** ⚠️ **CRÍTICO - Aplicar antes de validar**
