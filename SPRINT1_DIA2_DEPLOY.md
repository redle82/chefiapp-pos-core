# SPRINT 1 — DIA 2 — DEPLOY & TESTES

**Data:** 2026-01-17  
**Objetivo:** Deploy migrations + Testes E2E de segurança  
**Status:** ⏳ **INICIANDO**

---

## 📋 CHECKLIST DE DEPLOY

### 1. **Pré-Deploy: Verificações** (15min)

- [ ] Verificar que migrations não têm erros de sintaxe
- [ ] Verificar compatibilidade com migrations existentes
- [ ] Backup do banco (se possível)
- [ ] Verificar que helper function `auth.user_restaurant_ids()` está correta

**Comandos:**
```bash
# Verificar sintaxe SQL (se tiver supabase CLI)
supabase db lint

# Verificar migrations pendentes
supabase migration list
```

---

### 2. **Deploy Migrations** (30min)

**Opção A: Supabase Dashboard (Recomendado para primeira vez)**
1. Acessar: https://supabase.com/dashboard/project/[PROJECT_ID]
2. Ir em **SQL Editor**
3. Copiar conteúdo de `20260117000001_rls_orders.sql`
4. Executar
5. Copiar conteúdo de `20260117000002_prevent_race_conditions.sql`
6. Executar
7. Verificar que não há erros

**Opção B: Supabase CLI**
```bash
# Se tiver supabase CLI configurado
supabase db push

# Ou aplicar migrations manualmente
supabase migration up
```

**Verificações Pós-Deploy:**
```sql
-- Verificar que RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments');

-- Verificar policies criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments');

-- Verificar índices criados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('gm_orders', 'gm_cash_registers')
  AND indexname LIKE '%active%' OR indexname LIKE '%race%';

-- Testar helper function
SELECT auth.user_restaurant_ids();
```

---

### 3. **Testes Manuais de Segurança** (2h)

Seguir checklist completo em `SPRINT1_DIA1_TESTES_SEGURANCA.md`:

#### 3.1 RLS - Isolamento Multi-Tenant (30min)
- [ ] Teste 1.1: User A não vê pedidos de Restaurant B
- [ ] Teste 1.2: RLS em gm_order_items
- [ ] Teste 1.3: RLS em gm_tables

#### 3.2 Race Conditions (20min)
- [ ] Teste 2.1: Dois garçons na mesma mesa
- [ ] Teste 2.2: Múltiplos caixas abertos

#### 3.3 Tab Isolation (10min)
- [ ] Teste 3.1: Dois tabs com restaurantes diferentes
- [ ] Teste 3.2: Dois tabs com mesmo restaurante

---

### 4. **Validação de Performance** (30min)

**Verificar que queries RLS não degradaram performance:**

```sql
-- Teste de performance: Buscar pedidos ativos
EXPLAIN ANALYZE
SELECT * FROM gm_orders 
WHERE restaurant_id IN (SELECT auth.user_restaurant_ids())
  AND status IN ('OPEN', 'IN_PREP', 'READY');

-- Deve usar índices criados
-- Tempo esperado: < 50ms
```

**Verificar índices estão sendo usados:**
```sql
-- Verificar uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('gm_orders', 'gm_order_items', 'gm_tables')
ORDER BY idx_scan DESC;
```

---

### 5. **Rollback Plan (Se necessário)** (15min)

**Se algo der errado:**

```sql
-- Desabilitar RLS temporariamente (NÃO RECOMENDADO EM PRODUÇÃO)
ALTER TABLE public.gm_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_cash_registers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_payments DISABLE ROW LEVEL SECURITY;

-- Remover policies
DROP POLICY IF EXISTS "users_select_own_restaurant_orders" ON public.gm_orders;
-- ... (repetir para todas as policies)

-- Remover índices (se necessário)
DROP INDEX IF EXISTS idx_gm_orders_active_table;
DROP INDEX IF EXISTS idx_gm_cash_registers_one_open;
```

**⚠️ ATENÇÃO:** Rollback só deve ser feito em emergência. RLS é crítico para segurança.

---

## 📊 RESULTADOS ESPERADOS

| Item | Status | Notas |
|------|--------|-------|
| Migrations deployadas | ⏳ | Aguardando |
| RLS ativo | ⏳ | Aguardando |
| Policies criadas | ⏳ | Aguardando |
| Índices criados | ⏳ | Aguardando |
| Testes RLS passando | ⏳ | Aguardando |
| Testes Race Conditions passando | ⏳ | Aguardando |
| Performance OK | ⏳ | Aguardando |

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. **Documentar resultados** → Atualizar este arquivo
2. **Commit final** → `git commit -m "fix(critical): RLS + race conditions + tab isolation"`
3. **Iniciar DIA 3** → Divisão de Conta (validação)

---

**Tempo Estimado:** 3h  
**Status:** ⏳ **AGUARDANDO DEPLOY**
