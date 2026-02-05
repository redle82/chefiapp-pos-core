#!/usr/bin/env bash
# verify-db-runtime-touch.sh — Verificação DB ↔ runtime (LEGACY)
#
# Lista tabelas LEGACY de docs/ops/DB_TABLE_CLASSIFICATION.md e classifica
# TOUCHED (referenciadas no código) vs NOT_TOUCHED (seguras para DROP).
# Pesquisa em merchant-portal/src por .from("nome_tabela") ou .from('nome_tabela').
#
# Uso: ./scripts/verify-db-runtime-touch.sh [--json]
# Saída: relatório em texto; com --json emite JSON para consumo por outros scripts.
#
# Ref: docs/ops/DB_TABLE_CLASSIFICATION.md; plano DROP físico LEGACY (Opção A).

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEARCH_DIR="${ROOT}/merchant-portal/src"
REPORT_TOUCHED=()
REPORT_NOT_TOUCHED=()
JSON=false
[[ "${1:-}" == "--json" ]] && JSON=true

# Lista canónica de tabelas LEGACY (uma por linha)
LEGACY_TABLES=(
  saas_tenants
  mentor_suggestions
  mentor_recommendations
  mentor_interactions
  mentor_config
  restaurant_schedules
  restaurant_setup_status
  restaurant_zones
  restaurant_groups
  restaurant_group_members
  configuration_inheritance
  configuration_overrides
  unit_benchmarks
  unit_comparisons
  employee_profiles
  time_entries
  behavioral_history
  shift_comparisons
  performance_correlations
  reservations
  no_show_history
  overbooking_config
  reservation_inventory_impact
  suppliers
  purchase_orders
  purchase_order_items
  purchase_suggestions
  purchase_receipts
  cash_flow
  product_margins
  dish_costs
  waste_and_losses
  financial_forecasts
  alerts
  alert_history
  operational_health
  human_health
  financial_health
  restaurant_health_score
)

classify() {
  local table="$1"
  local hits
  hits=$(rg -n --no-heading "\.from\s*\(\s*[\"']${table}[\"']\s*\)" "$SEARCH_DIR" 2>/dev/null || true)
  if [[ -n "$hits" ]]; then
    REPORT_TOUCHED+=("$table")
    if [[ "$JSON" == false ]]; then
      echo "TOUCHED	$table"
      echo "$hits" | sed 's/^/  /'
    fi
  else
    REPORT_NOT_TOUCHED+=("$table")
    if [[ "$JSON" == false ]]; then
      echo "NOT_TOUCHED	$table"
    fi
  fi
}

if [[ "$JSON" == false ]]; then
  echo "=== Verify DB ↔ runtime (LEGACY tables) ==="
  echo "Search dir: $SEARCH_DIR"
  echo ""
fi

for t in "${LEGACY_TABLES[@]}"; do
  classify "$t"
done

if [[ "$JSON" == true ]]; then
  echo "{"
  echo "  \"touched\": ["
  for i in "${!REPORT_TOUCHED[@]}"; do
    [[ $i -gt 0 ]] && echo ","
    echo -n "    \"${REPORT_TOUCHED[$i]}\""
  done
  echo ""
  echo "  ],"
  echo "  \"not_touched\": ["
  for i in "${!REPORT_NOT_TOUCHED[@]}"; do
    [[ $i -gt 0 ]] && echo ","
    echo -n "    \"${REPORT_NOT_TOUCHED[$i]}\""
  done
  echo ""
  echo "  ]"
  echo "}"
  exit 0
fi

echo ""
echo "=== Summary ==="
echo "TOUCHED: ${#REPORT_TOUCHED[@]} (do not DROP without migration)"
echo "NOT_TOUCHED: ${#REPORT_NOT_TOUCHED[@]} (safe to DROP after backup)"
exit 0
