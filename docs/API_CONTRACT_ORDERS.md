# 📋 API CONTRACT - Orders Endpoint
**Versão:** 1.0.0  
**Data:** 2026-01-13  
**Status:** ✅ **CONTRATO OFICIAL**

---

## 🎯 POST /api/orders

Cria um novo pedido no sistema POS usando o schema `gm_orders` e RPC `create_order_atomic`.

---

## 🔐 Autenticação

**OBRIGATÓRIA** - Requer sessão válida via Magic Link.

**Header:**
```
x-chefiapp-token: <session_token>
```

**Fluxo de autenticação:**
1. `POST /api/auth/request-magic-link` com email
2. Extrair `dev_token` da resposta
3. `GET /api/auth/verify-magic-link?token={dev_token}`
4. Extrair `session_token` da resposta
5. Usar `session_token` no header `x-chefiapp-token`

**Erro sem autenticação:**
```json
{
  "error": "SESSION_REQUIRED"
}
```
Status: `401 Unauthorized`

---

## 📥 Request Schema

### Campos Obrigatórios

```typescript
{
  items: Array<OrderItem>  // MÍNIMO 1 item (array não pode ser vazio)
}
```

### Campos Opcionais

```typescript
{
  restaurantId?: string;      // UUID do restaurante (usa WEB_MODULE_RESTAURANT_ID se não fornecido)
  paymentMethod?: string;     // 'cash' | 'card' | 'pix' (default: 'cash')
}
```

### Schema de OrderItem

**OBRIGATÓRIO:**
```typescript
{
  productId: string;        // UUID do produto (ou product_id)
  name: string;             // Nome do produto
  quantity: number;         // Quantidade (default: 1)
  unitPrice: number;        // Preço unitário em centavos (ou unit_price, priceCents, price_cents)
}
```

**Variações aceitas (para compatibilidade):**
- `productId` ou `product_id`
- `unitPrice` ou `unit_price` ou `priceCents` ou `price_cents`

---

## ✅ Payload Mínimo Válido

### Exemplo 1: Pedido Simples (Mínimo)

```json
{
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Pizza Margherita",
      "quantity": 1,
      "unitPrice": 1200
    }
  ]
}
```

### Exemplo 2: Pedido com Múltiplos Itens

```json
{
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Pizza Margherita",
      "quantity": 2,
      "unitPrice": 1200
    },
    {
      "productId": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Coca-Cola",
      "quantity": 1,
      "unitPrice": 300
    }
  ],
  "paymentMethod": "cash"
}
```

### Exemplo 3: Com restaurantId Explícito

```json
{
  "restaurantId": "770e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Pizza Margherita",
      "quantity": 1,
      "unitPrice": 1200
    }
  ]
}
```

---

## ❌ Payloads Inválidos

### ❌ Array de items vazio
```json
{
  "items": []
}
```
**Erro:** `400 Bad Request` - `"items array required with at least one item"`

### ❌ Sem campo items
```json
{
  "table": 1
}
```
**Erro:** `400 Bad Request` - `"items array required with at least one item"`

### ❌ Item sem productId
```json
{
  "items": [
    {
      "name": "Pizza",
      "quantity": 1,
      "unitPrice": 1200
    }
  ]
}
```
**Erro:** `500 Internal Server Error` - Falha na RPC (product_id é obrigatório)

### ❌ Item sem name
```json
{
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 1,
      "unitPrice": 1200
    }
  ]
}
```
**Erro:** `500 Internal Server Error` - Falha na RPC (name é obrigatório)

### ❌ Item sem unitPrice
```json
{
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Pizza",
      "quantity": 1
    }
  ]
}
```
**Comportamento:** Usa `0` como default (pode causar problemas)

---

## 📤 Response Schema

### Sucesso (200 OK)

```json
{
  "order_id": "880e8400-e29b-41d4-a716-446655440000",
  "state": "OPEN",
  "table_number": null,
  "items": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440000",
      "product_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Pizza Margherita",
      "quantity": 1,
      "unit_price": 1200,
      "total_price": 1200
    }
  ],
  "total_cents": 1200,
  "status": "pending",
  "payment_status": "PENDING",
  "created_at": "2026-01-13T10:30:00Z"
}
```

**Campos importantes:**
- `order_id`: UUID do pedido criado
- `state`: Estado do pedido (`OPEN`, `LOCKED`, `CLOSED`)
- `total_cents`: Total calculado automaticamente
- `status`: Status do pedido (`pending`, `preparing`, `ready`, `delivered`, `canceled`)

---

## 🔍 Validações Implementadas

### 1. Autenticação
- ✅ Verifica header `x-chefiapp-token`
- ✅ Retorna `401 SESSION_REQUIRED` se ausente

### 2. Items Array
- ✅ Deve existir
- ✅ Deve ser array
- ✅ Deve ter pelo menos 1 item
- ✅ Retorna `400` se inválido

### 3. Restaurant ID
- ✅ Se não fornecido, usa `WEB_MODULE_RESTAURANT_ID` (env var)
- ✅ Retorna `400` se nenhum disponível

### 4. Product IDs
- ✅ Devem ser UUIDs válidos
- ✅ Devem existir no banco (validação na RPC)
- ✅ Retorna `500` se produto não encontrado

### 5. RPC create_order_atomic
- ✅ Valida constraints do banco
- ✅ Previne race conditions
- ✅ Calcula total automaticamente
- ✅ Gera `short_id` sequencial

---

## 🧪 Test Fixture Oficial

Para uso em testes automatizados:

```json
{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000001",
      "name": "Test Product",
      "quantity": 1,
      "unitPrice": 1000
    }
  ],
  "paymentMethod": "cash"
}
```

**Pré-requisitos para testes:**
1. ✅ Produto com ID `00000000-0000-0000-0000-000000000001` deve existir no banco
2. ✅ Ou usar um produto real do restaurante de teste
3. ✅ Autenticação via Magic Link configurada

---

## 📝 Notas de Implementação

### Por que não aceita pedido vazio?

**Razão arquitetural:**
- Sistema POS real não permite pedidos sem itens
- Evita estados inconsistentes
- Força intenção explícita do usuário

**Alternativa para testes:**
- Criar produto de teste no banco
- Usar produto real do restaurante
- Não tentar criar pedido vazio

### Por que precisa de name e unitPrice?

**Razão de domínio:**
- `name`: Snapshot do nome do produto (pode mudar depois)
- `unitPrice`: Snapshot do preço (imutabilidade fiscal)
- Garante que histórico de pedidos seja preciso

---

## 🔗 Endpoints Relacionados

- `GET /api/orders/{orderId}` - Buscar pedido
- `PATCH /api/orders/{orderId}` - Modificar pedido (apenas se `state = OPEN`)
- `POST /api/orders/{orderId}/lock` - Bloquear pedido (calcula total)
- `POST /api/orders/{orderId}/close` - Fechar pedido (transição para `CLOSED`)

---

**Última Atualização:** 2026-01-13  
**Mantido por:** Core Team  
**Status:** ✅ Produção
