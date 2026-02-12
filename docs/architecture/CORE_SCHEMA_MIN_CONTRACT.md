# CORE_SCHEMA_MIN_CONTRACT — Schema mínimo para o ChefIApp™ OS operar

> Este contrato define **o conjunto mínimo de tabelas e relações** que o Docker Core precisa de ter em todos os ambientes (dev/staging/prod) para que o ChefIApp™ OS cumpra o que a landing e os docs prometem.

---

## 1. Objetivo

- Evitar situações em que a app está saudável, mas o Core falha (400/404) por falta de tabelas/migrations.
- Definir o **núcleo de schema obrigatório** para o OS:
  - pedidos,
  - restaurantes/tenants,
  - reservas/clientes,
  - tarefas/risco,
  - stock operacional.
- Servir de base para:
  - migrations consistentes em todos os ambientes;
  - healthchecks automatizados (scripts/checklists).

---

## 2. Tabelas mínimas obrigatórias

### 2.1. Tenancy e restaurante

#### `gm_restaurants`

Representa cada restaurante/unidade operada pelo OS.

- Campos essenciais (conceituais):
  - `id` (PK, UUID)
  - `name`
  - `status` / `operation_status` (ex.: `active`, `paused`, `suspended`)
  - `slug` (para página pública / web)
  - `topology` / `operation_metadata` (JSON para features/outlets)

- Relações:
  - `id` é referenciado por praticamente todas as outras tabelas via `restaurant_id`.

#### `gm_restaurant_members`

Mapeia utilizadores → restaurantes com roles.

- Campos essenciais:
  - `id` (PK)
  - `user_id`
  - `restaurant_id` (FK → `gm_restaurants.id`)
  - `role` (ex.: `owner`, `manager`, `waiter`, `kitchen`, `staff`)

- Uso:
  - `TenantContext` resolve o tenant ativo a partir desta tabela.

---

### 2.2. Pedidos e itens (núcleo OS)

#### `gm_orders`

Pedido operacional por mesa/cliente.

- Campos essenciais:
  - `id` (PK, UUID)
  - `restaurant_id` (FK → `gm_restaurants.id`)
  - `number` / `short_id`
  - `status` (ex.: `new`, `open`, `in_prep`, `ready`, `served`, `paid`, `cancelled`)
  - `source` (ex.: `TPV`, `WEB_PUBLIC`, `DELIVERY`, `STAFF_APP`)
  - `total` (cents)
  - `table_id` / `table_number` (quando aplicável)
  - `created_at`, `updated_at`

- Impacto:
  - TPV, KDS, dashboards, tasks, fiscal, analytics.

#### `gm_order_items`

Itens de cada pedido (linha de produto).

- Campos essenciais:
  - `id` (PK)
  - `order_id` (FK → `gm_orders.id`)
  - `product_id`
  - `name_snapshot`
  - `quantity`
  - `unit_price` / `price_cents`
  - `station` (ex.: `KITCHEN`, `BAR`)
  - `prep_time_seconds` (para KDS/Task Engine)
  - `created_at`, `ready_at`

- Impacto:
  - KDS (`calculateOrderStatus`, timers),
  - Task Engine (atraso de item),
  - stock (abate de ingredientes),
  - analytics por produto/categoria.

---

### 2.3. Tasks / Monitor de Risco

#### `gm_tasks`

Central de tarefas automáticas e manuais ligadas à operação.

