# Bootstrap 4 — Restaurant Runtime Boot

Criar um restaurante “activo” de verdade: store + spaces, tables, open_hours, payment_methods, preparation_times, world_config, menu mínimo. Saída: **existe um restaurante operacional**.

---

## Purpose

Garantir que o restaurante não é só um registo; tem espaços (salão, cozinha, bar), mesas, horários, métodos de pagamento, tempos de preparação e config do mundo (timezone, moeda, etc.). Menu em estado draft mínimo ou exige setup antes de operar.

---

## Inputs

- **Boot 1** — Schema com gm_restaurants, gm_tables, gm_products, gm_menu_categories, world_config (ou equivalente).
- **Boot 2** — Identidade e tenancy.
- **Boot 3** — Billing válido (TRIAL_ACTIVE ou plano activo).

---

## Outputs

- Restaurante (store) com pelo menos um espaço lógico (ex.: salão, cozinha) — se a tabela store_spaces existir; senão, o próprio restaurante conta como “um espaço”.
- Mesas criadas (gm_tables); seeds em [docker-core/schema/seeds_dev.sql](../../docker-core/schema/seeds_dev.sql) já criam 10 mesas para o piloto.
- Config do restaurante: open_hours, payment_methods, preparation_times (conforme schema e seeds).
- world_config (timezone, currency, tax_rules, legal_tasks_enabled) preenchido ou default.
- Menu mínimo: categorias e produtos activos (seeds dev já incluem Entradas, Pratos, Bebidas, Sobremesas e produtos de exemplo).
- **Saída semântica:** “existe um restaurante operacional”.

---

## Invariants

- Nenhum pedido real sem restaurante com menu válido (pelo menos um produto activo).
- Mesas e espaços permitem que TPV e KDS saibam onde encaixar pedidos/tarefas.

---

## Commands

- **Seeds** — Aplicados no initdb (Boot 1): seeds_dev.sql, 06-seed-enterprise.sql (se existir). Não é necessário comando extra para o piloto.
- **Setup manual (produção)** — Menu Builder, Config (horários, pagamentos, preparação) via merchant portal. Se o fluxo exigir Setup Wizard antes de operar, esse wizard preenche Boot 4.

Referência: [docker-core/schema/seeds_dev.sql](../../docker-core/schema/seeds_dev.sql), [docs/contracts/WORLD_SCHEMA_v1.md](../contracts/WORLD_SCHEMA_v1.md).

---

## Smoke tests

1. **Restaurante seed existe** — `SELECT id, name FROM gm_restaurants WHERE id = '00000000-0000-0000-0000-000000000100';` retorna uma linha.
2. **Mesas existem** — `SELECT COUNT(*) FROM gm_tables WHERE restaurant_id = '00000000-0000-0000-0000-000000000100';` retorna >= 1.
3. **Categorias e produtos** — `SELECT COUNT(*) FROM gm_products p JOIN gm_menu_categories c ON p.category_id = c.id WHERE c.restaurant_id = '00000000-0000-0000-0000-000000000100' AND p.available = true;` retorna >= 1.
4. **create_order_atomic com produto do seed** — POST /rpc/create_order_atomic com p_restaurant_id do seed e p_items com product_id válido retorna order id e total_cents.
5. **Config (opcional)** — Se world_config ou equivalente existir, o restaurante piloto tem linha ou default documentado.
