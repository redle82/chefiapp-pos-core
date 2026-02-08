**Status:** ARCHIVED  
**Reason:** Refatoração concluída; estado atual documentado em STATE_PURE_DOCKER_APP_LAYER.md  
**Arquivado em:** 2026-01-28

---

# Fase 3.4 — Mapeamento de Contexts

**Data:** 2026-01-26  
**Status:** 🔍 EM MAPEAMENTO

---

## 📊 Contexts de Order State Encontrados

### 1. OrderContext.tsx
**Localização:** `merchant-portal/src/pages/TPV/context/OrderContext.tsx`

**Características:**
- Exporta `OrderContext` (token do Context)
- Exporta `OrderProvider` (provider simples)
- Exporta `useOrders()` (hook)

**Uso:**
- `BootstrapComposer.tsx` - usa `OrderProvider` de `OrderContext`
- `OrderContextReal.tsx` - importa o **token** `OrderContext` (linha 46)

**Observação:** Provider simples, parece ser versão mock/simplificada.

---

### 2. OrderContextReal.tsx
**Localização:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`

**Características:**
- **NÃO cria** seu próprio token (comentado na linha 88)
- **Importa** o token `OrderContext` de `OrderContext.tsx` (linha 46)
- Exporta `OrderProvider` (provider completo com realtime, offline, etc.)
- Exporta `useOrders()` (hook)

**Uso:**
- `AppDomainWrapper.tsx` - usa `OrderProvider` de `OrderContextReal`
- `AppDomainProvider.tsx` - usa `OrderProvider` de `OrderContextReal`
- `TPV.tsx` - usa `OrderProvider` e `useOrders` de `OrderContextReal`
- `KDSStandalone.tsx` - usa `OrderProvider` de `OrderContextReal`
- `KitchenDisplay.tsx` - usa `useOrders` de `OrderContextReal`
- `TablePanel.tsx` - usa `useOrders` de `OrderContextReal`
- `OfflineIndicator.tsx` - usa `useOrders` de `OrderContextReal`

**Observação:** Provider completo, usado em todos os lugares ativos.

---

### 3. OfflineOrderContext.tsx
**Localização:** `merchant-portal/src/pages/TPV/context/OfflineOrderContext.tsx`

**Características:**
- Context separado para gerenciamento offline
- Exporta `OfflineOrderProvider`
- Exporta `useOfflineOrder()`

**Uso:**
- `AppDomainWrapper.tsx` - usa `OfflineOrderProvider`
- `TPV.tsx` - usa `OfflineOrderProvider`
- `KDSStandalone.tsx` - usa `OfflineOrderProvider`
- `OrderContextReal.tsx` - usa `useOfflineOrder()` internamente
- Vários componentes de UI (SyncStatusIndicator, OfflineStatusBadge, etc.)

**Observação:** Context específico para offline, usado junto com OrderContextReal.

---

## 🔍 Análise de Duplicação

### OrderContext vs OrderContextReal

**Situação:**
- `OrderContext.tsx` tem um `OrderProvider` simples
- `OrderContextReal.tsx` tem um `OrderProvider` completo
- Ambos compartilham o **mesmo token** `OrderContext`
- `OrderContextReal` importa o token de `OrderContext`

**Uso:**
- `BootstrapComposer.tsx` usa `OrderProvider` de `OrderContext` (simples)
- Todos os outros lugares usam `OrderProvider` de `OrderContextReal` (completo)

**Decisão:**
- ⚠️ **NÃO consolidar ainda** - `BootstrapComposer` pode ter dependência específica
- Verificar se `BootstrapComposer` é usado ou é legado
- Se legado, pode remover `OrderProvider` de `OrderContext.tsx` e manter apenas o token

---

## 📋 Próximos Passos

1. Verificar se `BootstrapComposer` é usado ativamente
2. Se não usado, remover `OrderProvider` de `OrderContext.tsx`
3. Manter apenas o token `OrderContext` em `OrderContext.tsx` para `OrderContextReal` usar
4. Verificar se há outras duplicações de contexts

---

**Status:** Aguardando análise de uso do `BootstrapComposer`.
