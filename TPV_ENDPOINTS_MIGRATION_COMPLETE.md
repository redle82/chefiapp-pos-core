# ✅ MIGRAÇÃO DE ENDPOINTS HTTP PARA `gm_orders` — COMPLETA

**Data:** 2026-01-10  
**Sprint:** Sprint 1, Semana 3-4  
**Status:** ✅ **COMPLETO**

---

## 🎯 OBJETIVO

Migrar os endpoints HTTP de pedidos da tabela antiga `orders` para o novo schema `gm_orders` e `gm_order_items`, usando a RPC `create_order_atomic` para garantir integridade transacional.

---

## ✅ ENDPOINTS MIGRADOS

### 1. `POST /api/orders` ✅
**Antes:** INSERT direto na tabela `orders`  
**Agora:** Usa RPC `create_order_atomic` com `gm_orders` e `gm_order_items`

**Mudanças:**
- Valida `restaurant_id` obrigatório
- Valida `items` array com pelo menos 1 item
- Formata items para RPC: `{product_id, name, quantity, unit_price}`
- Chama `public.create_order_atomic(restaurant_id, items_jsonb, payment_method)`
- Retorna pedido completo com items agregados

**Formato de Request:**
```json
{
  "restaurantId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "name": "Produto",
      "quantity": 2,
      "unitPrice": 1000
    }
  ],
  "paymentMethod": "cash"
}
```

**Formato de Response:**
```json
{
  "order_id": "uuid",
  "short_id": "#1",
  "state": "PENDING",
  "total_cents": 2000,
  "items": [...]
}
```

---

### 2. `GET /api/orders/:id` ✅
**Antes:** SELECT de `orders`  
**Agora:** SELECT de `gm_orders` + `gm_order_items` com JOIN

**Mudanças:**
- Busca de `public.gm_orders`
- JOIN com `public.gm_order_items`
- Agrega items usando `json_agg`
- Retorna formato padronizado

**Response:**
```json
{
  "order_id": "uuid",
  "short_id": "#1",
  "state": "PENDING",
  "total_cents": 2000,
  "payment_status": "pending",
  "payment_method": "cash",
  "items": [...]
}
```

---

### 3. `PATCH /api/orders/:id` ✅
**Antes:** UPDATE de `orders.items` (JSONB)  
**Agora:** DELETE + INSERT em `gm_order_items` com transação

**Mudanças:**
- Valida que status é `pending` (único estado mutável)
- Usa transação (BEGIN/COMMIT/ROLLBACK)
- Deleta items existentes
- Insere novos items
- Recalcula `total_amount` automaticamente
- Retorna pedido completo atualizado

**Validações:**
- Apenas pedidos com status `pending` podem ser modificados
- Items devem ser array válido

---

### 4. `PATCH /api/orders/:id/status` ✅ **NOVO**
**Criado:** Endpoint para atualizar status do pedido

**Funcionalidade:**
- Atualiza status: `pending → preparing → ready → delivered`
- Permite cancelar: `canceled` (exceto de `delivered`)
- Valida transições de estado (apenas para frente)
- Retorna pedido completo atualizado

**Status válidos:**
- `pending` - Pedido criado, aguardando preparo
- `preparing` - Em preparação
- `ready` - Pronto para entrega
- `delivered` - Entregue
- `canceled` - Cancelado

**Request:**
```json
{
  "status": "preparing"
}
```

---

## 📊 COMPATIBILIDADE

### Endpoints Legados (Mantidos)
- `POST /api/orders/:id/lock` - Ainda usa `orders` (sistema antigo)
- `POST /api/orders/:id/close` - Ainda usa `orders` (sistema antigo)

**Nota:** Estes endpoints podem ser usados por outros sistemas. A migração completa pode ser feita depois.

---

## 🔄 ALINHAMENTO COM OrderEngine

Os endpoints HTTP agora estão **alinhados** com `OrderEngine`:
- ✅ Ambos usam `gm_orders` e `gm_order_items`
- ✅ Ambos usam RPC `create_order_atomic`
- ✅ Ambos seguem o mesmo schema de status

---

## 🧪 TESTES RECOMENDADOS

1. **POST /api/orders**
   - Criar pedido com items válidos
   - Validar `restaurant_id` obrigatório
   - Validar items array não vazio

2. **GET /api/orders/:id**
   - Buscar pedido existente
   - Validar 404 para pedido inexistente

3. **PATCH /api/orders/:id**
   - Atualizar items de pedido `pending`
   - Validar bloqueio para status != `pending`
   - Validar recálculo de total

4. **PATCH /api/orders/:id/status**
   - Transição `pending → preparing → ready → delivered`
   - Cancelar pedido `pending`
   - Validar bloqueio de transições inválidas

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Endpoints migrados
2. ⏳ Testes E2E dos endpoints
3. ⏳ Integrar Supabase Realtime para atualização automática
4. ⏳ Completar UI de lista de pedidos
5. ⏳ Adicionar logs estruturados

---

**Última atualização:** 2026-01-10
