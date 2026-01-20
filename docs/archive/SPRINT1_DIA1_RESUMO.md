# SPRINT 1 — DIA 1 — RESUMO EXECUTIVO

**Data:** 2026-01-17  
**Objetivo:** Tornar sistema seguro para multi-tenant (RLS + Race Conditions)  
**Status:** ✅ **MANHÃ COMPLETA** | ⏳ **TARDE EM PROGRESSO**

---

## ✅ O QUE FOI FEITO (MANHÃ - 4h)

### 1. **RLS Policies Completas** (`20260117000001_rls_orders.sql`)

**Tabelas Protegidas:**
- ✅ `gm_orders` — SELECT, INSERT, UPDATE, DELETE
- ✅ `gm_order_items` — SELECT, INSERT, UPDATE, DELETE
- ✅ `gm_tables` — SELECT, INSERT, UPDATE, DELETE
- ✅ `gm_cash_registers` — SELECT, INSERT, UPDATE, DELETE
- ✅ `gm_payments` — SELECT, INSERT, UPDATE, DELETE

**Helper Function:**
- ✅ `auth.user_restaurant_ids()` — Retorna todos os `restaurant_id` do usuário autenticado
  - Suporta ambos `gm_restaurant_memberships` e `restaurant_members` (compatibilidade)

**Performance Indexes:**
- ✅ `idx_gm_orders_restaurant_id_status` — Hot path para KDS/TPV
- ✅ `idx_gm_order_items_order_id` — Busca de items
- ✅ `idx_gm_tables_restaurant_id` — Lista de mesas
- ✅ `idx_gm_cash_registers_restaurant_id` — Caixas
- ✅ `idx_gm_payments_order_id` — Histórico de pagamentos
- ✅ `idx_gm_restaurant_memberships_user_status` — Acelera RLS checks

**Impacto:**
- 🔒 **SEGURANÇA:** Restaurantes não podem ver dados uns dos outros
- ⚡ **PERFORMANCE:** Queries RLS otimizadas com índices

---

### 2. **Prevenção de Race Conditions** (`20260117000002_prevent_race_conditions.sql`)

**Unique Constraints:**
- ✅ `idx_gm_orders_active_table` — Apenas 1 pedido ativo por mesa
  - Aplica apenas para status `OPEN`, `IN_PREP`, `READY`
  - Não bloqueia pedidos históricos (PAID, CANCELLED)
- ✅ `idx_gm_cash_registers_one_open` — Apenas 1 caixa aberto por restaurante
  - Aplica apenas para status `OPEN`

**Performance Indexes:**
- ✅ `idx_gm_orders_restaurant_active` — Hot path: pedidos ativos por restaurante
- ✅ `idx_gm_order_items_order_status` — Items por pedido (não deletados)
- ✅ `idx_gm_orders_restaurant_date_status` — Relatórios diários
- ✅ `idx_gm_payments_order_created` — Histórico de pagamentos

**Impacto:**
- ⚡ **ESTABILIDADE:** Previne conflitos quando dois garçons criam pedidos simultaneamente
- 🔒 **INTEGRIDADE:** Garante apenas 1 caixa aberto por restaurante

---

### 3. **OrderEngine — Tratamento de Race Conditions**

**Atualização:**
- ✅ Detecta erro `23505` (unique violation)
- ✅ Suporta ambos os nomes de índice:
  - `idx_gm_orders_active_table` (novo)
  - `idx_one_open_order_per_table` (legado)
- ✅ Mensagem de erro clara: "Mesa X já possui pedido ativo"

**Código:**
```typescript
if (error.code === '23505' && (
    error.message?.includes('idx_gm_orders_active_table') ||
    error.message?.includes('idx_one_open_order_per_table')
)) {
    throw new OrderEngineError(
        `Mesa ${input.tableNumber || input.tableId || 'N/A'} já possui pedido ativo. Use o pedido existente.`,
        'TABLE_HAS_ACTIVE_ORDER'
    );
}
```

**Impacto:**
- 🎯 **UX:** Usuário recebe mensagem clara quando tenta criar pedido duplicado
- 🔒 **SEGURANÇA:** Previne criação acidental de pedidos duplicados

---

### 4. **Tab Isolation — Status**

**Verificação:**
- ✅ `TabIsolatedStorage.ts` já existe e está em uso
- ✅ Migração automática de `localStorage` → `sessionStorage`
- ✅ Isolamento por tab implementado

