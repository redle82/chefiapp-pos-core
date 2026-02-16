# Melhorias KDS e Bar — Contratos e documentação (2026-02)

**Propósito:** Listar as melhorias feitas no KDS e no fluxo Bar vs Cozinha e indicar onde está o contrato e o código, para que nada tenha de ser refeito sem referência.

---

## 1. Resumo das melhorias

| # | Melhoria | Contrato | Enforcement (ficheiros principais) |
|---|----------|----------|-------------------------------------|
| 1 | Layout KDS: sem barra preta no rodapé; scroll só na lista | [KDS_LAYOUT_UX_CONTRACT.md](../contracts/KDS_LAYOUT_UX_CONTRACT.md) | `KDSMinimal.tsx`, `OperationalFullscreenWrapper.tsx` |
| 2 | Lista de pedidos: filtro activeOnly (sem READY/CLOSED); mensagem "Nenhum pedido em preparação" | [KDS_LAYOUT_UX_CONTRACT.md](../contracts/KDS_LAYOUT_UX_CONTRACT.md) §4 | `KDSMinimal.tsx` |
| 3 | Tabs Todas / Cozinha / Bar; filtro por station | [KDS_LAYOUT_UX_CONTRACT.md](../contracts/KDS_LAYOUT_UX_CONTRACT.md) §3, [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md) | `KDSMinimal.tsx` |
| 4 | Pedidos de bar aparecem no separador Bar | [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md) | `OrderReader.ts` (readOrderItems + join gm_products), `KDSMinimal.tsx` (filterOrdersByStation) |
| 5 | Produtos de bar por categoria (Bebidas, etc.) no Core | [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md) §3 | `20260224_bar_products_by_category.sql` |
| 6 | Station em itens de pedido: snapshot do produto + fallback na leitura | [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md) §2, §4 | `core_schema.sql` (create_order_atomic), `OrderReader.ts` |
| 7 | Secções COZINHA e BAR em cada card de pedido no KDS | [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md) §5 | `KDSMinimal.tsx` (itemsByStation, render COZINHA/BAR) |
| 8 | Catálogo: guardar e listar station (BAR/KITCHEN) | [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md) §3, §6 | `catalogApi.ts`, `catalogTypes.ts`, `RestaurantReader.ts` |
| 9 | OriginBadge: GERENTE/DONO/COZINHA e mesa | (comportamento KDS; pode ser referido em KDS_LAYOUT_UX ou doc de UX) | `KDSMinimal/OriginBadge.tsx` |
| 10 | Migração OPEN→READY e RPCs start_task/complete_task | Core; ref. em fluxo de pedido | `20260223_kds_open_to_ready_and_task_rpcs.sql` |

---

## 2. Contratos criados

- **[KDS_LAYOUT_UX_CONTRACT.md](../contracts/KDS_LAYOUT_UX_CONTRACT.md)** — Layout e UX do KDS: flex column, um único scroll na lista, sem barra preta no rodapé; tabs Todas/Cozinha/Bar; filtro activeOnly e mensagem quando não há pedidos em preparação.
- **[KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md)** — Bar vs Cozinha: station em gm_products e gm_order_items; migração 20260224; fallback de station na leitura de itens (OrderReader); filtro e secções COZINHA/BAR no KDS; catálogo e Core.

---

## 3. Índice de contratos

Estes contratos estão referenciados em:

- [docs/contracts/README.md](../contracts/README.md) — tabela de documentos do diretório contracts.
- [docs/architecture/CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md) — índice canónico (secção KDS / Operacionais).

---

## 4. Demos e guias

- **Demo pedidos (mesmo restaurante, TPV → KDS):** `scripts/ops/run-demo-orders.sh`; guia [DEMO_5_SIMULADORES_GUIA.md](../ops/DEMO_5_SIMULADORES_GUIA.md) (mesmo restaurante, run-demo-orders, Androids offline, Bar vs Cozinha).

---

## 5. Anti-regressão por melhoria (não voltar a fazer)

Cada melhoria tem regras explícitas para evitar regressão. Alterar só com referência ao contrato e atualizar o doc.

