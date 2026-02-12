# CORE_EVENTS_CONTRACT — Contrato de eventos do ChefIApp™ OS

> Documento interno. Define os **eventos canónicos** do OS e o contrato do
> `core_event_log` para auditoria, reconciliação e análise transversal.

---

## 1. Objetivo

- Ter um **único trilho imutável** de eventos críticos:
  - pedidos,
  - stock,
  - tasks,
  - fiscal,
  - runtime/saúde.
- Permitir:
  - reconciliação operacional vs fiscal;
  - debug de incidentes (por turno, terminal, unidade);
  - dashboards avançados (multi‑unidade, fiabilidade).

---

## 2. Tipos de evento canónicos

Os tipos de evento são literais estáveis, versionáveis (`v1`, `v2` se
quebrar contrato) e vividos em código (TS) e Core.

### 2.1. Pedidos (Orders)

- `ORDER_CREATED`
- `ORDER_UPDATED`
- `ORDER_PAID`
- `ORDER_CANCELLED`

Payload mínimo:

- `order_id`
- `restaurant_id`
- `channel` (`TPV`, `WEB_PUBLIC`, `APPSTAFF`, …)
- `total_cents` (snapshot no momento do evento)
- `status` (após a transição)

### 2.2. Itens de pedido (Order Items / KDS)

- `ORDER_ITEM_ADDED`
- `ORDER_ITEM_READY`
- `ORDER_ITEM_CANCELLED`

Payload mínimo:

- `order_id`
- `order_item_id`
- `restaurant_id`
- `station` (`KITCHEN`, `BAR`, …)
- `product_id` / `product_name_snapshot`

### 2.3. Tasks / Monitor de risco

- `TASK_CREATED`
- `TASK_ACKNOWLEDGED`
- `TASK_RESOLVED`
- `TASK_DISMISSED`

Payload mínimo:

- `task_id`
- `restaurant_id`
- `task_type`
- `priority`
- `status`
- `origin` (`AUTO`, `MANUAL`, `SYSTEM`)

### 2.4. Stock operacional

- `STOCK_MOVEMENT_APPLIED`
- `STOCK_ALERT_RAISED` (ligado a `ESTOQUE_CRITICO`, `RUPTURA_PREVISTA`)

Payload mínimo:

- `stock_item_id`
- `restaurant_id`
- `movement_type` (`IN`, `OUT`, `ADJUSTMENT`)
- `quantity_delta`
- `reason` (`VENDA`, `COMPRA`, `DESPERDICIO`, `INVENTARIO`, …)

### 2.5. Fiscal / reconciliação

- `FISCAL_SYNC_REQUESTED`
- `FISCAL_SYNC_CONFIRMED`
- `FISCAL_SYNC_FAILED`

Payload mínimo:

- `restaurant_id`
- `turn_id` / `shift_id`
- `total_operational_cents`
- `total_fiscal_cents` (quando disponível)
- `pos_system` (identificador do POS fiscal)
- `status` / `error_code`

### 2.6. Runtime & saúde

- `CORE_HEALTH_CHANGED`
- `DEVICE_HEARTBEAT`

Payload mínimo:

- `restaurant_id` (quando aplicável)
- `device_id` / `device_type`
- `previous_status`, `current_status`

---

## 3. Schema do `core_event_log`

Tabela central em Core, append‑only.

Nome sugerido: `core_event_log`.

### 3.1. Colunas mínimas

- `id` (PK, UUID)
- `created_at` (timestamp com timezone, default `now()`)
- `tenant_id` / `restaurant_id` (FK lógico para `gm_restaurants.id`)
- `event_type` (text/varchar, um dos tipos canónicos)
- `source` (ex.: `TPV`, `KDS`, `WEB_PUBLIC`, `TASK_ENGINE`, `STOCK_ENGINE`, `FISCAL_BRIDGE`)
- `correlation_id` (UUID ou string, liga vários eventos do mesmo fluxo: ex. pedido+fiscal)
- `payload` (`jsonb`)

