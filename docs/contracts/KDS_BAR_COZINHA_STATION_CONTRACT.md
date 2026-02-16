# Contrato: KDS — Bar vs Cozinha (station)

**Propósito:** Definir como pedidos de bar aparecem no separador Bar do KDS e como produtos/itens são marcados como BAR ou KITCHEN. Fonte de verdade para Core, catálogo e leitura de pedidos.

**Referências:** [CORE_KDS_CONTRACT.md](../architecture/CORE_KDS_CONTRACT.md), [KDS_LAYOUT_UX_CONTRACT.md](./KDS_LAYOUT_UX_CONTRACT.md).

---

## 1. Lei da estação

- **Estação** é BAR ou KITCHEN. Produtos têm `station` em `gm_products`; itens de pedido têm `station` em `gm_order_items` (snapshot no momento da criação do pedido).
- O KDS filtra por **stationFilter** (ALL | BAR | KITCHEN). No separador **Bar** só aparecem pedidos que tenham pelo menos um item com `station === 'BAR'`.
- Em cada card de pedido, os itens são agrupados em secções **COZINHA** e **BAR** conforme `item.station`; valores possíveis normalizados para "BAR" ou "KITCHEN".

---

## 2. Core — criação de pedido

- Ao criar pedido (RPC `create_order_atomic` ou equivalente), cada linha de `gm_order_items` deve receber **station** do produto (`gm_products.station`) no momento do insert. Snapshot imutável após criação.
- Se o produto não tiver station, usar `COALESCE(v_station, 'KITCHEN')`. Schema: `docker-core/schema/core_schema.sql` (bloco INSERT gm_order_items).

---

## 3. Produtos BAR no Core

- **Migração 20260224** (`docker-core/schema/migrations/20260224_bar_products_by_category.sql`): marca como BAR os produtos em categorias cujo nome contém (ILIKE) termos como: bebida, bar, cerveja, vinho, café, sumo, sangría, coctel, copas, licor, refresco, água, etc.; e os produtos com `prep_category = 'drink'`.
- Catálogo/Menu Builder deve guardar e listar **station** (BAR | KITCHEN) em `gm_products`; ao criar/editar produto, o utilizador pode definir estação; ao listar, o frontend usa esse valor.
- Seed de desenvolvimento: categoria "Bebidas" e produtos (ex.: Água, Refrigerante) ficam com station BAR após 20260224.

---

## 4. Leitura de itens — fallback de station

- **OrderReader.readOrderItems**: deve obter `station` do item; se o item tiver `station` null (pedidos antigos ou dados incompletos), usar **station do produto** via join com `gm_products`. Query: `select("*, gm_products(station)")`; no mapeamento: `station = item.station ?? product?.station ?? "KITCHEN"`, normalizado para "BAR" ou "KITCHEN" (uppercase).
- Assim, pedidos com itens de produtos BAR aparecem no separador Bar mesmo que o snapshot no item esteja null.

---

## 5. Filtro no KDS

- **filterOrdersByStation**: dado stationFilter (ALL | BAR | KITCHEN), filtrar pedidos mantendo apenas itens com `item.station === stationFilter`; descartar pedidos com zero itens após filtro. Quando stationFilter === "ALL", devolver todos os pedidos sem filtrar itens por station.
- **Agrupamento por secção**: em cada pedido, agrupar itens por `(item.station ?? "KITCHEN") === "BAR" ? "BAR" : "KITCHEN"`; exibir sempre as duas secções (COZINHA e BAR), com 0 items quando aplicável.

---

## 6. Ficheiros de enforcement

| Contrato | Ficheiro / Recurso |
|----------|---------------------|
| Station no create order | `docker-core/schema/core_schema.sql` (create_order_atomic); `20260219_order_state_machine_and_tax.sql` se aplicável |
| Produtos BAR por categoria | `docker-core/schema/migrations/20260224_bar_products_by_category.sql` |
| Read order items + fallback | `merchant-portal/src/infra/readers/OrderReader.ts` — readOrderItems |
| Filtro e secções no KDS | `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx` — filterOrdersByStation, itemsByStation, COZINHA/BAR |
| Catálogo station | `merchant-portal/src/core/catalog/catalogApi.ts`, `catalogTypes.ts`; `RestaurantReader` com station em CoreProduct |

---

## 7. Anti-regressão

- **Não** remover o join com `gm_products` em readOrderItems; pedidos antigos ou itens sem snapshot dependem dele para aparecer no Bar.
- **Não** deixar de copiar `station` do produto para `gm_order_items` em qualquer RPC que insira itens.
- Ao adicionar novas categorias de bebidas no seed ou no produto, garantir que a migração 20260224 (ou regra equivalente) as considere para station BAR, ou que o catálogo permita definir station manualmente.

---

Última atualização: 2026-02 — Contrato Bar vs Cozinha (station). Não alterar sem atualizar este documento.
