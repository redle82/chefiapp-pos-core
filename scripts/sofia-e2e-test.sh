#!/usr/bin/env bash
set -euo pipefail

# ================================
# CHEFIAPP — SOFIA E2E SMOKE TEST
# ================================
# Assumptions:
# - Server already running (npm run -s server:web-module)
# - Env vars exported by scripts/sofia-e2e.sh (recommended)

if [[ -f .env.sofia ]]; then
  # shellcheck disable=SC1091
  source .env.sofia
fi

: "${WEB_MODULE_PORT:=4320}"
: "${INTERNAL_API_TOKEN:=dev-token}"

if [[ -z "${WEB_MODULE_RESTAURANT_ID:-}" ]]; then
  echo "WEB_MODULE_RESTAURANT_ID is required (run scripts/sofia-e2e.sh first)." >&2
  exit 1
fi

if [[ -z "${WEB_MODULE_SLUG:-}" ]]; then
  echo "WEB_MODULE_SLUG is required (run scripts/sofia-e2e.sh first)." >&2
  exit 1
fi

if [[ -z "${MENU_ITEM_ID:-}" ]]; then
  echo "MENU_ITEM_ID is required (export MENU_ITEM_ID from seed output)." >&2
  exit 1
fi

BASE_URL="http://localhost:${WEB_MODULE_PORT}"

echo "== Smoke Test =="
echo "BASE_URL=${BASE_URL}"
echo "RESTAURANT_ID=${WEB_MODULE_RESTAURANT_ID}"
echo "SLUG=${WEB_MODULE_SLUG}"
echo "MENU_ITEM_ID=${MENU_ITEM_ID}"

# 1) Wizard state
echo
echo "[1/3] GET wizard state"
STATE_JSON="$(curl -fsS "${BASE_URL}/internal/wizard/${WEB_MODULE_RESTAURANT_ID}/state" -H "X-Internal-Token: ${INTERNAL_API_TOKEN}")"
echo "$STATE_JSON" | python3 -m json.tool >/dev/null 2>&1 || true

echo "$STATE_JSON" | head -c 4000

# 2) Public page (HTML)
echo
echo "[2/3] GET public page"
curl -fsS -o /dev/null "${BASE_URL}/public/${WEB_MODULE_SLUG}"
echo "OK: /public/${WEB_MODULE_SLUG}"

# 3) Create order
# NOTE: This requires Stripe merchant credentials configured.
echo
echo "[3/3] POST create order"
ORDER_JSON="$(curl -sS -X POST "${BASE_URL}/public/${WEB_MODULE_SLUG}/orders" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"menu_item_id\":\"${MENU_ITEM_ID}\",\"qty\":1}],\"pickup_type\":\"TAKEAWAY\"}")"

# Basic success heuristics without jq
if echo "$ORDER_JSON" | grep -q '"order_id"' && echo "$ORDER_JSON" | grep -q '"payment_intent"'; then
  echo "$ORDER_JSON" | head -c 4000
  echo
  echo "OK: order created"
  exit 0
fi

if echo "$ORDER_JSON" | grep -q 'GATEWAY_NOT_CONFIGURED'; then
  echo "$ORDER_JSON" | head -c 4000
  echo
  echo "NO-GO (expected if Stripe not connected): GATEWAY_NOT_CONFIGURED" >&2
  exit 2
fi

echo "$ORDER_JSON" | head -c 4000

echo
echo "NO-GO: unexpected response from /orders" >&2
exit 3
