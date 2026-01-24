# 🧠 Operational Event Bus — Sistema Nervoso

**Data**: 2025-01-02  
**Status**: MVP Implementado  
**Objetivo**: Conectar todos os módulos com um Event Core

---

## 🎯 Visão Geral

O **Operational Event Bus** é o "sistema nervoso" que conecta todos os módulos do ChefIApp:

- **OperationalHub** (stock, time-tracking, delivery)
- **AppStaff** (tarefas automáticas)
- **ReputationHub** (reviews)
- **TPV** (pedidos)

**Princípio**: "Observação antes de interpretação"

---

## 🏗️ Arquitetura

### 1. Event Types (Tipos de Eventos)

#### TPV Events
- `order_created` — Novo pedido criado
- `order_updated` — Pedido atualizado
- `order_paid` — Pedido pago
- `order_cancelled` — Pedido cancelado
- `item_added` — Item adicionado
- `item_removed` — Item removido

#### Stock Events
- `stock_low` — Estoque baixo
- `stock_critical` — Estoque crítico (zero)
- `stock_restocked` — Estoque reposto
- `stock_movement` — Movimentação de estoque

#### Staff Events
- `waiter_call` — Cliente chamando garçom
- `waiter_call_repeated` — Chamado repetido (urgente)
- `shift_started` — Turno iniciado
- `shift_ended` — Turno finalizado
- `break_started` — Pausa iniciada
- `break_ended` — Pausa finalizada

#### Review Events
- `review_received` — Review recebido
- `review_negative` — Review negativo (≤2 estrelas)
- `review_positive` — Review positivo (≥4 estrelas)
- `review_mention_cleanliness` — Menciona limpeza
- `review_mention_service` — Menciona atendimento
- `review_mention_price` — Menciona preço
- `review_mention_food` — Menciona comida

#### Delivery Events
- `delivery_order_received` — Pedido delivery recebido
- `delivery_order_delayed` — Pedido delivery atrasado
- `delivery_order_ready` — Pedido delivery pronto

#### Operational Events
- `peak_hour_detected` — Pico de movimento detectado
- `table_turnover_slow` — Rotação de mesas lenta
- `kitchen_delay` — Atraso na cozinha
- `payment_failed` — Pagamento falhou
- `system_error` — Erro do sistema

---

### 2. Event Priority (Prioridade)

- **P0** (Crítico) — Vermelho — Ação imediata
- **P1** (Alto) — Laranja — Ação em breve
- **P2** (Médio) — Azul — Ação normal
- **P3** (Baixo) — Cinza — Informativo

---

### 3. Event Status (Status)

- `pending` — Aguardando processamento
- `processing` — Em processamento
- `routed` — Roteado (virou tarefa/notificação)
- `acknowledged` — Reconhecido
- `resolved` — Resolvido
- `ignored` — Ignorado

---

## 🔄 Fluxo de Eventos

### 1. Emit Event (Emitir Evento)

```typescript
await emitEvent({
  restaurant_id: '...',
  event_type: 'stock_low',
  priority: 'P1',
  source_module: 'stock',
  source_id: stockItemId,
  context: { product_name: '...', current_stock: 5, min_stock: 10 },
  target_roles: ['manager', 'stock'],
  auto_route: true,
  dedupe_key: 'stock_low_123_2025-01-02',
});
```

### 2. Deduplication (Deduplicação)

- Eventos com mesmo `dedupe_key` dentro da janela são agrupados
- Prioridade mais alta vence
- Contador de duplicatas incrementado

### 3. Routing (Roteamento)

- Busca regras de roteamento para `event_type` + `priority`
- Aplica ações configuradas:
  - `create_task` — Cria tarefa no AppStaff
  - `send_notification` — Envia notificação
  - `update_dashboard` — Atualiza dashboard
  - `trigger_workflow` — Dispara workflow

### 4. Task Creation (Criação de Tarefa)

- Tarefa criada no AppStaff com:
  - Tipo baseado em `task_type`
  - Título do template
  - Descrição do contexto
  - Prioridade do evento
  - Role alvo

---

