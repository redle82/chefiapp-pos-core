# Menu Derivações — Checklist de implementação

> Lista verificável por módulo. Ref: [MENU_DERIVATIONS.md](./MENU_DERIVATIONS.md), [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md).

---

## TPV

- [x] MenuState consumido (ORE usa `useMenuState()`; bloqueio quando !== LIVE).
- [x] Auditoria organismo: [ORE_ORGANISM_AND_MENU.md §7](./ORE_ORGANISM_AND_MENU.md#7-auditoria-do-músculo-tpv) — TPV como músculo (gate ORE, consumo Menu, snapshot no pedido).
- [x] Bloqueio se não LIVE (useOperationalReadiness bloqueia TPV quando `menuState !== "LIVE"`).
- [x] Mensagem humana por estado (BlockingScreen usa `MENU_STATE_MESSAGES[menuState].blockTpv` quando NOT_PUBLISHED).
- [x] Snapshot no create_order (OrderContextReal / create_order_atomic enviam product_id, name, unit_price no momento da criação; RPC persiste em gm_order_items).

---

## KDS

- [x] Apenas product_id + nome (KDS Minimal: removida exibição de Total e subtotal por item).
- [x] Zero preço na UI/lógica (comentário MENU_DERIVATIONS no ficheiro; preço não exibido).
- [x] Auditoria organismo: [ORE_ORGANISM_AND_MENU.md §8](./ORE_ORGANISM_AND_MENU.md#8-auditoria-do-músculo-kds) — KDS como músculo (gate ORE, pedidos/itens do Core, zero preço).

---

## QR/Web

- [x] Abre só se LIVE (PublicWebPage verifica `restaurantData.status === "active"` após carregar por slug; se não, mostra bloqueio).
- [x] Read-only (menu carregado via readMenu; sem escrita).
- [x] Sem cache como autoridade (readMenu sem cache agressivo como fonte de decisão; copy MENU_NOT_LIVE_WEB_MESSAGE quando não LIVE).
- [x] Auditoria organismo: [ORE_ORGANISM_AND_MENU.md §9](./ORE_ORGANISM_AND_MENU.md#9-auditoria-do-músculo-qrweb) — QR/Web como músculo (gate por status, menu do Core, snapshot no pedido).

---

## Tasks

- [x] Referência simbólica ao item (product_id + nome); zero preço (TaskReader / gm_tasks; tarefas geradas a partir de pedidos).
- [x] Não usa Tasks para decidir preço ou disponibilidade de venda (MENU_DERIVATIONS).
- [x] Auditoria organismo: [ORE_ORGANISM_AND_MENU.md §11](./ORE_ORGANISM_AND_MENU.md#11-auditoria-do-músculo-tasks) — Tasks como músculo (consumidor indireto via pedidos; product_id + nome; zero preço).

---

## Stock / Inventory

- [x] Consumo por product_id (receitas, BOM, ingredientes); InventoryStockReader + gm_products (id, name); preço não derivado para venda.
- [x] Auditoria organismo: [ORE_ORGANISM_AND_MENU.md §12](./ORE_ORGANISM_AND_MENU.md#12-auditoria-do-músculo-stockinventory) — Stock como músculo (portal; product_id para BOM; sem preço de venda).

---

## Relatórios

- [x] Join por product_id + snapshot (AdvancedReportingService: comentário MENU_DERIVATIONS; quando agregar por produto/receita, usar gm_order_items com product_id + price_snapshot).
- [x] Sem recálculo de preço (regra documentada no serviço; totais a partir de snapshots persistidos).
- [x] Auditoria organismo: [ORE_ORGANISM_AND_MENU.md §13](./ORE_ORGANISM_AND_MENU.md#13-auditoria-do-músculo-relatórios) — Relatórios como músculo (join product_id + snapshot; sem recálculo).

---

## Dashboard

- [x] Mostra MenuState como sinal vital (DashboardPortal: secção com mensagem curta por estado — EMPTY, INCOMPLETE, VALID_UNPUBLISHED, LIVE).
- [x] Auditoria organismo: [ORE_ORGANISM_AND_MENU.md §10](./ORE_ORGANISM_AND_MENU.md#10-auditoria-dashboard-e-configsidebar) — Dashboard consome MenuState como sinal vital; portal sempre acessível.

---

## Config / Sidebar

- [x] Indicador do MenuState na Config (ConfigSidebar: ícone + label curto por estado, abaixo do título da sidebar).
- [x] Auditoria organismo: [ORE_ORGANISM_AND_MENU.md §10](./ORE_ORGANISM_AND_MENU.md#10-auditoria-dashboard-e-configsidebar) — Config/Sidebar consome MenuState como sinal vital.

---

## Fonte única: MenuState

- [x] Tipo e derivação em `merchant-portal/src/core/menu/MenuState.ts` (deriveMenuState, useMenuState, MENU_STATE_MESSAGES).
- [x] ORE usa MenuState para TPV/KDS (useOperationalReadiness usa `menuState !== "LIVE"` para NOT_PUBLISHED).
- [x] BlockingScreen usa mensagem por estado quando NOT_PUBLISHED.

---

## Referências

- [MENU_DERIVATIONS.md](./MENU_DERIVATIONS.md)
- [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md)
- [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md)