- Campos essenciais:
  - `id` (PK)
  - `restaurant_id` (FK)
  - `task_type` (ex.: `ATRASO_ITEM`, `ESTOQUE_CRITICO`, `RUPTURA_PREVISTA`, `PEDIDO_ESQUECIDO`, etc.)
  - `station` (ex.: `KITCHEN`, `BAR`, `SERVICE`)
  - `priority` (ex.: `CRITICA`, `ALTA`, `MEDIA`, `LOW`)
  - `status` (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED`)
  - `message` (texto curto orientado à equipa)
  - `context` (JSON com ids de pedido/item/stock, etc.)
  - `auto_generated` (boolean)
  - `created_at`, `acknowledged_at`, `resolved_at`, `updated_at`

- Impacto:
  - `TaskSystemMinimal`, `TaskPanel` em KDS,
  - dashboards internos de risco.

---

### 2.4. Reservas e clientes

Estas tabelas suportam o módulo **Reservas & Sala** e parte da narrativa da landing.

#### `gm_customers`

Identidade básica de clientes (opcional, mas recomendada).

- Campos essenciais:
  - `id` (PK)
  - `restaurant_id` (FK)
  - `name`
  - `phone` / `email`
  - `created_at`

#### `gm_reservations`

Reservas ligadas a mesas/slots de tempo.

- Campos essenciais:
  - `id` (PK)
  - `restaurant_id` (FK)
  - `customer_id` (FK → `gm_customers.id`, opcional)
  - `reservation_date` / `reservation_time`
  - `party_size`
  - `status` (ex.: `booked`, `seated`, `no_show`, `cancelled`)
  - `origin` (`WEB_PUBLIC`, `PHONE`, `WALK_IN`, etc.)
  - `created_at`, `updated_at`

- Impacto:
  - `ReservationBoard`, páginas de reservas admin, stats de no-show,
  - integração com TPV (reserva → pedido/mesa).

---

### 2.5. Stock operacional (mínimo)

Não define o ERP completo, apenas a base para stock ligado ao serviço.

#### `gm_stock_items`

Representa cada item de stock controlado.

- Campos essenciais:
  - `id` (PK)
  - `restaurant_id` (FK)
  - `name`
  - `unit` (ex.: `kg`, `L`, `un`)
  - `current_quantity`
  - `min_quantity` (limiar para alerta)
  - `category` (opcional)

#### `gm_stock_movements`

Movimentos de stock (entrada/saída/ajuste).

- Campos essenciais:
  - `id` (PK)
  - `restaurant_id` (FK)
  - `stock_item_id` (FK → `gm_stock_items.id`)
  - `type` (`IN`, `OUT`, `ADJUSTMENT`)
  - `quantity_delta`
  - `reason` (ex.: `VENDA`, `COMPRA`, `DESPERDICIO`, `INVENTARIO`)
  - `order_id` / `order_item_id` (quando movimento vem de venda)
  - `created_at`

#### (Opcional inicial) `gm_recipes` / fichas técnicas

Se já existir ou vier a existir, deve ligar:

- `product_id` → ingredientes (`stock_item_id`) + quantidades por unidade vendida.

---

## 3. Requisitos de migrations e seeds

### 3.1. Migrations

- Todas as tabelas desta lista devem ter migrations:
  - idempotentes e versionadas;
  - aplicadas em **dev, staging e prod** antes de levantar front.
- Qualquer alteração futura nestas tabelas deve:
  - manter compatibilidade com a app (evitar renomes/remoções abruptas de colunas usadas);
  - actualizar os contratos de docs quando necessário.

### 3.2. Seeds mínimas (ambiente de desenvolvimento)

- Dev local (Docker) deve ter pelo menos:
  - 1 `gm_restaurants` seed (ex.: `SEED_RESTAURANT_ID`);
  - memberships em `gm_restaurant_members` para utilizador de teste;
  - alguns produtos/menu (para TPV/Web);
  - alguns `gm_stock_items` com `min_quantity` configurado;
  - opcionalmente, 1–2 reservas de exemplo.

**Objetivo:** permitir que TPV, KDS, TaskSystem, PublicWeb e Reservas funcionem “out of the box” em dev.

---

## 4. Healthcheck de schema (recomendado)

Antes de levantar o frontend em qualquer ambiente, executar um healthcheck de schema mínimo:

- Script (bash/node) que:
  - verifica que todas as tabelas deste contrato existem;
  - opcionalmente, verifica presença de colunas-chave (ex.: `restaurant_id`, `status`, `created_at`).
- Em caso de falha:
  - abortar startup ou exibir mensagem clara para o developer/ops:
    - ex.: “Core schema incompleto — execute migrations X/Y/Z para garantir gm_reservations e gm_customers.”

---

## 5. Uso deste contrato

Sempre que:

- um novo módulo quiser depender de uma tabela Core nova, ou\n- uma tabela existente for alterada de forma significativa,

deve-se:

1. actualizar este contrato (ou criar um contrato específico, se for módulo avançado);
2. garantir migrations consistentes;
3. alinhar landing/docs se isso afetar a promessa feita ao utilizador.