**Arquivos já migrados:**
- ✅ `FlowGate.tsx` — `chefiapp_active_tenant`, `chefiapp_sovereign_level`
- ✅ `OrderContextReal.tsx` — `chefiapp_active_order_id`
- ✅ `TenantContext.tsx` — Usa `TenantContext` (não localStorage)

**Arquivos que ainda usam localStorage (verificar):**
- ⚠️ `OrderContext.tsx` (legado?)
- ⚠️ `useRealMenu.ts`
- ⚠️ `KDSAlerts.ts`
- ⚠️ `KDSStandalone.tsx`

**Impacto:**
- 🔒 **MULTI-TAB:** Cada tab opera independentemente
- ⚡ **ESTABILIDADE:** Previne conflitos quando múltiplos usuários abrem o sistema

---

## ⏳ O QUE FALTA (TARDE - 4h)

### 1. **Deploy Migrations** (1h)
```bash
supabase db push
```

**Verificações:**
- [ ] Migrations aplicadas sem erros
- [ ] RLS policies ativas
- [ ] Índices criados
- [ ] Helper function `auth.user_restaurant_ids()` funcionando

---

### 2. **Migrar localStorage Restante** (2h)

**Arquivos a verificar:**
- [ ] `merchant-portal/src/pages/TPV/context/OrderContext.tsx`
- [ ] `merchant-portal/src/pages/TPV/hooks/useRealMenu.ts`
- [ ] `merchant-portal/src/pages/TPV/KDS/KDSAlerts.ts`
- [ ] `merchant-portal/src/pages/TPV/KDS/KDSStandalone.tsx`

**Ação:**
- Substituir `localStorage.getItem/setItem/removeItem` por `getTabIsolated/setTabIsolated/removeTabIsolated`
- Testar isolamento por tab

---

### 3. **Testes de Segurança** (1h)

**Testes Manuais:**
- [ ] **RLS:** Usuário A não vê pedidos de restaurante B
- [ ] **Race Condition:** Dois garçons tentam criar pedido na mesma mesa simultaneamente
- [ ] **Multi-Tab:** Dois tabs com restaurantes diferentes não conflitam

**Testes Automatizados (futuro):**
- [ ] Teste E2E de isolamento multi-tenant
- [ ] Teste de race condition (concurrent order creation)

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes | Depois | Status |
|---------|-------|--------|--------|
| **RLS Ativo** | ❌ Parcial | ✅ Completo | ✅ |
| **Race Conditions** | ❌ Possível | ✅ Prevenido | ✅ |
| **Tab Isolation** | ⚠️ Parcial | ✅ Completo | ⏳ |
| **Mensagens de Erro** | ❌ Genéricas | ✅ Específicas | ✅ |

---

## 🚨 RISCOS E MITIGAÇÕES

### Risco 1: Conflito com Migrations Existentes
**Mitigação:**
- ✅ Verificado compatibilidade com `20260111_enable_rls_and_indexes.sql`
- ✅ Helper function suporta ambos os nomes de tabela
- ✅ Índices usam `IF NOT EXISTS` (idempotente)

### Risco 2: Performance Degradada por RLS
**Mitigação:**
- ✅ Índices criados para acelerar RLS checks
- ✅ Helper function usa `SECURITY DEFINER` (otimizado)
- ⚠️ **Monitorar:** Queries > 200ms após deploy

### Risco 3: Breaking Changes em localStorage
**Mitigação:**
- ✅ `TabIsolatedStorage` faz migração automática
- ✅ Fallback para `localStorage` durante transição
- ⚠️ **Testar:** Abrir sistema em múltiplos tabs

---

## 📋 CHECKLIST FINAL

### Segurança
- [x] RLS policies criadas
- [x] Helper function criada
- [x] Performance indexes criados
- [ ] Migrations deployadas
- [ ] Testes de isolamento passando

### Estabilidade
- [x] Unique constraints criados
- [x] OrderEngine trata race conditions
- [x] Performance indexes criados
- [ ] Testes de race condition passando

### Tab Isolation
- [x] TabIsolatedStorage existe
- [x] Migração automática implementada
- [ ] Todos os arquivos migrados
- [ ] Testes de multi-tab passando

---

## 🎯 PRÓXIMOS PASSOS

1. **Deploy migrations** → `supabase db push`
2. **Migrar localStorage restante** → Substituir em 4 arquivos
3. **Testes manuais** → RLS + Race Conditions + Multi-Tab
4. **Commit** → `git commit -m "fix(critical): RLS + race conditions + tab isolation"`

---

**Tempo Estimado Restante:** 4h (Tarde)  
**Status Geral:** 🟢 **50% COMPLETO** (Manhã ✅ | Tarde ⏳)
