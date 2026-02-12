# Query Discipline — Checklist de auditoria

**Data:** 2026-02-11  
**Objetivo:** Garantir que todas as queries ao Docker Core (PostgREST) são scoped por tenant (`restaurant_id` ou entidade filha). Nenhuma query operacional sem âmbito por restaurante.

**Regra:** Todas as queries ao Core devem ser scoped por `restaurant_id` (ou por entidade filha de restaurant, ex.: `order_id` obtido de lista já filtrada por `restaurant_id`). Falha explícita se faltar filtro em listagens.

---

## Readers (core-boundary/readers)

| Reader | Função principal | Usa restaurant_id (ou scope equivalente) | Notas |
|--------|------------------|------------------------------------------|--------|
| OrderReader | readActiveOrders, readReadyOrders, readOrderItems, readOrdersByDateRange, readOrdersForTable | Sim | Todas as listagens usam `.eq("restaurant_id", restaurantId)`. readOrderItems(orderId) é por order_id (order já scoped por restaurant). |
| RestaurantReader | readCategories, readProducts, readTableByNumber | Sim | URLs com `restaurant_id=eq.${restaurantId}`. |
| ShiftReader | getActiveShift, getShiftById | Sim | `.eq("restaurant_id", restaurantId)` ou getShiftById(id) por PK (id obtido em contexto scoped). |
| RuntimeReader | getRestaurant, getRestaurantModules, getActiveShift (runtime), listEquipmentByRestaurant, getTabIsolatedRestaurantId | Sim | getRestaurant(id) por PK; listagens por restaurant_id. |
| ProductReader | listProducts, readProduct | Sim | listProducts(restaurantId); readProduct(productId) por PK (caller deve ter contexto scoped). |
| MenuCatalogReader | getCatalogForRestaurant | Sim | `.eq("id", restaurantId)` e `.eq("restaurant_id", restaurantId)` em menus/items. |
| TaskReader | readOpenTasks, readTasksByOrderItem, readTasksByOrder, readOpenTasksByStation, readTaskById, readTasksByActor | Sim | Todas as listagens usam `.eq("restaurant_id", restaurantId)` ou filtro por order_id/item_id (já scoped). |
| ShiftChecklistReader | listTemplates, getItemsByTurnSession | Sim | `.eq("restaurant_id", restaurantId)`; getItemsByTurnSession por turn_session_id (scoped). |
| TaskPackReader | listPacks, getPackById, listEnabledPacksByOperationType | Sim | listPacks sem restaurant_id (lista global de packs); listEnabledPacksByOperationType(restaurantId). Ver nota abaixo. |
| RestaurantPeopleReader | listByRestaurant | Sim | `.eq("restaurant_id", restaurantId)`. |
| PulseReader | listByRestaurant, getByUser | Sim | `.eq("restaurant_id", restaurantId)` e getByUser(userId) com scope implícito. |
| EquipmentReader | listEquipmentByRestaurant, getEquipmentById | Sim | list por restaurant_id; get por id (scoped). |
| MapReader | listZones, listTables, getTable | Sim | `.eq("restaurant_id", restaurantId)` em todas. |
| InventoryStockReader | listLevels, getLevel, listByProduct, listLowStock | Sim | Todas com `.eq("restaurant_id", restaurantId)`. |
| ShoppingListReader | generate (RPC) | Sim | RPC com `p_restaurant_id: restaurantId`. |

**Nota TaskPackReader:** `listPacks()` lista packs globais (is_active=true) sem restaurant_id; não é dado por restaurante, é catálogo. `listEnabledPacksByOperationType(restaurantId)` é scoped. Aceitável para v1.

---

## Writers (core-boundary/writers)

| Writer | Função principal | Usa restaurant_id (ou scope equivalente) | Notas |
|--------|------------------|------------------------------------------|--------|
| OrderWriter | createOrder, updateOrderStatus, markItemReady, cancelOrder | Sim | createOrder: p_restaurant_id; validação gm_products com restaurant_id=eq; update/mark/cancel com restaurantId. |
| RuntimeWriter | upsertRestaurantConfig, getRestaurantConfig, installModule | Sim | upsert/install por restaurant_id; get por id. |
| ShiftChecklistWriter | ensureTemplate, setItemsForTurnSession | Sim | ensureTemplate(restaurantId); setItems por turn_session_id (scoped). |
| TaskWriter | createTask, updateTask, assignTask, startTask, completeTask, rejectTask | Sim | RPCs com p_restaurant_id; updates por task id (task obtido em contexto scoped). |
| TaskPackWriter | enablePack, disablePack | Sim | `.eq("restaurant_id", restaurantId).eq("pack_id", packId)`. |
| StockWriter | adjustStock (RPC) | Sim | RPC com p_restaurant_id. |
| MenuWriter | upsertProduct, updateProductAvailability | Sim | restaurant_id no body; update por (productId, restaurant_id). |
| MapWriter | upsertZone, upsertTable, getZone, getTable | Sim | zone/table têm restaurant_id; get por id (scoped). |

---

## Outros consumidores de dockerCoreClient

| Ficheiro | Uso | Scoped por restaurant_id |
|----------|-----|---------------------------|
| dashboardService.ts | Métricas (mesas, asientos, dinero, etc.) | Sim — todas as queries usam restaurantId. |
| EventMonitor.ts | Pedidos/tabelas para realtime | Sim — restaurant_id no contexto. |
| RecurringTaskEngine.ts | recurring_tasks, RPCs | Sim — restaurantId nos RPCs e queries. |
| EventTaskGenerator.ts | task_rules, tasks | Sim — restaurant_id nas queries. |
| useAppStaffTables.ts | gm_tables | Sim — restaurant_id. |
| TerminalEngine.ts | gm_terminals (heartbeat) | Sim — device/restaurant context. |
| observabilityService.ts | gm_orders (pedidos hoje) | Sim — getOrdersCreatedTodayCount(restaurantId) com .eq("restaurant_id", restaurantId). |

---

## Resumo

- **Readers:** Todos os que fazem listagens por restaurante usam `restaurant_id`. Leituras por PK (id) assumem que o id foi obtido em contexto já scoped.
- **Writers:** Todos passam `restaurant_id` (ou RPC com p_restaurant_id) ou operam sobre entidade cujo id foi obtido em contexto scoped.
- **Regra de ouro:** Nenhuma listagem (SELECT sem filtro de tenant) sem `restaurant_id`. Em desenvolvimento, considerar assert ou log se algum reader/writer for chamado sem restaurant_id.

---

## Referências

- [QUERY_DISCIPLINE_CONTRACT.md](../architecture/QUERY_DISCIPLINE_CONTRACT.md) — Regra formal: todas as queries scoped por restaurant_id.
- [CONFIG_RUNTIME_CONTRACT.md](../contracts/CONFIG_RUNTIME_CONTRACT.md) — Config governa; runtime consome por restaurante.
- [INSFORGE_RLS_AUDIT_REPORT.md](../INSFORGE_RLS_AUDIT_REPORT.md) — RLS e isolamento por tenant.
- Migration de índices: [docker-core/schema/migrations/20260217_query_discipline_indexes.sql](../../docker-core/schema/migrations/20260217_query_discipline_indexes.sql).