### 3.2. Índices recomendados

- `core_event_log(restaurant_id, created_at DESC)`
- `core_event_log(event_type, created_at DESC)`
- Opcional: `core_event_log(correlation_id)` para debugging.

### 3.3. Regras

- **Append‑only**:
  - `UPDATE` e `DELETE` proibidos (a nível de policy ou disciplina).
- **Imutável**:
  - `payload` não é editado após inserção; correções geram **novo evento**.
- **Escopo por tenant**:
  - Toda leitura deve respeitar `restaurant_id` (ver `QUERY_DISCIPLINE_CONTRACT.md`).

---

## 4. Integração com módulos

### 4.1. Pedidos

- Writers de pedido (ex.: `CoreOrdersApi`, RPCs `create_order_atomic`, `performOrderAction`) devem:
  - emitir `ORDER_CREATED`/`ORDER_PAID`/`ORDER_CANCELLED` após commit bem‑sucedido;
  - usar o mesmo `correlation_id` entre:
    - criação do pedido,
    - movimentos de stock derivados,
    - sync fiscal.

### 4.2. Tasks

- Task Engine (`gm_tasks` writers) deve:
  - emitir `TASK_CREATED` ao criar tasks automáticas;
  - emitir `TASK_ACKNOWLEDGED` / `TASK_RESOLVED` / `TASK_DISMISSED` quando a equipa atua.

### 4.3. Stock

- Módulo de stock (ver `STOCK_OS_CONTRACT.md`) deve:
  - emitir `STOCK_MOVEMENT_APPLIED` para cada movimento persistido;
  - emitir `STOCK_ALERT_RAISED` quando gera tasks de stock crítico/ruptura prevista.

### 4.4. Fiscal

- Bridge fiscal (microserviço, função edge ou adapter) deve:
  - emitir `FISCAL_SYNC_REQUESTED` quando envia dados para o POS fiscal;
  - emitir `FISCAL_SYNC_CONFIRMED` ou `FISCAL_SYNC_FAILED` com detalhes.

---

## 5. Views e consumo de dados

Para respeitar o `QUERY_DISCIPLINE_CONTRACT.md`, leitores nunca devem fazer
`SELECT *` direto em `core_event_log` para casos usuais.

Views recomendadas:

- `vw_order_events_by_restaurant_and_period`
  - Foca em `ORDER_*` por `restaurant_id` + intervalo de tempo.
- `vw_task_events_by_restaurant_and_period`
  - Foca em `TASK_*`.
- `vw_fiscal_events_by_restaurant_and_period`
  - Foca em `FISCAL_*` para reconciliação.

Uso típico:

- Dashboards de **Comando Central** e **Multi‑unidade** leem views
  agregadas, não a tabela bruta.
- Reconciliação fiscal usa:
  - `vw_fiscal_events_by_restaurant_and_period`
  - + dados de `gm_fiscal_snapshots` / `gm_reconciliations`.

---

## 6. Ligação com Observabilidade

`core_event_log` não substitui logs de aplicação nem métricas de
observabilidade, mas complementa:

- `Logger.ts` continua a registar erros/avisos com `restaurant_id`,
  `device_id`, etc.;
- `errorsStore` e `latencyStore` usam `correlation_id` para ligar UX ↔ Core;
- `ObservabilityPage.tsx` pode, numa iteração futura, mostrar:
  - contagem de eventos por tipo;
  - timelines de `FISCAL_SYNC_*` e falhas.

---

## 7. Próximos passos

1. Criar migrations no Core para `core_event_log` conforme este contrato.
2. Adaptar writers de pedidos, tasks, stock e fiscal para emitirem eventos.
3. Criar pelo menos 1 view de leitura por domínio (orders, fiscal).
4. Ligar relatórios de reconciliação e dashboards multi‑unidade a estas views.