## 📊 Routing Rules (Regras de Roteamento)

### Regras Padrão (Seed)

1. **Stock Low** → Manager + Stock
   - Tipo: `stock_check`
   - Prioridade: P1

2. **Waiter Call** → Waiter
   - Tipo: `waiter_call`
   - Prioridade: P1

3. **Waiter Call Repeated** → Waiter + Manager
   - Tipo: `waiter_call_urgent`
   - Prioridade: P0

4. **Review Negative** → Manager + Owner
   - Tipo: `review_followup`
   - Prioridade: P1

5. **Kitchen Delay** → Kitchen + Chef + Manager
   - Tipo: `kitchen_delay`
   - Prioridade: P1

---

## 🔌 Integrações

### Stock Service

```typescript
// Em getLowStockItems()
await emitStockLowEvent(restaurantId, {
  id: item.id,
  product_name: item.product_name,
  current_stock: 5,
  min_stock: 10,
});

// Em restockItem()
await emitStockRestockedEvent(restaurantId, {
  id: stockItemId,
  product_name: '...',
  quantity: 50,
});
```

### TPV Integration

```typescript
// Em createOrder()
await emitOrderCreatedEvent(restaurantId, {
  id: orderId,
  table_id: '...',
  table_number: 7,
  total: 2500,
});

// Em payOrder()
await emitOrderPaidEvent(restaurantId, {
  id: orderId,
  table_id: '...',
  table_number: 7,
  total: 2500,
});
```

### Waiter Calls

```typescript
// Em handleWaiterCall()
await emitWaiterCallEvent(restaurantId, {
  table_id: '...',
  table_number: 7,
  user_id: '...',
});
```

### Reviews

```typescript
// Em ingestReview()
await emitReviewReceivedEvent(restaurantId, {
  id: reviewId,
  rating: 2,
  text: '...',
  topics: ['cleanliness', 'service'],
});
```

---

## 🎯 Exemplos de Conexões

### Exemplo 1: Estoque Baixo → Tarefa

1. **Stock Service** detecta estoque baixo
2. **Event Bus** emite `stock_low` (P1)
3. **Routing Rule** cria tarefa para Manager
4. **AppStaff** exibe tarefa: "Estoque baixo: Produto X"

### Exemplo 2: Chamado Repetido → Urgência

1. **Cliente** chama garçom 3x em 5 minutos
2. **Event Bus** emite `waiter_call_repeated` (P0)
3. **Routing Rule** cria tarefa urgente para Waiter + Manager
4. **AppStaff** exibe: "URGENTE: Mesa 7 chamando repetidamente"

### Exemplo 3: Review Negativo → Ação

1. **Review** negativo recebido (2 estrelas, menciona limpeza)
2. **Event Bus** emite `review_negative` + `review_mention_cleanliness`
3. **Routing Rules** criam tarefas:
   - Manager: "Review negativo recebido"
   - Cleaner: "Review menciona limpeza"
4. **AppStaff** exibe ambas as tarefas

### Exemplo 4: Pedido Pago → Limpeza

1. **TPV** registra pagamento
2. **Event Bus** emite `order_paid`
3. **Routing Rule** cria tarefa para Cleaner
4. **AppStaff** exibe: "Limpar Mesa 7"

---

## 📈 Benefícios

1. **Conexão Automática**: Módulos se comunicam sem acoplamento
2. **Deduplicação**: Evita spam de eventos similares
3. **Priorização**: Eventos críticos sobem automaticamente
4. **Rastreabilidade**: Histórico completo de eventos
5. **Extensibilidade**: Fácil adicionar novos tipos de eventos

---

## 🚀 Próximos Passos

1. ✅ Schema SQL criado
2. ✅ Event Bus service implementado
3. ✅ Integrações básicas (Stock)
4. ⏳ Integrar TPV (order events)
5. ⏳ Integrar ReputationHub (review events)
6. ⏳ Integrar AppStaff (task creation)
7. ⏳ Dashboard de eventos
8. ⏳ Notificações push

---

**Mensagem**: "O restaurante se move sozinho. O Event Bus é o nervo que conecta tudo."

