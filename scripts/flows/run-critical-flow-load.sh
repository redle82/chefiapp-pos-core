#!/usr/bin/env bash
# =============================================================================
# CHEFIAPP — Critical Flow: light load simulation (50–100 orders)
# =============================================================================
# Runs multiple order-creation attempts against Core. Pass if ≥95% succeed
# or if schema does not yet have gm_orders (SKIP). Uses same API as run-critical-flow.sh.
#
# Usage:
#   bash scripts/flows/run-critical-flow-load.sh
#   CRITICAL_FLOW_LOAD_COUNT=100 bash scripts/flows/run-critical-flow-load.sh
# =============================================================================
set -euo pipefail

BASE_URL="${CORE_URL:-http://localhost:3001}"
API="${BASE_URL}/rest/v1"
ANON_KEY="${CORE_ANON_KEY:-chefiapp-core-secret-key-min-32-chars-long}"
COUNT="${CRITICAL_FLOW_LOAD_COUNT:-50}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=run-critical-flow.sh
# We reuse env and helpers by sourcing (optional). Here we inline the minimal needed.

api() {
  local method="$1" path="$2" data="${3:-}"
  local args=(-sS -X "$method" -H "apikey: ${ANON_KEY}" -H "Content-Type: application/json" -H "Prefer: return=representation")
  [ -n "$data" ] && args+=(-d "$data")
  curl "${args[@]}" "${API}${path}"
}

echo "═══════════════════════════════════════════════════"
echo "  Critical Flow — Load ($COUNT orders)"
echo "═══════════════════════════════════════════════════"

HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "${API}/" 2>/dev/null) || true
if [ "$HTTP_CODE" != "200" ]; then
  echo "  ✗ Core not healthy (HTTP $HTTP_CODE). Aborting."
  exit 1
fi

RESTAURANT=$(api GET "/gm_restaurants?select=id,name&limit=1" 2>&1) || true
RESTAURANT_ID=$(echo "$RESTAURANT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$RESTAURANT_ID" ]; then
  echo "  ✗ No restaurant in seed data."
  exit 1
fi

PASS=0
FAIL=0
SKIP_ALL=false

for i in $(seq 1 "$COUNT"); do
  ORDER_ID="load-$(date +%s)-$$-$i"
  NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  PAYLOAD=$(cat <<EOF
{
  "id": "${ORDER_ID}",
  "restaurant_id": "${RESTAURANT_ID}",
  "status": "pending",
  "order_type": "dine-in",
  "table_number": "L-${i}",
  "items": [{"name": "Item ${i}", "quantity": 1, "unit_price": 1.00, "total": 1.00}],
  "subtotal": 1.00,
  "tax_amount": 0.23,
  "total_amount": 1.00,
  "created_at": "${NOW}"
}
EOF
)
  RESULT=$(api POST "/gm_orders" "$PAYLOAD" 2>&1) || true

  if echo "$RESULT" | grep -q "$ORDER_ID"; then
    PASS=$((PASS + 1))
    # Cleanup so we don't fill the DB
    api DELETE "/gm_orders?id=eq.${ORDER_ID}" "" >/dev/null 2>&1 || true
  elif echo "$RESULT" | grep -qi "relation.*does not exist\|Could not find"; then
    SKIP_ALL=true
    break
  else
    FAIL=$((FAIL + 1))
  fi
done

if [ "$SKIP_ALL" = true ]; then
  echo "  ✓ Order table not in Core schema (expected for MVP) — SKIP load."
  exit 0
fi

TOTAL=$((PASS + FAIL))
if [ "$TOTAL" -eq 0 ]; then
  echo "  ✗ No attempts completed."
  exit 1
fi
# 95% success
if [ "$PASS" -ge $((TOTAL * 95 / 100)) ]; then
  echo "  ✓ Load: $PASS/$TOTAL passed (≥95%)."
  exit 0
fi
echo "  ✗ Load: $PASS/$TOTAL passed (required ≥95%)."
exit 1
