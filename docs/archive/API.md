# 📡 API Documentation - ChefIApp POS Core

**Base URL:** `http://localhost:4320` (desenvolvimento)  
**Autenticação:** Sessão via cookie ou token `x-chefiapp-token`

---

## 📋 Índice

1. [Orders API](#orders-api)
2. [Health Check](#health-check)
3. [Wizard API](#wizard-api)
4. [Public API](#public-api)
5. [Webhooks](#webhooks)

---

## 🛒 Orders API

### POST /api/orders

Cria um novo pedido.

**Autenticação:** Requerida (sessão)

**Request Body:**
```json
{
  "restaurantId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "name": "Hambúrguer",
      "quantity": 2,
      "unitPrice": 1000
    }
  ],
  "paymentMethod": "cash"
}
```

**Response (201):**
```json
{
  "order_id": "uuid",
  "short_id": "ORD-001",
  "state": "PENDING",
  "total_cents": 2000,
  "items": [...]
}
```

**Erros:**
- `400`: Dados inválidos
- `401`: Sessão não autorizada
- `500`: Erro interno

---

### GET /api/orders/:orderId

Busca um pedido por ID.

**Autenticação:** Requerida (sessão)

**Response (200):**
```json
{
  "order_id": "uuid",
  "short_id": "ORD-001",
  "state": "PENDING",
  "total_cents": 2000,
  "payment_status": "PENDING",
  "payment_method": "cash",
  "items": [...]
}
```

**Erros:**
- `404`: Pedido não encontrado
- `401`: Sessão não autorizada

---

### PATCH /api/orders/:orderId

Atualiza itens de um pedido (apenas se status = 'pending').

**Autenticação:** Requerida (sessão)

**Request Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "name": "Hambúrguer",
      "quantity": 1,
      "unitPrice": 1000
    }
  ]
}
```

**Response (200):**
```json
{
  "order_id": "uuid",
  "short_id": "ORD-001",
  "state": "PENDING",
  "total_cents": 1000,
  "items": [...]
}
```

**Erros:**
- `400`: Pedido não pode ser modificado (status != 'pending')
- `404`: Pedido não encontrado
- `401`: Sessão não autorizada

---

### PATCH /api/orders/:orderId/status

Atualiza o status de um pedido.

**Autenticação:** Requerida (sessão)

**Request Body:**
```json
{
  "status": "preparing" // ou "ready", "delivered"
}
```

**Status válidos:**
- `pending` → `preparing` → `ready` → `delivered`

**Response (200):**
```json
{
  "order_id": "uuid",
  "state": "PREPARING"
}
```

**Erros:**
- `400`: Status inválido ou transição não permitida
- `404`: Pedido não encontrado
- `401`: Sessão não autorizada

---

## 🏥 Health Check

### GET /health

Verifica o status do sistema.

**Autenticação:** Não requerida

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "supabase": "connected",
  "storage": "connected",
  "timestamp": "2026-01-10T10:00:00Z"
}
```

**Status possíveis:**
- `ok`: Sistema operacional
- `degraded`: Sistema parcialmente operacional
- `down`: Sistema indisponível

---

## 🧙 Wizard API

### POST /internal/wizard/:restaurantId/identity

Atualiza identidade do restaurante.

**Autenticação:** Requerida (token interno)

**Request Body:**
```json
{
  "name": "Restaurante Exemplo",
  "tagline": "Slogan do restaurante",
  "logo_url": "https://...",
  "hero": {
    "title": "Título",
    "subtitle": "Subtítulo",
    "image_url": "https://..."
  },
  "contacts": {
    "phone": "+351912345678",
    "email": "contato@exemplo.com",
    "address": "Rua Exemplo, 123"
  }
}
```

---

### POST /internal/wizard/:restaurantId/menu/items

Cria um item de menu.

**Autenticação:** Requerida (token interno)

**Request Body:**
```json
{
  "category_id": "uuid",
  "name": "Hambúrguer",
  "description": "Descrição do item",
  "price_cents": 1000,
  "currency": "EUR",
  "photo_url": "https://...",
  "tags": ["popular", "vegetariano"]
}
```

---

### POST /internal/wizard/:restaurantId/publish

Publica o restaurante.

**Autenticação:** Requerida (token interno)

**Request Body:**
```json
{
  "confirm": true
}
```

**Response (200):**
```json
{
  "ok": true,
  "published": true,
  "url": "http://localhost:4320/public/slug",
  "profile": {...}
}
```

---

## 🌐 Public API

### GET /public/:slug

Página pública do restaurante (HTML).

**Autenticação:** Não requerida

**Response (200):** HTML da página pública

---

### GET /public/:slug/menu

Menu público do restaurante (JSON).

**Autenticação:** Não requerida

**Response (200):**
```json
{
  "profile": {...},
  "menu": {
    "categories": [...],
    "items": [...]
  }
}
```

---

### POST /public/:slug/orders

Cria pedido público (web ordering).

**Autenticação:** Não requerida

**Request Body:**
```json
{
  "pickup_type": "delivery",
  "customer_contact": {
    "name": "João",
    "phone": "+351912345678"
  },
  "delivery_address": {
    "street": "Rua Exemplo",
    "city": "Lisboa",
    "postal_code": "1000-000"
  },
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2
    }
  ],
  "currency": "EUR"
}
```

---

## 🔔 Webhooks

### POST /webhooks/payments/:restaurantId

Webhook para eventos de pagamento (Stripe).

**Autenticação:** Assinatura Stripe

**Headers:**
- `Stripe-Signature`: Assinatura do evento

**Body:** Evento Stripe (raw)

---

## 🔐 Autenticação

### Sessão (Cookie)

Para endpoints `/api/*`, a autenticação é feita via cookie de sessão.

### Token Interno

Para endpoints `/internal/*`, use o header:
```
X-Internal-Token: <token>
```

### Token de Aplicação

Para alguns endpoints, use:
```
x-chefiapp-token: <token>
```

---

## 📊 Rate Limiting

- **Limite:** 500 requests/minuto por IP
- **Headers de resposta:**
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requests restantes
  - `Retry-After`: Segundos até poder tentar novamente (se excedido)

---

## 🚨 Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `400` | Bad Request - Dados inválidos |
| `401` | Unauthorized - Autenticação requerida |
| `403` | Forbidden - Acesso negado |
| `404` | Not Found - Recurso não encontrado |
| `409` | Conflict - Conflito (ex: slug já existe) |
| `429` | Too Many Requests - Rate limit excedido |
| `500` | Internal Server Error - Erro interno |

---

## 📝 Notas

- Todos os valores monetários são em **centavos** (ex: 1000 = €10.00)
- IDs são **UUIDs** (v4)
- Timestamps são **ISO 8601** (UTC)
- Todos os endpoints retornam JSON (exceto `/public/:slug` que retorna HTML)

---

**Última atualização:** 2026-01-10
