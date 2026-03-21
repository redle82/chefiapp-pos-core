# Operational Orchestrator — Contrato

**Propósito:** Define a camada de orquestração operacional que decide **quando** gerar, suprimir ou permitir tarefas com base em estado real (pedidos, mesas, tempo).

**Referência:** Subordinado a [CONTRATO_DE_ATIVIDADE_OPERACIONAL](./CONTRATO_DE_ATIVIDADE_OPERACIONAL.md). Complementa [EVENTS_AND_STREAMS](./EVENTS_AND_STREAMS.md).

---

## 1. O que é

O Operational Orchestrator **não é** UI nem botão.

É uma **engine de decisão** que responde:

> _Neste momento, o sistema deve gerar tarefas MODO_INTERNO, permitir tarefas de atendimento (PEDIDO_NOVO, ATRASO_ITEM, PEDIDO_ESQUECIDO), ou suprimir?_

O Orchestrator **consome** estado derivado do Core e **emite** decisões (generate | suppress | allow). A execução (criar tarefas em `gm_tasks`) permanece no EventTaskGenerator e TaskWriter.

---

## 2. Estados de entrada (OrchestratorState)

| Campo | Tipo | Fonte |
|-------|------|-------|
| `activeOrdersCount` | number | `gm_orders` status OPEN/IN_PREP/READY |
| `occupiedTablesCount` | number | `gm_tables` status occupied |
| `idleMinutesSinceLastOrder` | number | diff(now, max(created_at)) em `gm_orders` |
| `shiftOpen` | boolean | `gm_cash_registers` status open |

---

## 3. Decisões (OrchestratorDecision)

| action | Significado |
|--------|-------------|
| `generate` | Emitir eventos que geram tarefas (ex.: RESTAURANT_IDLE → MODO_INTERNO) |
| `suppress` | Não gerar tarefas do tipo indicado (ex.: MODO_INTERNO quando activeOrders > 0) |
| `allow` | Permitir geração (ex.: PEDIDO_NOVO, ATRASO_ITEM, PEDIDO_ESQUECIDO) |

---

## 4. Regras (lógica pura)

| Condição | Decisão | Regra |
|----------|---------|-------|
| `activeOrdersCount > 0` | `suppress` MODO_INTERNO | Em fluxo de atendimento, não gerar tarefas de modo interno |
| `activeOrdersCount === 0 && idleMinutesSinceLastOrder >= X && shiftOpen` | `generate` RESTAURANT_IDLE | CONTRATO_DE_ATIVIDADE_OPERACIONAL: restaurante ocioso → MODO_INTERNO |
| `order_delayed`, `table_unattended` | `allow` | Sempre permitir (EventMonitor gera tarefas) |
| `order_created` | `allow` | OrderContextReal gera PEDIDO_NOVO |

Parâmetro X (minutos para IDLE): conforme `restaurant_idle_minutes` em alertThresholds (ex.: 15).

---

## 5. Eventos (input/output)

### Input (o Orchestrator consome estado, não subscreve eventos)

O estado é obtido por polling ou leitura síncrona:
- `readActiveOrders(restaurantId)` → activeOrdersCount
- `getLastOrderCreatedAt(restaurantId)` → idleMinutesSinceLastOrder
- `CashRegisterEngine.getOpenCashRegister(restaurantId)` → shiftOpen
- `gm_tables` eq status occupied → occupiedTablesCount

### Output (decisões que afetam geração)

| Evento | Tipo tarefa | Condição do Orchestrator |
|--------|-------------|--------------------------|
| restaurant_idle | MODO_INTERNO | generate quando idle + shiftOpen |
| order_created | PEDIDO_NOVO | allow (OrderContextReal) |
| order_delayed | ATRASO_ITEM | allow (EventMonitor) |
| table_unattended | PEDIDO_ESQUECIDO | allow (EventMonitor) |

---

## 6. Integração

O EventMonitor consulta o Orchestrator **antes** de chamar `eventTaskGenerator.generateFromEvent("restaurant_idle")`:

```
EventMonitor.checkIdle()
  → Obter OrchestratorState (activeOrders, idleMinutes, shiftOpen)
  → Orchestrator.decide(state)
  → Se decision.action === 'generate' && eventsToEmit inclui restaurant_idle
      → eventTaskGenerator.generateFromEvent("restaurant_idle", ...)
  → Senão (suppress)
      → return (não gerar)
```

Para `order_delayed` e `table_unattended`, o Orchestrator retorna `allow` — o EventMonitor continua a gerar tarefas como hoje.

---

## 7. KDS — Task Board Mode

Quando `activeOrdersCount === 0` e existem tarefas MODO_INTERNO em aberto, o KDS deve exibir **Task Board Mode**: priorizar a visualização de tarefas em vez de só "Nenhum pedido ativo".

| Estado | Comportamento KDS |
|--------|-------------------|
| Pedidos ativos | Fila de pedidos + TaskPanel (tab Cozinha) |
| Sem pedidos, com tarefas | Task Board Mode: tarefas em destaque |
| Sem pedidos, sem tarefas | "Nenhum pedido ativo" |

---

## 8. Escopo excluído (fase posterior)

- `suppressTasks` por staff/área ocupada (tracking "staff em mesa X")
- `areaOccupied` para bloquear tarefas paralelas
- Migração de EventMonitor para backend
- ENTREGA_PENDENTE (pedido READY há N min sem entregar)
