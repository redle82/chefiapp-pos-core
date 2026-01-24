# 🔄 Mapeamento de Sincronização - TPV, KDS e AppStaff

**Como os sistemas se comunicam para alimentar o NOW ENGINE**

---

## 🎯 Princípio

**TPV e KDS são fontes de verdade. AppStaff é terminal de exibição.**

AppStaff não decide nada. Apenas exibe o que NOW ENGINE calcula.

---

## 📊 Fluxo de Dados

### Arquitetura Geral

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│     TPV     │────▶│  NOW ENGINE  │◀────│     KDS      │
│  (Vendas)   │     │  (Decisão)   │     │  (Cozinha)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  APPSTAFF   │
                    │  (Exibição) │
                    └─────────────┘
```

---

## 🛒 TPV → NOW ENGINE

### Eventos que TPV Emite

```typescript
// 1. Pedido criado
{
  event: 'order:created',
  data: {
    orderId: 'order-123',
    tableId: 'table-5',
    items: [
      { id: 'item-1', name: 'Pizza', category: 'main' },
      { id: 'item-2', name: 'Coca', category: 'drink' }
    ],
    total: 25.50,
    createdAt: '2026-01-24T20:00:00Z'
  }
}

// 2. Pedido mudou status
{
  event: 'order:status_changed',
  data: {
    orderId: 'order-123',
    oldStatus: 'pending',
    newStatus: 'preparing',
    tableId: 'table-5'
  }
}

// 3. Pedido quer pagar
{
  event: 'order:wants_pay',
  data: {
    orderId: 'order-123',
    tableId: 'table-5',
    total: 25.50,
    elapsedMinutes: 0
  }
}

// 4. Pagamento processado
{
  event: 'payment:processed',
  data: {
    orderId: 'order-123',
    tableId: 'table-5',
    amount: 25.50,
    method: 'cash'
  }
}

// 5. Mesa mudou status
{
  event: 'table:status_changed',
  data: {
    tableId: 'table-5',
    oldStatus: 'free',
    newStatus: 'occupied',
    orderId: 'order-123'
  }
}

// 6. Mesa precisa atenção
{
  event: 'table:needs_attention',
  data: {
    tableId: 'table-5',
    reason: 'customer_complaint',
    severity: 'critical',
    timestamp: '2026-01-24T20:05:00Z'
  }
}
```

### Como NOW ENGINE Processa

```typescript
// NOW ENGINE escuta eventos do TPV
supabase
  .channel('tpv_events')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'gm_orders' 
  }, (payload) => {
    // Novo pedido → pode gerar ação de atenção
    recalculateNowAction();
  })
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'gm_orders',
    filter: 'status=eq.delivered'
  }, (payload) => {
    // Pedido entregue → pode gerar ação de cobrança
    recalculateNowAction();
  })
  .subscribe();
```

---

## 🍽️ KDS → NOW ENGINE

### Eventos que KDS Emite

```typescript
// 1. Item pronto
{
  event: 'kitchen:item_ready',
  data: {
    orderId: 'order-123',
    tableId: 'table-5',
    itemId: 'item-1',
    itemName: 'Pizza',
    readyTime: '2026-01-24T20:10:00Z',
    stationId: 'station-main'
  }
}

// 2. Pressão de cozinha mudou
{
  event: 'kitchen:pressure_changed',
  data: {
    oldPressure: 'medium',
    newPressure: 'high',
    preparingCount: 12,
    readyItemsCount: 3
  }
}

// 3. Item demorando
{
  event: 'kitchen:item_delayed',
  data: {
    orderId: 'order-123',
    tableId: 'table-5',
    itemId: 'item-1',
    expectedTime: 15, // minutos
    actualTime: 20, // minutos
    delay: 5 // minutos
  }
}
```

### Como NOW ENGINE Processa

```typescript
// NOW ENGINE escuta eventos do KDS
supabase
  .channel('kds_events')
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'gm_order_items',
    filter: 'status=eq.ready'
  }, (payload) => {
    // Item pronto → pode gerar ação urgente/crítica
    recalculateNowAction();
  })
  .subscribe();
```

---

## 🔄 Sincronização em Tempo Real

### Canal Supabase

```typescript
// Canal único para todos os eventos
const channel = supabase.channel('now_engine_events')
  // TPV Events
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'gm_orders' 
  }, () => recalculateNowAction())
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'gm_tables' 
  }, () => recalculateNowAction())
  // KDS Events
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'gm_order_items' 
  }, () => recalculateNowAction())
  .subscribe();
