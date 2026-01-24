# 📊 TPV MÍNIMO REAL — STATUS ATUAL

**Data:** 2026-01-10  
**Sprint:** Sprint 1, Semana 3-4  
**Status:** 🟡 **EM PROGRESSO (~60%)**

---

## ✅ O QUE JÁ ESTÁ FEITO

### Schema de Pedidos (✅ 100%)
- ✅ Tabela `gm_orders` criada
- ✅ Tabela `gm_order_items` criada
- ✅ RLS por tenant implementado
- ✅ Índices criados (`idx_orders_restaurant_status`, `idx_orders_created_at`)
- ✅ RPC `create_order_atomic` criada

### UI TPV Básico (✅ 80%)
- ✅ Tela de seleção de produtos (`TPV.tsx`)
- ✅ Carrinho de pedido (integrado)
- ✅ Confirmação de pedido (PaymentModal)
- ⚠️ Lista de pedidos ativos (parcial)
- ⚠️ Estados visuais (pending → preparing → ready → delivered) - parcial

### Integração Real (🟡 50%)
- ✅ `OrderContextReal` usa `OrderEngine`
- ✅ `OrderEngine.createOrder` persiste no DB
- ⚠️ Status atualiza em tempo real (parcial - precisa Supabase Realtime)
- ⚠️ Logs de cada operação (parcial)

---

## ❌ O QUE FALTA

### API de Pedidos (🟡 50%)
- ✅ `POST /api/orders` - Existe, mas usa tabela antiga `orders` (precisa migrar para `gm_orders`)
- ✅ `GET /api/orders/:id` - Existe, mas usa tabela antiga
- ✅ `PATCH /api/orders/:id` - Existe, mas usa tabela antiga
- ⚠️ `PATCH /api/orders/:id/status` - Precisa criar (atualizar status: pending → preparing → ready → delivered)
- ⚠️ Validação: tenant_id, items, preços (parcial)
- ✅ `OrderEngine` já usa RPC `create_order_atomic` com `gm_orders` ✅

### UI TPV Básico (🟡 80%)
- ⚠️ Lista de pedidos ativos completa
- ⚠️ Estados visuais claros (pending → preparing → ready → delivered)
- ⚠️ Atualização de status em tempo real

### Integração Real (🟡 50%)
- ❌ Pedido aparece na lista automaticamente (precisa Realtime)
- ⚠️ Status atualiza em tempo real (precisa Realtime)
- ⚠️ Logs estruturados de cada operação

### Validação com Usuário Real (❌ 0%)
- ❌ 1 restaurante beta
- ❌ 10 pedidos reais
- ❌ Documentação de bugs/fricções

---

## 🎯 PRÓXIMOS PASSOS

### 1. Migrar Endpoints HTTP para `gm_orders` (3h)
- Atualizar `POST /api/orders` - Usar RPC `create_order_atomic` em vez de INSERT direto
- Atualizar `GET /api/orders/:id` - Buscar de `gm_orders` + `gm_order_items`
- Atualizar `PATCH /api/orders/:id` - Atualizar `gm_orders` e `gm_order_items`
- Criar `PATCH /api/orders/:id/status` - Atualizar status (pending → preparing → ready → delivered)

### 2. Completar UI de Lista de Pedidos (3h)
- Lista de pedidos ativos
- Filtros por status
- Atualização em tempo real

### 3. Integrar Supabase Realtime (2h)
- Subscription para `gm_orders`
- Atualização automática de lista
- Status em tempo real

### 4. Adicionar Logs Estruturados (2h)
- Log de criação de pedido
- Log de atualização de status
- Log de erros

### 5. Validação com Usuário Real (2h)
- 1 restaurante beta
- 10 pedidos reais
- Documentar feedback

---

## 📊 PROGRESSO GERAL

| Tarefa | Progresso | Status |
|--------|-----------|--------|
| Schema de Pedidos | 100% | ✅ |
| API de Pedidos | 30% | 🟡 |
| UI TPV Básico | 80% | 🟡 |
| Integração Real | 50% | 🟡 |
| Validação Beta | 0% | ❌ |
| **TOTAL** | **60%** | **🟡** |

---

## 🚀 ESTIMATIVA PARA COMPLETAR

**Tempo Restante:** ~12 horas

1. Migrar Endpoints HTTP: 3h
2. UI Lista: 3h
3. Realtime: 2h
4. Logs: 2h
5. Validação: 2h

**Prazo:** 2-3 dias de trabalho focado

---

**Última atualização:** 2026-01-10
