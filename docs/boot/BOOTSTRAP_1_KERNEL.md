# Bootstrap 1 — Kernel Boot (Contratos + Schemas)

Gravar as leis do mundo. Aplica World Schema v1, Menu Building Contract v1, Core Finance Contract v1, Order Status Contract v1; seeds mínimos. Saída: **o mundo tem gramática e regras**.

---

## Purpose

Garantir que o banco de dados reflecte os contratos canónicos (tabelas, constraints, RPCs) e que existe um estado mínimo utilizável (store seed, tax profiles, etc.). O Kernel é o cérebro lógico do sistema.

---

## Inputs

- **Boot 0 concluído** — Postgres a correr; volumes montados para `docker-entrypoint-initdb.d`.
- Ficheiros de schema e seeds em [docker-core/schema/](../../docker-core/schema/).

---

## Outputs

- Tabelas do World Schema (ou equivalente actual: gm_restaurants, gm_orders, gm_order_items, gm_products, gm_menu_categories, gm_tables, etc.).
- RPCs oficiais (ex.: `create_order_atomic`, `update_order_status`, `mark_item_ready`).
- Seeds mínimos aplicados: tenant de teste, restaurante piloto (ex.: `00000000-0000-0000-0000-000000000100`), categorias e produtos de exemplo, mesas.
- **Saída semântica:** “o mundo tem gramática e regras”.

---

## Invariants

- Nenhuma escrita operacional (pedidos reais, pagamentos) antes do Kernel estar aplicado.
- Contratos em [docs/contracts/](../../docs/contracts/) são a fonte de verdade; o schema e RPCs implementam-nos (WORLD_SCHEMA_v1, MENU_BUILDING_CONTRACT_v1, CORE_FINANCE_CONTRACT_v1, ORDER_STATUS_CONTRACT_v1).

---

## Commands

O Kernel é aplicado automaticamente no **primeiro** `docker compose up` do Boot 0, via scripts em `/docker-entrypoint-initdb.d/` (core_schema.sql, seeds_dev.sql, migrations consolidadas, etc.). Não há comando separado para “só Kernel” em ambiente normal.

Para **re-aplicar do zero** (reset total):

```bash
docker compose -f docker-core/docker-compose.core.yml down -v
docker compose -f docker-core/docker-compose.core.yml up -d
```

Aguarde initdb terminar; depois os smoke tests devem passar.

---

## Smoke tests

1. **RPC existe** — `docker compose -f docker-core/docker-compose.core.yml exec postgres psql -U postgres -d chefiapp_core -c "\df create_order_atomic"` lista a função.
2. **Seed store existe** — `SELECT id FROM gm_restaurants WHERE id = '00000000-0000-0000-0000-000000000100';` retorna uma linha.
3. **Produtos existem** — `SELECT COUNT(*) FROM gm_products WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';` retorna > 0.
4. **create_order_atomic retorna id** — Chamada POST para PostgREST `/rpc/create_order_atomic` com body válido (p_restaurant_id, p_items) retorna JSON com `id` e `total_cents`.
5. **Constraint uma mesa um pedido aberto** — Índice `idx_one_open_order_per_table` existe; tentativa de segundo OPEN na mesma mesa falha (conforme contrato).