```

### Polling de Fallback

```typescript
// Se Realtime falhar, polling a cada 30s
setInterval(() => {
  recalculateNowAction();
}, 30000);
```

---

## 📊 Contexto Agregado

### Como NOW ENGINE Monta Contexto

```typescript
async function gatherContext(): Promise<OperationalContext> {
  // 1. Mesas (do TPV)
  const tables = await supabase
    .from('gm_tables')
    .select('id, status, last_event_time, order_id')
    .eq('restaurant_id', restaurantId);
  
  // 2. Pedidos (do TPV)
  const orders = await supabase
    .from('gm_orders')
    .select('id, table_id, status, total, created_at')
    .eq('restaurant_id', restaurantId)
    .in('status', ['pending', 'preparing', 'delivered', 'wants_pay']);
  
  // 3. Itens (do KDS)
  const items = await supabase
    .from('gm_order_items')
    .select('id, order_id, status, ready_at, category')
    .eq('restaurant_id', restaurantId)
    .in('status', ['preparing', 'ready']);
  
  // 4. Calcular pressão
  const kitchenPressure = calculateKitchenPressure(items);
  const overallPressure = calculateOverallPressure(tables, orders, items);
  
  return {
    currentTime: Date.now(),
    shiftDuration: calculateShiftDuration(),
    tables: mapTables(tables, orders),
    kitchen: {
      pressure: kitchenPressure,
      preparingCount: items.filter(i => i.status === 'preparing').length,
      readyItems: items.filter(i => i.status === 'ready').map(mapReadyItem)
    },
    sales: {
      pendingPayments: mapPendingPayments(orders),
      activeOrders: orders.length
    },
    staff: {
      role: currentRole,
      currentAction: currentActionId,
      idleTime: calculateIdleTime()
    },
    pressure: {
      overall: overallPressure,
      factors: identifyPressureFactors(tables, orders, items)
    }
  };
}
```

---

## 🎯 Mapeamento de Eventos → Ações

### TPV: Pedido Criado

```typescript
// Evento
order:created → { tableId: 'table-5', orderId: 'order-123' }

// NOW ENGINE calcula
if (elapsedMinutes < 2) {
  return {
    type: 'attention',
    title: 'Mesa 5',
    message: 'Novo pedido',
    action: 'acknowledge',
    tableId: 'table-5'
  };
}
```

### TPV: Pedido Entregue

```typescript
// Evento
order:status_changed → { orderId: 'order-123', newStatus: 'delivered' }

// NOW ENGINE calcula
return {
  type: 'attention',
  title: 'Mesa 5',
  message: 'Verificar',
  action: 'check',
  tableId: 'table-5'
};
```

### TPV: Mesa Quer Pagar

```typescript
// Evento
order:wants_pay → { tableId: 'table-5', elapsedMinutes: 0 }

// NOW ENGINE calcula (inicialmente atenção)
if (elapsedMinutes < 2) {
  return {
    type: 'attention',
    title: 'Mesa 5',
    message: 'Quer pagar',
    action: 'collect_payment',
    tableId: 'table-5'
  };
}

// Depois de 2min → urgente
if (elapsedMinutes >= 2 && elapsedMinutes <= 5) {
  return {
    type: 'urgent',
    title: 'Mesa 5',
    message: 'Quer pagar',
    action: 'collect_payment',
    tableId: 'table-5'
  };
}

// Depois de 5min → crítico
if (elapsedMinutes > 5) {
  return {
    type: 'critical',
    title: 'Mesa 5',
    message: 'Quer pagar há 5+ min',
    action: 'collect_payment',
    tableId: 'table-5'
  };
}
```

### KDS: Item Pronto

```typescript
// Evento
kitchen:item_ready → { orderId: 'order-123', tableId: 'table-5', readyTime: '...' }

// NOW ENGINE calcula
const elapsed = (Date.now() - readyTime) / 60000;

if (elapsed > 3) {
  return {
    type: 'critical',
    title: 'Mesa 5',
    message: 'Item pronto há 3+ min',
    action: 'deliver',
    tableId: 'table-5',
    orderId: 'order-123'
  };
} else if (elapsed >= 1) {
  return {
    type: 'urgent',
    title: 'Mesa 5',
    message: 'Item pronto',
    action: 'deliver',
    tableId: 'table-5',
    orderId: 'order-123'
  };
}
```

### KDS: Pressão Alta

```typescript
// Evento
kitchen:pressure_changed → { newPressure: 'high', preparingCount: 12 }

// NOW ENGINE calcula (apenas para garçom/barman)
if (role === 'waiter' || role === 'bartender') {
  return {
    type: 'urgent',
    title: 'Cozinha',
    message: 'Pressão alta - priorizar bebidas',
    action: 'prioritize_drinks'
  };
}
```

---

## 🔄 Ciclo de Sincronização

### 1. Evento Ocorre

```
TPV: Pedido criado
    ↓
Supabase Realtime
    ↓
