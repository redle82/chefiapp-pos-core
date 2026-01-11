# 🚀 IMPLEMENTAÇÃO — BLOQUEADORES CRÍTICOS

**Data de Início:** 2026-01-15  
**Status:** 🟢 **EM PROGRESSO**

---

## ✅ COMPLETO

### 1. Gestão de Mesas via UI (8h) — ✅ **COMPLETO**

**Arquivos Criados:**
- ✅ `merchant-portal/src/pages/Settings/TableManager.tsx` — UI completa de gestão
- ✅ `supabase/migrations/20260116000000_add_seats_to_tables.sql` — Migration para campo `seats`

**Arquivos Modificados:**
- ✅ `merchant-portal/src/pages/Settings/Settings.tsx` — Integrado TableManager
- ✅ `merchant-portal/src/pages/TPV/context/TableContext.tsx` — Atualizado para usar `useTenant()`

**Funcionalidades:**
- ✅ Criar mesas (número, capacidade, status)
- ✅ Editar mesas existentes
- ✅ Deletar mesas (com validação de pedidos ativos)
- ✅ Listar todas as mesas
- ✅ Validação de número duplicado
- ✅ Integração com TableContext e TPV

**Status:** ✅ **PRONTO PARA TESTES**

---

## ✅ COMPLETO (CONTINUAÇÃO)

### 2. Melhorar Mensagens de Erro (4h) — ✅ **COMPLETO**

**Arquivos Criados:**
- ✅ `merchant-portal/src/core/errors/ErrorMessages.ts` — Helper centralizado

**Arquivos Modificados:**
- ✅ `merchant-portal/src/pages/TPV/TPV.tsx` — Mensagens específicas
- ✅ `merchant-portal/src/core/tpv/OrderEngine.ts` — Erros detalhados

**Funcionalidades:**
- ✅ Mensagens específicas por tipo de erro
- ✅ Sugestões acionáveis
- ✅ Contexto de erro (mesa, item, pedido)

**Status:** ✅ **PRONTO PARA TESTES**

### 3. Multi-tab Isolation (4h) — ✅ **COMPLETO**

**Arquivos Criados:**
- ✅ `merchant-portal/src/core/storage/TabIsolatedStorage.ts` — Helper de sessionStorage

**Arquivos Modificados:**
- ✅ `merchant-portal/src/core/flow/FlowGate.tsx` — Migrado para tab-isolated
- ✅ `merchant-portal/src/pages/TPV/TPV.tsx` — Migrado para tab-isolated
- ✅ `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` — Migrado

**Funcionalidades:**
- ✅ Migração automática de localStorage → sessionStorage
- ✅ Isolamento por aba do navegador
- ✅ Backward compatibility durante migração

**Status:** ✅ **PRONTO PARA TESTES**

---

## 🟡 EM PROGRESSO

**Objetivo:** Substituir erros genéricos por mensagens específicas e acionáveis.

**Arquivos a Modificar:**
- `merchant-portal/src/pages/TPV/TPV.tsx` — Erros de adicionar item
- `merchant-portal/src/core/tpv/OrderEngine.ts` — Mensagens de erro específicas
- `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` — Tratamento de erros

---

## ⏳ PENDENTE

### 3. Divisão de Conta (16h)
- Schema já existe (`docs/CONSUMPTION_GROUPS.md`)
- Requer UI completa

### 4. Offline Mode Robusto (40h)
- `OfflineOrderContext` existe mas é básico
- Requer IndexedDB + sync completo

### 5. Multi-tab Isolation (4h)
- Migrar localStorage → sessionStorage

### 6. Escala 100+ Restaurantes (8h)
- Connection pooling ou upgrade Supabase

---

**Última atualização:** 2026-01-15
