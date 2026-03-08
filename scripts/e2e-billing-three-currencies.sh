#!/usr/bin/env bash
# =============================================================================
# E2E Billing — Validação repetível nas 3 moedas (BRL / EUR / USD)
# Requer: gateway em 4320 (ou GATEWAY_URL), STRIPE_SECRET_KEY e STRIPE_PRICE_PRO_*
#   (STRIPE_PRICE_PRO_EUR, STRIPE_PRICE_PRO_USD, STRIPE_PRICE_PRO_BRL).
# Uso: ./scripts/e2e-billing-three-currencies.sh
# Ref: docs/BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md §7
# =============================================================================
set -e

GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
TOKEN="${INTERNAL_API_TOKEN:-chefiapp-internal-token-dev}"
SUCCESS_URL="${SUCCESS_URL:-http://localhost:5175/billing/success}"
CANCEL_URL="${CANCEL_URL:-http://localhost:5175/app/billing}"
ORIGIN="${ORIGIN:-http://localhost:5175}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FAIL=0

echo -e "${BLUE}====== E2E Billing — 3 moedas (EUR / USD / BRL) ======${NC}"
echo "Gateway: $GATEWAY_URL"
echo ""

# Check gateway health first
if ! curl -sf "$GATEWAY_URL/health" | jq -e '.status == "ok"' > /dev/null 2>&1; then
  echo -e "${RED}Gateway not reachable or health check failed. Start with: pnpm run dev:gateway${NC}"
  exit 1
fi

# restaurant_id is required for subscription checkout (metadata for webhook sync)
RESTAURANT_ID="${RESTAURANT_ID:-00000000-0000-0000-0000-000000000100}"

for CURRENCY in EUR USD BRL; do
  case "$CURRENCY" in
    EUR) price_id="pro_eur" ;;
    USD) price_id="pro_usd" ;;
    BRL) price_id="pro_brl" ;;
    *) echo -e "${RED}Unknown currency: $CURRENCY${NC}"; exit 1 ;;
  esac

  echo -e "${YELLOW}[$CURRENCY] create-checkout-session (price_id=$price_id)${NC}"
  resp=$(curl -s -w "\n%{http_code}" -X POST "$GATEWAY_URL/internal/billing/create-checkout-session" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Token: $TOKEN" \
    -H "Origin: $ORIGIN" \
    -d "{\"price_id\":\"$price_id\",\"success_url\":\"$SUCCESS_URL\",\"cancel_url\":\"$CANCEL_URL\",\"restaurant_id\":\"$RESTAURANT_ID\"}" 2>/dev/null) || true

  code=$(echo "$resp" | tail -n1)
  body=$(echo "$resp" | sed '$d')

  if [ "$code" = "200" ] && echo "$body" | jq -e '.url or .session_id' > /dev/null 2>&1; then
    echo -e "${GREEN}  OK (HTTP 200, url or session_id)${NC}"
  else
    echo -e "${RED}  FAIL (HTTP $code)${NC}"
    if [ -n "$body" ] && echo "$body" | jq -e . > /dev/null 2>&1; then
      echo "  Response: $(echo "$body" | jq -c .)"
    else
      echo "  Response: $body"
    fi
    ((FAIL++)) || true
  fi
done

echo ""
echo -e "${BLUE}====== Result ======${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}All 3 currencies passed (EUR, USD, BRL).${NC}"
  exit 0
else
  echo -e "${RED}$FAIL currency/currencies failed. Set STRIPE_PRICE_PRO_EUR, STRIPE_PRICE_PRO_USD, STRIPE_PRICE_PRO_BRL and STRIPE_SECRET_KEY.${NC}"
  exit 1
fi