| # | Melhoria | O que NÃO voltar a fazer | Contrato / doc |
|---|----------|---------------------------|----------------|
| 1 | Layout KDS: scroll, sem barra preta | Não usar no root `minHeight: 100vh` sem flex column; não usar na área de lista `maxHeight: calc(100vh - Npx)` — usar `flex: 1`, `minHeight: 0`, `overflowY: auto`. | KDS_LAYOUT_UX_CONTRACT §5 |
| 2 | Filtro activeOnly (sem READY/CLOSED) | Não mostrar pedidos READY/CLOSED na lista principal; não remover a mensagem "Nenhum pedido em preparação (todos prontos ou fechados)" quando filteredOrders.length > 0 e activeOnly.length === 0. | KDS_LAYOUT_UX_CONTRACT §4 |
| 3 | Tabs Todas / Cozinha / Bar | Não remover as três tabs; não desligar stationFilter de activeTab; manter filterOrdersByStation(orders, stationFilter) antes de activeOnly. | KDS_LAYOUT_UX_CONTRACT §3, KDS_BAR_COZINHA_STATION_CONTRACT |
| 4 | Pedidos de bar no separador Bar | Não remover o join com `gm_products` em readOrderItems; não deixar de normalizar station (item.station ?? product?.station ?? "KITCHEN") para "BAR" ou "KITCHEN". | KDS_BAR_COZINHA_STATION_CONTRACT §4 |
| 5 | Produtos BAR por categoria | Não remover a migração 20260224_bar_products_by_category.sql do init do Docker; não deixar de marcar categorias (bebida, bar, etc.) e prep_category=drink como station BAR. | KDS_BAR_COZINHA_STATION_CONTRACT §3 |
| 6 | Station em itens (snapshot + fallback) | Não deixar de copiar station do produto para gm_order_items no create_order_atomic (Core); não remover o fallback na leitura (OrderReader). | KDS_BAR_COZINHA_STATION_CONTRACT §2, §4 |
| 7 | Secções COZINHA e BAR em cada card | Não mostrar só uma secção; manter sempre as duas (COZINHA e BAR), com 0 items quando não houver; agrupar por item.station normalizado. | KDS_BAR_COZINHA_STATION_CONTRACT §5 |
| 8 | Catálogo: station BAR/KITCHEN | Não deixar de guardar e listar station no catálogo (catalogApi, catalogTypes); RestaurantReader deve expor station em CoreProduct. | KDS_BAR_COZINHA_STATION_CONTRACT §6 |
| 9 | OriginBadge: GERENTE/DONO/COZINHA e mesa | Não remover createdByRole nem tableNumber do OriginBadge; manter mapeamento GERENTE/MANAGER, DONO/OWNER, COZINHA/KITCHEN; exibir mesa quando disponível. | KDS_LAYOUT_UX_CONTRACT §7 (OriginBadge) |
| 10 | Log KDS só quando número de pedidos muda | Não voltar a logar em cada loadOrders; manter ordersRef e logar apenas quando prevCount !== ordersWithItems.length (evitar spam em DEV). | KDS_LAYOUT_UX_CONTRACT §7 (Log) |
| 11 | Migração OPEN→READY e RPCs tarefas | Não remover 20260223 do init; trigger deve permitir OPEN→READY; start_task e complete_task devem existir e ser usados pelo TaskPanel. | Core; docker-compose.core.yml init |
| 12 | Scripts e guia demo | Não remover run-demo-orders.sh nem open-tpv-kds-central.sh; guia DEMO_5_SIMULADORES_GUIA.md deve referir mesmo restaurante, Bar vs Cozinha, Androids. | docs/ops/DEMO_5_SIMULADORES_GUIA.md |

---

## 6. Comentários no código (referência aos contratos)

Os ficheiros críticos incluem comentários que apontam para os contratos; ao alterar, verificar o doc e manter a regra.

| Ficheiro | Onde | Referência |
|----------|------|------------|
| KDSMinimal.tsx | Cabeçalho do ficheiro (bloco FLUXO/Layout) | docs/contracts/KDS_LAYOUT_UX_CONTRACT.md |
| KDSMinimal.tsx | activeOnly, filterOrdersByStation, root div (flex) | KDS_LAYOUT_UX_CONTRACT §2, §4; KDS_BAR_COZINHA_STATION_CONTRACT §5 |
| OrderReader.ts | readOrderItems (join gm_products, fallback station) | KDS_BAR_COZINHA_STATION_CONTRACT §4 |
| OriginBadge.tsx | Cabeçalho / props createdByRole, tableNumber | KDS_LAYOUT_UX_CONTRACT §7 |

---

Última atualização: 2026-02 — Documentação das melhorias KDS e Bar e respetivos contratos; anti-regressão por melhoria e comentários no código.