NOW ENGINE recebe evento
```

### 2. NOW ENGINE Recalcula

```
NOW ENGINE:
  1. Coleta contexto atualizado
  2. Aplica regras de priorização
  3. Calcula ação única
  4. Emite ação
```

### 3. AppStaff Atualiza

```
NOW ENGINE emite ação
    ↓
AppStaff recebe ação
    ↓
UI atualiza (fade transition)
```

### 4. Funcionário Completa Ação

```
Funcionário toca botão
    ↓
AppStaff marca ação como completa
    ↓
TPV/KDS atualiza estado
    ↓
NOW ENGINE recalcula próxima ação
```

---

## 🎯 Regras de Sincronização

### 1. TPV é Fonte de Verdade para Mesas

```typescript
// AppStaff nunca modifica mesas diretamente
// Apenas TPV modifica
// AppStaff apenas lê e exibe
```

### 2. KDS é Fonte de Verdade para Cozinha

```typescript
// AppStaff nunca modifica KDS diretamente
// Apenas KDS modifica
// AppStaff apenas lê e exibe
```

### 3. NOW ENGINE é Fonte de Verdade para Ações

```typescript
// AppStaff nunca decide ações
// Apenas NOW ENGINE decide
// AppStaff apenas exibe
```

### 4. AppStaff é Terminal de Exibição

```typescript
// AppStaff não tem lógica de negócio
// AppStaff não filtra nada
// AppStaff apenas exibe o que NOW ENGINE calcula
```

---

## 🔒 Garantias de Sincronização

### 1. Consistência

```typescript
// Sempre usar mesma fonte de dados
const context = await gatherContext(); // Única fonte
const action = calculateNowAction(context); // Única decisão
```

### 2. Atualização Contínua

```typescript
// Recalcular a cada 30s (polling)
setInterval(() => recalculateNowAction(), 30000);

// Recalcular imediatamente em eventos (realtime)
onEvent(() => recalculateNowAction());
```

### 3. Offline-First

```typescript
// Funcionar offline
try {
  const context = await gatherContextOnline();
} catch {
  const context = await gatherContextOffline();
}
```

---

## 📊 Exemplo Completo

### Cenário: Mesa Quer Pagar

**1. TPV emite evento:**
```typescript
{
  event: 'order:wants_pay',
  data: { tableId: 'table-5', orderId: 'order-123', elapsedMinutes: 0 }
}
```

**2. NOW ENGINE recebe:**
```typescript
// Recalcula contexto
const context = await gatherContext();
// context.tables.find(t => t.id === 'table-5')
//   → { orderStatus: 'wants_pay', elapsedMinutes: 0 }

// Calcula ação
const action = calculateNowAction(context);
// → { type: 'attention', title: 'Mesa 5', message: 'Quer pagar', action: 'collect_payment' }
```

**3. AppStaff exibe:**
```
┌─────────────────────────────┐
│         💰                  │
│      Mesa 5                 │
│   Quer pagar                │
│  ┌───────────────────────┐  │
│  │   COBRAR              │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**4. Funcionário toca "COBRAR":**
```typescript
// AppStaff marca como completa
completeAction(actionId);

// TPV processa pagamento (via Fast Pay)
await quickPay(orderId, method);

// TPV emite evento
{ event: 'payment:processed', data: { orderId: 'order-123' } }
```

**5. NOW ENGINE recalcula:**
```typescript
// Próxima ação (ou silêncio)
const nextAction = calculateNowAction(context);
```

---

## 🔄 Sincronização Bidirecional

### AppStaff → TPV/KDS

```typescript
// AppStaff apenas emite "ação completa"
// TPV/KDS processa ação real

// Exemplo: "COBRAR"
completeAction(actionId);
  ↓
TPV.processPayment(orderId, method);
  ↓
TPV emite 'payment:processed'
  ↓
NOW ENGINE recalcula
```

### TPV/KDS → AppStaff

```typescript
// TPV/KDS emite eventos
// NOW ENGINE calcula ação
// AppStaff exibe

// Exemplo: Item pronto
KDS.itemReady(itemId);
  ↓
KDS emite 'kitchen:item_ready'
  ↓
NOW ENGINE calcula ação
  ↓
AppStaff exibe "ENTREGAR"
```

---

## ✅ Critérios de Sincronização

### 1. Latência < 2 Segundos

- Evento ocorre → AppStaff atualiza em < 2s
- Realtime: < 500ms
- Polling fallback: < 2s

### 2. Consistência

- AppStaff sempre mostra estado atual
- Nunca mostra ação obsoleta
- Sempre sincronizado com TPV/KDS

### 3. Offline-First

- Funciona offline
- Sincroniza quando online
- Não perde ações

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Mapeamento Definido
