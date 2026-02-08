# Classificação de tabelas (DB) — CORE | OPERATIONAL | LEGACY

**Propósito:** Matriz tabela → CORE | OPERATIONAL | LEGACY / CANDIDATE_FOR_DROP. Usado no refactor pós-freeze para decidir drops com log.

**Contexto:** [refactor_estrutural_pós-freeze](../plans/LISTA_CORTES_FASE_1.md); [OPERATIONAL_KERNEL_CONTRACT](../contracts/OPERATIONAL_KERNEL_CONTRACT.md).

---

## CORE (manter — fonte de verdade operacional)

| Tabela | Migração / origem | Notas |
|--------|--------------------|--------|
| gm_restaurants | core_schema | Identidade restaurante; FlowGate, ORE. |
| gm_orders | core_schema | Pedidos; OrderReader, OrderWriter. |
| gm_order_items | core_schema | Itens de pedido; KDS, TPV. |
| gm_products | core_schema | Produtos; ProductReader, Menu. |
| gm_menu_categories | core_schema | Categorias do menu. |
| gm_tables | core_schema | Mesas. |
| gm_tasks | 03-migrations / create_task_engine | Tarefas; TaskReader. |
| gm_cash_registers | core_payments | Caixa; turno, pagamentos. |
| gm_payments | core_payments | Pagamentos. |
| gm_payment_audit_logs | core_payments | Auditoria pagamentos. |
| gm_terminals | 03-migrations / gm_terminals | Terminais; TERMINAL_INSTALLATION_RITUAL. |
| gm_staff | gm_staff | Equipa; People/Identity. |
| gm_restaurant_members | 04-modules / patch | Membros restaurante; auth. |
| billing_configs | billing_configs | Config faturação. |
| event_store | event_store | Eventos; EventMonitor, legal seals. |
| legal_seals | legal_seals | Selos legais. |
| gm_locations | create_inventory_stock / 04 | Localizações stock. |
| gm_equipment | create_inventory_stock / 04 | Equipamento. |
| gm_ingredients | create_inventory_stock | Ingredientes. |
| gm_stock_levels | create_inventory_stock | Níveis de stock. |
| gm_product_bom | create_inventory_stock | BOM produto. |
| gm_stock_ledger | create_inventory_stock | Ledger stock. |
| installed_modules | modules_registry / 04 | Módulos instalados. |
| module_permissions | modules_registry / 04 | Permissões por módulo. |

---

## OPERATIONAL (manter — domínio activo com contrato)

| Tabela | Migração | Notas |
|--------|----------|--------|
| gm_operation_versions | create_operation_versions | Versões de operação. |
| gm_restaurant_zones | create_restaurant_map | Zonas restaurante. |
| gm_restaurant_tables | create_restaurant_map | Mesas (mapa). |
| gm_task_packs | create_task_packs | Packs de tarefas. |
| gm_task_templates | create_task_packs | Templates de tarefas. |
| gm_restaurant_packs | create_task_packs | Packs por restaurante. |
| recurring_tasks | task_system | Tarefas recorrentes. |
| tasks | task_system | Tarefas (sistema). |
| task_history | task_system | Histórico tarefas. |
| task_rules | task_system | Regras de tarefas. |

---

## LEGACY em uso (não dropadas — migrar antes de DROP)

Tabelas ainda referenciadas no código (TOUCHED por `scripts/verify-db-runtime-touch.sh`). Não fazer DROP até migrar o runtime para outra fonte de verdade.

| Tabela(s) | Onde é usada | Nota |
|-----------|--------------|------|
| restaurant_schedules | ScheduleSection.tsx | Onboarding. |
| restaurant_setup_status | RuntimeReader.ts, RuntimeWriter.ts | Runtime setup. |
| restaurant_zones | LocationSection.tsx | Onboarding. |
| shift_comparisons | ShiftComparisonEngine.ts | People. |
| performance_correlations | PerformanceCorrelationEngine.ts | People. |
| cash_flow, product_margins, waste_and_losses | FinancialEngine.ts | Financeiro. |
| alerts | SystemHealthCard.tsx | Dashboard. |

---

## Removidas (DROP com log)

Tabelas dropadas pela migration `20260203_drop_legacy_untouched.sql` (2026-02-03). Verificação: `scripts/verify-db-runtime-touch.sh` (NOT_TOUCHED).

| Tabela(s) | Migração origem | Data DROP |
|-----------|-----------------|-----------|
| saas_tenants | core_schema | 2026-02-03 |
| mentor_suggestions, mentor_recommendations, mentor_interactions, mentor_config | mentoria_ia | 2026-02-03 |
| restaurant_groups, restaurant_group_members, configuration_inheritance, configuration_overrides, unit_benchmarks, unit_comparisons | multi_unit_system | 2026-02-03 |
| employee_profiles, time_entries, behavioral_history | people_time_system | 2026-02-03 |
| reservations, no_show_history, overbooking_config, reservation_inventory_impact | reservations_system | 2026-02-03 |
| suppliers, purchase_orders, purchase_order_items, purchase_suggestions, purchase_receipts, dish_costs, financial_forecasts | compras_financeiro | 2026-02-03 |
| alert_history, operational_health, human_health, financial_health, restaurant_health_score | alert_health_system | 2026-02-03 |

---

## Processo

1. **Antes de DROP:** Executar `scripts/verify-db-runtime-touch.sh`; só dropar tabelas NOT_TOUCHED.
2. **Backup:** Fazer backup lógico das tabelas alvo (ver docker-core/README.md secção Backup e rollback).
3. **DROP:** Aplicar migration em docker-core/schema/migrations/ (ex.: 20260203_drop_legacy_untouched.sql) em local/staging primeiro.
4. **Após DROP:** Este doc já tem secções "Removidas" e "LEGACY em uso"; actualizar data se aplicar nova migration de DROP.

---

## Carimbo — DROP aplicado em LOCAL

- **Data:** 2026-02-04  
- **Commit (opcional):** `d83834f023cc427d54aba3216be2435c84404b5d`  
- **Ritual:** backup → DROP (20260203_drop_legacy_untouched.sql) → reset stack (down/up sem -v) → testes CI (npm run test, 105 passed) → smoke operacional (manual: dashboard, install, TPV, KDS, orders, turno).  
- **Backup:** `docker-core/backups/core_full_20260204_013106.sql`
- **Plano consolidado:** [docs/plans/POS_DROP_LEGACY_LOCAL.md](../plans/POS_DROP_LEGACY_LOCAL.md) (ritual, smoke, próximos caminhos).

---

Última actualização: DROP aplicado em LOCAL (2026-02-04); carimbo ritual; Removidas e LEGACY em uso.
