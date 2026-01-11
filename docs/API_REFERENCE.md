# 📚 API REFERENCE — CHEFIAPP POS CORE
**Versão:** 1.0.0  
**Data:** 2026-01-17  
**Status:** ✅ Em Construção

---

## 📋 OVERVIEW

Este documento descreve as APIs principais do sistema ChefIApp POS Core.

---

## 🔧 CORE ENGINES

### OrderEngine

**Localização:** `merchant-portal/src/core/tpv/OrderEngine.ts`

#### Métodos Principais

##### `createOrder(input: OrderInput): Promise<Order>`
Cria um novo pedido.

**Input:**
```typescript
interface OrderInput {
    restaurantId: string;
    tableNumber?: number;
    tableId?: string;
    operatorId?: string;
    cashRegisterId?: string;
    source?: 'tpv' | 'web' | 'app';
    notes?: string;
    items: OrderItemInput[];
}
```

**Output:**
```typescript
interface Order {
    id: string;
    restaurantId: string;
    tableNumber?: number;
    tableId?: string;
    status: OrderStatus;
    items: OrderItem[];
    totalCents: number;
    paymentStatus: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
}
```

**Erros:**
- `CASH_REGISTER_CLOSED` - Caixa não está aberto
- `TABLE_HAS_ACTIVE_ORDER` - Mesa já possui pedido ativo
- `EMPTY_ORDER` - Pedido deve ter pelo menos 1 item
- `INVALID_DATA` - Dados inválidos

##### `getOrderById(orderId: string, restaurantId: string): Promise<Order>`
Busca um pedido por ID.

**Erros:**
- `ORDER_NOT_FOUND` - Pedido não encontrado

##### `updateOrderStatus(orderId: string, status: OrderStatus, restaurantId: string): Promise<void>`
Atualiza o status de um pedido.

**Status válidos:**
- `pending` - Pendente
- `preparing` - Em preparação
- `ready` - Pronto
- `delivered` - Entregue
- `canceled` - Cancelado

**Erros:**
- `ORDER_STATUS_UPDATE_FAILED` - Erro ao atualizar status

##### `addItemToOrder(orderId: string, item: OrderItemInput, restaurantId: string): Promise<Order>`
Adiciona um item a um pedido.

**Erros:**
- `ORDER_CLOSED` - Pedido já foi fechado
- `UNAUTHORIZED` - Pedido não pertence ao restaurante
- `ITEM_ADD_FAILED` - Erro ao adicionar item

##### `removeItemFromOrder(orderId: string, itemId: string, restaurantId: string): Promise<Order>`
Remove um item de um pedido.

**Erros:**
- `ORDER_CLOSED` - Pedido já foi fechado
- `UNAUTHORIZED` - Pedido não pertence ao restaurante
- `ITEM_REMOVE_FAILED` - Erro ao remover item

##### `updateItemQuantity(orderId: string, itemId: string, quantity: number, restaurantId: string): Promise<Order>`
Atualiza a quantidade de um item.

**Erros:**
- `ORDER_CLOSED` - Pedido já foi fechado
- `UNAUTHORIZED` - Pedido não pertence ao restaurante
- `ITEM_NOT_FOUND` - Item não encontrado
- `ITEM_UPDATE_FAILED` - Erro ao atualizar item

##### `getActiveOrders(restaurantId: string): Promise<Order[]>`
Busca todos os pedidos ativos de um restaurante.

**Erros:**
- `ORDERS_FETCH_FAILED` - Erro ao buscar pedidos

---

### PaymentEngine

**Localização:** `merchant-portal/src/core/tpv/PaymentEngine.ts`

#### Métodos Principais

##### `processPayment(input: PaymentInput): Promise<Payment>`
Processa um pagamento.

**Input:**
```typescript
interface PaymentInput {
    orderId: string;
    restaurantId: string;
    cashRegisterId: string;
    amountCents: number;
    method: PaymentMethod;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
}
```

**Output:**
```typescript
interface Payment {
    id: string;
    tenantId: string;
    orderId: string;
    amountCents: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    createdAt: Date;
    metadata?: Record<string, any>;
}
```

**Métodos de pagamento:**
- `cash` - Dinheiro
- `card` - Cartão
- `pix` - PIX

**Erros:**
- `Erro ao processar pagamento` - Erro genérico
- `Transação de pagamento falhou` - Transação não completada

##### `getPaymentsByOrder(orderId: string): Promise<Payment[]>`
Busca todos os pagamentos de um pedido.

##### `getTodayPayments(restaurantId: string): Promise<Payment[]>`
Busca todos os pagamentos do dia de um restaurante.

---

### CashRegisterEngine

