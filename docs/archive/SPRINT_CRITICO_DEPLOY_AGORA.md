# 🚨 SPRINT CRÍTICO: "DEPLOY THE DAMN CODE"

**Data:** 2026-01-16  
**Prioridade:** 🔴 **CRÍTICA**  
**Duração Estimada:** 6 horas  
**Status:** ⚠️ **NÃO INICIADO**

---

## ⚠️ VEREDICTO DA AUDITORIA 4

**NENHUMA DÍVIDA FOI PAGA EM PRODUÇÃO.**

- ✅ Código foi criado
- ❌ Código NÃO foi deployado
- ❌ Sistema em produção = mesmo estado de antes

---

## 📊 ESTADO REAL VERIFICADO

### Migrations
- ✅ `20260117000001_rls_orders.sql` — **EXISTE** (222 linhas)
- ✅ `20260117000002_prevent_race_conditions.sql` — **EXISTE**
- ❓ **Status de Deploy:** **NÃO VERIFICADO**

### TabIsolatedStorage
- ✅ `TabIsolatedStorage.ts` — **EXISTE** (119 linhas)
- ✅ **36 ocorrências** de uso encontradas
- ❌ **163 ocorrências** de `localStorage` direto ainda existem
- ⚠️ **Adoção:** ~18% (36/199)

### RLS Policies
- ✅ Migration criada
- ❓ **Status em produção:** **NÃO VERIFICADO**

---

## 🎯 PLANO DE AÇÃO IMEDIATO

### FASE 1: VERIFICAÇÃO E DEPLOY (2h)

#### 1.1 Verificar Status Atual (30 min)
```bash
# Verificar migrations não aplicadas
supabase migration list

# Verificar status do banco
supabase db diff

# Verificar se RLS está ativo
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'gm_%';"
```

#### 1.2 Commit das Migrations (15 min)
```bash
# Verificar se migrations estão no git
git status supabase/migrations/20260117000001_rls_orders.sql
git status supabase/migrations/20260117000002_prevent_race_conditions.sql

# Se não commitadas, commitar
git add supabase/migrations/20260117000001_rls_orders.sql
git add supabase/migrations/20260117000002_prevent_race_conditions.sql
git commit -m "fix(critical): RLS policies + race condition prevention"
```

#### 1.3 Deploy para Supabase (15 min)
```bash
# Deploy migrations
supabase db push

# Verificar deployment
supabase migration list

# Verificar se RLS está ativo após deploy
psql $DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('gm_orders', 'gm_order_items', 'gm_tables', 'gm_cash_registers', 'gm_payments');"
```

#### 1.4 Verificar Indexes (15 min)
```bash
# Verificar se unique index foi criado
psql $DATABASE_URL -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'gm_orders' AND indexname LIKE '%active_table%';"
```

---

### FASE 2: VALIDAÇÃO DE SEGURANÇA (4h)

#### 2.1 Teste RLS Multi-Tenant (2h)

**Setup:**
1. Criar 2 restaurantes de teste (Restaurant A e Restaurant B)
2. Criar 2 usuários (User A e User B)
3. Associar User A ao Restaurant A
4. Associar User B ao Restaurant B

**Teste 1: Isolamento de Dados**
```sql
-- Como User A, tentar ler orders do Restaurant B
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-a-id';

SELECT * FROM gm_orders WHERE restaurant_id = 'restaurant-b-id';
-- Esperado: 0 rows (RLS bloqueia)
```

**Teste 2: Acesso Negado**
```sql
-- Como User A, tentar criar order para Restaurant B
INSERT INTO gm_orders (restaurant_id, ...) VALUES ('restaurant-b-id', ...);
-- Esperado: ERRO (RLS bloqueia)
```

**Teste 3: Acesso Permitido**
```sql
-- Como User A, criar order para Restaurant A
INSERT INTO gm_orders (restaurant_id, ...) VALUES ('restaurant-a-id', ...);
-- Esperado: SUCESSO
```

#### 2.2 Teste Race Condition (1h)

**Setup:**
1. Abrir 2 navegadores (ou usar 2 sessões)
2. Ambos logados como mesmo usuário
3. Mesma mesa (table_id = 'test-table-1')

**Teste:**
1. **Navegador 1:** Criar order para mesa 1
2. **Navegador 2:** Tentar criar order para mesa 1 simultaneamente
3. **Esperado:** Navegador 2 recebe erro `TABLE_HAS_ACTIVE_ORDER`

**Validação:**
```sql
-- Verificar que apenas 1 order foi criada
SELECT COUNT(*) FROM gm_orders WHERE table_id = 'test-table-1' AND status IN ('OPEN', 'IN_PREP', 'READY');
-- Esperado: 1
```

#### 2.3 Teste Performance (1h)

**Verificar Query Plans:**
```sql
-- Verificar uso de indexes
EXPLAIN ANALYZE
SELECT * FROM gm_orders 
WHERE restaurant_id = 'xxx' AND status IN ('OPEN', 'IN_PREP', 'READY');

-- Verificar uso de unique index
EXPLAIN ANALYZE
SELECT * FROM gm_orders 
WHERE restaurant_id = 'xxx' AND table_id = 'yyy' AND status IN ('OPEN', 'IN_PREP', 'READY');
```

