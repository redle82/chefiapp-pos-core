# 📡 EVENT MODEL — ChefIApp Domain Events

> **Eventos de domínio que representam mudanças de estado no sistema.**

---

## 🎯 Propósito

Este documento define os **eventos de domínio** do ChefIApp.

Cada evento:

- Representa uma **mudança de estado** que já aconteceu
- É **imutável** após criação (append-only)
- Contém todos os dados necessários para **replay**
- Serve como base para **auditoria** e **debug**

---

## 📊 Estrutura Base de Evento

```typescript
interface DomainEvent {
  id: string; // UUID único
  type: EventType; // Tipo do evento
  aggregate_id: string; // ID da entidade principal (order_id, etc)
  aggregate_type: AggregateType; // 'order' | 'payment' | 'table' | etc
  restaurant_id: string; // Tenant isolation
  actor_id: string; // Quem causou o evento
  actor_role: Role; // Papel do ator
  occurred_at: string; // ISO timestamp
  source: EventSource; // 'tpv' | 'mobile' | 'customer_portal' | 'system'
  idempotency_key: string; // Para deduplicação
  payload: Record<string, any>; // Dados específicos do evento
  meta?: {
    device_id?: string;
    session_id?: string;
    offline_created?: boolean;
    sync_status?: "pending" | "synced" | "conflict";
  };
}
```

---

## 📋 Catálogo de Eventos

### 🛒 Order Events

| Event                     | Descrição                   | Payload                                                    |
| ------------------------- | --------------------------- | ---------------------------------------------------------- |
| `order.created`           | Novo pedido criado          | `{ table_id, customer_count, notes }`                      |
| `order.item_added`        | Item adicionado ao pedido   | `{ item_id, product_id, quantity, unit_price, modifiers }` |
| `order.item_removed`      | Item removido do pedido     | `{ item_id, reason }`                                      |
| `order.item_modified`     | Item modificado             | `{ item_id, changes }`                                     |
| `order.sent_to_kitchen`   | Pedido enviado para KDS     | `{ sent_at, items_count }`                                 |
| `order.table_transferred` | Mesa transferida            | `{ from_table_id, to_table_id }`                           |
| `order.split_requested`   | Divisão de conta solicitada | `{ split_type, splits[] }`                                 |
| `order.closed`            | Pedido fechado              | `{ total, closed_by, closed_at }`                          |
| `order.cancelled`         | Pedido cancelado            | `{ reason, cancelled_by }`                                 |
| `order.reopened`          | Pedido reaberto (raro)      | `{ reason, reopened_by }`                                  |

### 💰 Payment Events

| Event                | Descrição             | Payload                                           |
| -------------------- | --------------------- | ------------------------------------------------- |
| `payment.initiated`  | Pagamento iniciado    | `{ amount, method, order_id }`                    |
| `payment.completed`  | Pagamento confirmado  | `{ amount, method, reference, gateway_response }` |
| `payment.failed`     | Pagamento falhou      | `{ error_code, error_message }`                   |
| `payment.refunded`   | Estorno processado    | `{ original_payment_id, amount, reason }`         |
| `payment.split_paid` | Parte da divisão paga | `{ split_id, amount, payer_reference }`           |

### 🍽️ Table Events

| Event                  | Descrição       | Payload                                 |
| ---------------------- | --------------- | --------------------------------------- |
| `table.occupied`       | Mesa ocupada    | `{ order_id, customer_count }`          |
| `table.released`       | Mesa liberada   | `{ previous_order_id }`                 |
| `table.merged`         | Mesas unidas    | `{ source_table_ids, target_table_id }` |
| `table.status_changed` | Status alterado | `{ from_status, to_status }`            |

### 👨‍🍳 Kitchen Events

| Event                    | Descrição            | Payload                            |
| ------------------------ | -------------------- | ---------------------------------- |
| `kitchen.item_received`  | Item recebido no KDS | `{ item_id, station }`             |
| `kitchen.item_started`   | Preparo iniciado     | `{ item_id, cook_id }`             |
| `kitchen.item_ready`     | Item pronto          | `{ item_id, preparation_time_ms }` |
| `kitchen.item_delivered` | Item entregue        | `{ item_id, delivered_by }`        |
| `kitchen.item_recalled`  | Item devolvido       | `{ item_id, reason }`              |

### 🔄 Sync Events

| Event                    | Descrição                 | Payload                                     |
| ------------------------ | ------------------------- | ------------------------------------------- |
| `sync.batch_queued`      | Batch offline enfileirado | `{ events_count, queued_at }`               |
| `sync.batch_sent`        | Batch enviado ao servidor | `{ events_count, sent_at }`                 |
| `sync.batch_confirmed`   | Batch confirmado          | `{ events_count, confirmed_at }`            |
| `sync.conflict_detected` | Conflito detectado        | `{ event_id, conflict_type, resolution }`   |
| `sync.conflict_resolved` | Conflito resolvido        | `{ event_id, resolution_strategy, winner }` |

### 💼 Shift Events

| Event                 | Descrição          | Payload                                    |
| --------------------- | ------------------ | ------------------------------------------ |
| `shift.opened`        | Turno aberto       | `{ opened_by, initial_cash }`              |
| `shift.closed`        | Turno fechado      | `{ closed_by, final_totals, discrepancy }` |
| `shift.cash_movement` | Movimento de caixa | `{ type, amount, reason }`                 |

### 🔐 Security Events

| Event                              | Descrição                         | Payload                           |
| ---------------------------------- | --------------------------------- | --------------------------------- |
| `security.unauthorized_attempt`    | Tentativa não autorizada          | `{ action, user_id, details }`    |
| `security.role_escalation_blocked` | Escalação de privilégio bloqueada | `{ attempted_action, user_role }` |

---

## 🔄 Ciclo de Vida do Evento

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Created   │ ──▶ │   Queued    │ ──▶ │   Synced    │
│  (Client)   │     │  (Offline)  │     │  (Backend)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Conflict   │ ──▶ │  Resolved   │
                    │  Detected   │     │             │
                    └─────────────┘     └─────────────┘
```

---

## 📜 Regras de Eventos

### Imutabilidade

- Eventos **nunca** são editados ou deletados
- Correções criam **novos eventos** compensatórios

### Ordenação

- Eventos são ordenados por `occurred_at`
- Em caso de empate, `id` (UUID v7 time-ordered) desempata

### Idempotência

- `idempotency_key` garante processamento único
- Duplicatas são ignoradas silenciosamente

### Causalidade

- Eventos podem referenciar eventos anteriores via `caused_by`
- Permite reconstruir cadeia de causa-efeito

---

## 🔍 Queries Comuns

```sql
-- Histórico completo de um pedido
SELECT * FROM domain_events
WHERE aggregate_type = 'order'
  AND aggregate_id = $order_id
ORDER BY occurred_at;

-- Eventos de um turno
SELECT * FROM domain_events
WHERE restaurant_id = $restaurant_id
  AND occurred_at BETWEEN $shift_start AND $shift_end
ORDER BY occurred_at;

-- Conflitos pendentes
SELECT * FROM domain_events
WHERE type = 'sync.conflict_detected'
  AND meta->>'resolution' IS NULL;
```

---

## 📚 Referências

- [BUSINESS_INVARIANTS.md](./BUSINESS_INVARIANTS.md)
- [CONFLICT_POLICY.md](./CONFLICT_POLICY.md)
- [CoreEvent type](../event-log/types.ts)
