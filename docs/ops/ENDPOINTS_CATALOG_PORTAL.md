# Catálogo de Endpoints — Merchant Portal

**Propósito:** Tabela canónica Feature → Route UI → Reader(s) → Writer(s)/RPC → Tabelas/Endpoints Core. Fonte única para Boot, Design System e System Tree.

**Referências:** [CORE_SYSTEM_TREE_CONTRACT.md](../architecture/CORE_SYSTEM_TREE_CONTRACT.md), [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md).

---

## Tabela principal

| Feature (UI)            | Route (UI)                | Reader(s)                                     | Writer(s) / RPC                                        | Tabelas / Endpoints Core                                                                                         |
| ----------------------- | ------------------------- | --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Configurar restaurante  | /config, /config/identity | RuntimeReader, RestaurantReader               | RuntimeWriter, DbWriteGate                             | gm_restaurants, restaurant_setup_status                                                                          |
| Cardápio (Menu Builder) | /menu-builder             | ProductReader, RestaurantReader               | MenuWriter                                             | gm_products, gm_menu_categories                                                                                  |
| Publicar restaurante    | /app/publish              | RuntimeReader, useMenuState                   | RuntimeWriter, DbWriteGate                             | gm_restaurants (status), restaurant_setup_status                                                                 |
| Instalar Terminais      | /app/install              | —                                             | TerminalEngine (upsert)                                | gm_terminals                                                                                                     |
| TPV (Caixa)             | /op/tpv                   | OrderReader, ProductReader, ShiftReader       | OrderWriter (create_order_atomic, update_order_status) | gm_orders, gm_order_items, RPC create_order_atomic, update_order_status                                          |
| KDS (Cozinha)           | /op/kds                   | OrderReader, OrderReaderDirect                | OrderWriter (update_order_status, mark_item_ready)     | gm_orders, gm_order_items, RPC update_order_status, mark_item_ready                                              |
| Alertas                 | /alerts                   | alertEngine, OrderReader                      | —                                                      | gm_orders, event_store (conforme contrato)                                                                       |
| Saúde                   | /health                   | useCoreHealth                                 | —                                                      | Health endpoint (useCoreHealth)                                                                                  |
| AppStaff                | /garcom                   | TaskReader, OrderReader, PulseReader          | TaskWriter (create_task, assign_task, etc.)            | gm_tasks, gm_orders, gm_restaurant_members, RPC create_task, assign_task, start_task, complete_task, reject_task |
| Pessoas                 | /people, /config/people   | RestaurantPeopleReader (gm_restaurant_people) | —                                                      | gm_restaurant_members, gm_staff (quando consumido)                                                               |
| Tarefas                 | /tasks                    | TaskReader                                    | TaskWriter                                             | gm_tasks                                                                                                         |
| Presença Online         | /public/:slug             | RestaurantReader, ProductReader               | —                                                      | gm_restaurants, gm_products                                                                                      |
| Financeiro              | /financial                | ShiftReader, OrderReader (métricas)           | —                                                      | gm_cash_registers, gm_payments, gm_orders, RPC get_operational_metrics, get_shift_history                        |
| Faturação (Billing)     | /app/billing              | coreBillingApi, RuntimeReader                 | —                                                      | gm_restaurants (billing_status, onboarding_completed_at)                                                         |
| Percepção Operacional   | /config/perception        | —                                             | —                                                      | (métricas / câmera conforme contrato)                                                                            |
| Estoque / Inventário    | /inventory-stock          | InventoryStockReader                          | StockWriter                                            | gm_locations, gm_equipment, gm_ingredients, gm_stock_levels, gm_product_bom                                      |
| Caixa / Turno           | /op/cash, contexto TPV    | ShiftReader                                   | open_cash_register_atomic, close_cash_register_atomic  | gm_cash_registers, RPC open_cash_register_atomic, close_cash_register_atomic                                     |

---

_Catálogo mínimo. Expandir conforme novas features e readers/writers._