**Métricas Esperadas:**
- Index scan usado (não sequential scan)
- Tempo de query < 10ms
- 7 indexes criados e ativos

---

### FASE 3: ADOÇÃO DO TabIsolatedStorage (8h)

#### 3.1 Priorização (1h)

**Arquivos Críticos (Prioridade 1):**
1. `merchant-portal/src/pages/TPV/TPV.tsx` — 3 calls
2. `merchant-portal/src/core/flow/FlowGate.tsx` — 2 calls
3. `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` — 5 calls

**Arquivos Importantes (Prioridade 2):**
- Arquivos de onboarding (10 calls)
- Arquivos de autenticação (5 calls)

**Arquivos Restantes (Prioridade 3):**
- 145 calls restantes

#### 3.2 Refatoração (6h)

**Padrão de Refatoração:**
```typescript
// ANTES
const restaurantId = localStorage.getItem('chefiapp_restaurant_id');

// DEPOIS
import { getTabIsolated, setTabIsolated } from '@/core/storage/TabIsolatedStorage';
const restaurantId = getTabIsolated('chefiapp_restaurant_id');
```

**Ordem de Execução:**
1. **TPV.tsx** (1h)
2. **FlowGate.tsx** (30 min)
3. **OrderContextReal.tsx** (1h)
4. **Onboarding** (2h)
5. **Resto** (1.5h)

#### 3.3 Validação (1h)

**Testes:**
1. Abrir 2 abas com diferentes restaurantes
2. Verificar isolamento de dados
3. Verificar que mudanças em uma aba não afetam outra

---

## 📊 MÉTRICAS DE SUCESSO

### Após FASE 1
- ✅ Migrations deployadas
- ✅ RLS ativo em produção
- ✅ Unique index criado

### Após FASE 2
- ✅ RLS testado e validado
- ✅ Race conditions prevenidas
- ✅ Performance validada

### Após FASE 3
- ✅ 0 ocorrências de `localStorage` direto
- ✅ 100% adoção de `TabIsolatedStorage`
- ✅ Isolamento multi-aba garantido

---

## 🚨 BLOQUEADORES CRÍTICOS

| Bloqueador | Status Audit 2 | Status Audit 3 | Status Audit 4 | Ação |
|------------|----------------|----------------|----------------|------|
| **1. RLS Ausente** | ❌ Critical | ✅ Code ready | ❌ NOT DEPLOYED | 🚨 DEPLOY NOW |
| **2. Race Conditions** | ❌ Critical | ✅ Code ready | ❌ NOT DEPLOYED | 🚨 DEPLOY NOW |
| **3. Tab Isolation** | ❌ Missing | ⚠️ Partial (18%) | ⚠️ Partial (18%) | 🟡 REFACTOR |

---

## 📈 NOTA ESPERADA PÓS-DEPLOY

| Dimensão | Audit 4 (Atual) | Pós-Deploy | Melhoria |
|----------|-----------------|------------|----------|
| **Nota Geral** | 4.9/10 | 7.2/10 | +47% |
| **Segurança (RLS)** | 2/10 | 9/10 | +350% |
| **Race Conditions** | 3/10 | 9/10 | +200% |
| **Multi-tenant** | 2/10 | 9/10 | +350% |

---

## ✅ CHECKLIST DE EXECUÇÃO

### FASE 1: Deploy
- [ ] Verificar status atual das migrations
- [ ] Commit migrations (se necessário)
- [ ] Deploy para Supabase
- [ ] Verificar RLS ativo
- [ ] Verificar indexes criados

### FASE 2: Validação
- [ ] Teste RLS multi-tenant
- [ ] Teste race condition
- [ ] Teste performance
- [ ] Documentar resultados

### FASE 3: Refatoração
- [ ] Refatorar TPV.tsx
- [ ] Refatorar FlowGate.tsx
- [ ] Refatorar OrderContextReal.tsx
- [ ] Refatorar arquivos de onboarding
- [ ] Refatorar resto do codebase
- [ ] Validar isolamento multi-aba

---

## 🎯 PRÓXIMOS PASSOS APÓS SPRINT

### Curto Prazo (Semana 1-2)
- ✅ RLS deployado e testado
- ✅ Race conditions resolvidas
- ✅ Tab isolation ativo (100%)

**Nota esperada:** 7.2/10

### Médio Prazo (Próximos 2 meses)
- ⏳ Offline Mode (40h)
- ⏳ Split Payment (16h)
- ⏳ Fiscal Printing real (24h)

**Nota esperada:** 8.5/10

---

## 🚨 AÇÃO OBRIGATÓRIA

**STATUS ATUAL:** 🔴 CÓDIGO ESCRITO, NADA DEPLOYADO  
**AÇÃO:** 🚨 **DEPLOY NOW**

---

**Construído com 💛 pelo Goldmonkey Empire**  
**Data:** 2026-01-16  
**Próxima Auditoria:** Após deploy (prevista para 2026-01-17)
