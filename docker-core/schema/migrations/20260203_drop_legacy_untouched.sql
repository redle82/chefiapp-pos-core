-- DROP físico LEGACY (Opção A) — tabelas NOT_TOUCHED pelo runtime
--
-- Lista: 30 tabelas classificadas como NOT_TOUCHED por scripts/verify-db-runtime-touch.sh.
-- Referência: docs/ops/DB_TABLE_CLASSIFICATION.md; plano DROP físico LEGACY (Opção A).
-- Data: 2026-02-03
--
-- Antes de executar: fazer backup lógico (pg_dump) das tabelas alvo.
-- Rollback: re-aplicar as migrations originais que criaram estas tabelas, ou restaurar do backup.
-- Ver: docker-core/README.md secção Backup e rollback.

-- mentoria_ia
DROP TABLE IF EXISTS mentor_suggestions CASCADE;
DROP TABLE IF EXISTS mentor_recommendations CASCADE;
DROP TABLE IF EXISTS mentor_interactions CASCADE;
DROP TABLE IF EXISTS mentor_config CASCADE;

-- core_schema (multi-tenant antigo)
DROP TABLE IF EXISTS saas_tenants CASCADE;

-- multi_unit_system
DROP TABLE IF EXISTS restaurant_groups CASCADE;
DROP TABLE IF EXISTS restaurant_group_members CASCADE;
DROP TABLE IF EXISTS configuration_inheritance CASCADE;
DROP TABLE IF EXISTS configuration_overrides CASCADE;
DROP TABLE IF EXISTS unit_benchmarks CASCADE;
DROP TABLE IF EXISTS unit_comparisons CASCADE;

-- people_time_system
DROP TABLE IF EXISTS employee_profiles CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS behavioral_history CASCADE;

-- reservations_system
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS no_show_history CASCADE;
DROP TABLE IF EXISTS overbooking_config CASCADE;
DROP TABLE IF EXISTS reservation_inventory_impact CASCADE;

-- compras_financeiro (apenas tabelas NOT_TOUCHED; cash_flow, product_margins, waste_and_losses ficam)
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_suggestions CASCADE;
DROP TABLE IF EXISTS purchase_receipts CASCADE;
DROP TABLE IF EXISTS dish_costs CASCADE;
DROP TABLE IF EXISTS financial_forecasts CASCADE;

-- alert_health_system (apenas tabelas NOT_TOUCHED; alerts fica)
DROP TABLE IF EXISTS alert_history CASCADE;
DROP TABLE IF EXISTS operational_health CASCADE;
DROP TABLE IF EXISTS human_health CASCADE;
DROP TABLE IF EXISTS financial_health CASCADE;
DROP TABLE IF EXISTS restaurant_health_score CASCADE;