**Localização:** `merchant-portal/src/core/tpv/CashRegister.ts`

#### Métodos Principais

##### `openCashRegister(input: OpenCashRegisterInput): Promise<CashRegister>`
Abre um caixa.

**Input:**
```typescript
interface OpenCashRegisterInput {
    restaurantId: string;
    openedBy: string;
    openingBalanceCents: number;
    name?: string;
}
```

##### `closeCashRegister(input: CloseCashRegisterInput): Promise<void>`
Fecha um caixa.

**Input:**
```typescript
interface CloseCashRegisterInput {
    cashRegisterId: string;
    restaurantId: string;
    closedBy: string;
    closingBalanceCents: number;
}
```

##### `getOpenCashRegister(restaurantId: string): Promise<CashRegister | null>`
Busca o caixa aberto de um restaurante.

---

## 🌐 API ENDPOINTS

### Orders API

**Base URL:** `/api/orders`

#### `POST /api/orders`
Cria um novo pedido.

**Request:**
```json
{
  "restaurantId": "uuid",
  "tableNumber": 1,
  "operatorId": "uuid",
  "cashRegisterId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "name": "Produto",
      "priceCents": 1000,
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "restaurantId": "uuid",
  "tableNumber": 1,
  "status": "pending",
  "items": [...],
  "totalCents": 1000,
  "paymentStatus": "PENDING",
  "createdAt": "2026-01-17T10:00:00Z"
}
```

#### `GET /api/orders/:id`
Busca um pedido por ID.

#### `PATCH /api/orders/:id`
Atualiza um pedido.

#### `PATCH /api/orders/:id/status`
Atualiza o status de um pedido.

---

### Payment API

**Base URL:** `/api/payment-intent`

#### `POST /api/payment-intent`
Cria um Payment Intent do Stripe.

**Request:**
```json
{
  "orderId": "uuid",
  "amountCents": 1000,
  "currency": "eur"
}
```

**Response:**
```json
{
  "intent_id": "pi_xxx",
  "client_secret": "pi_xxx_secret_xxx",
  "status": "requires_payment_method"
}
```

---

### Health Check

**Base URL:** `/health` ou `/api/health`

#### `GET /health`
Verifica a saúde do sistema.

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "supabase": "connected",
  "storage": "ok",
  "timestamp": "2026-01-17T10:00:00Z"
}
```

---

## 🔒 SEGURANÇA

### Autenticação

Todas as APIs requerem autenticação via:
- Header `X-User-Id` (para chamadas internas)
- Session token (para chamadas do frontend)

### Row Level Security (RLS)

Todas as queries são filtradas por `restaurant_id` automaticamente via RLS.

---

## 📊 ERROR CODES

### Order Errors
- `CASH_REGISTER_CLOSED` - Caixa não está aberto
- `TABLE_HAS_ACTIVE_ORDER` - Mesa já possui pedido ativo
- `EMPTY_ORDER` - Pedido vazio
- `ORDER_NOT_FOUND` - Pedido não encontrado
- `ORDER_CLOSED` - Pedido fechado
- `UNAUTHORIZED` - Não autorizado
- `ITEM_NOT_FOUND` - Item não encontrado
- `ITEM_ADD_FAILED` - Erro ao adicionar item
- `ITEM_REMOVE_FAILED` - Erro ao remover item
- `ITEM_UPDATE_FAILED` - Erro ao atualizar item
- `ORDER_STATUS_UPDATE_FAILED` - Erro ao atualizar status
- `ORDERS_FETCH_FAILED` - Erro ao buscar pedidos

### Payment Errors
- `PAYMENT_FAILED` - Pagamento falhou
- `INSUFFICIENT_AMOUNT` - Valor insuficiente
- `GATEWAY_ERROR` - Erro no gateway

---

## 📝 EXEMPLOS

### Criar Pedido
```typescript
import { OrderEngine } from '../core/tpv/OrderEngine';

const order = await OrderEngine.createOrder({
    restaurantId: 'restaurant-id',
    tableNumber: 1,
    operatorId: 'operator-id',
    cashRegisterId: 'cash-register-id',
    items: [{
        productId: 'product-id',
        name: 'Produto',
        priceCents: 1000,
        quantity: 1,
    }],
});
```

### Processar Pagamento
```typescript
import { PaymentEngine } from '../core/tpv/PaymentEngine';

const payment = await PaymentEngine.processPayment({
    orderId: order.id,
    restaurantId: 'restaurant-id',
    cashRegisterId: 'cash-register-id',
    amountCents: order.totalCents,
    method: 'cash',
});
```

---

**Construído com 💛 pelo Goldmonkey Empire**
