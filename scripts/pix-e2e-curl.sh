#!/usr/bin/env bash
# =============================================================================
# PIX E2E — Checkout API + status (curl)
# Requer: gateway a correr em GATEWAY_URL (default 4320), INTERNAL_API_TOKEN.
# Uso: ./scripts/pix-e2e-curl.sh
# =============================================================================
set -e

GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
TOKEN="${INTERNAL_API_TOKEN:-chefiapp-internal-token-dev}"
ORDER_ID="order_pix_e2e_$(date +%s)"
RESTAURANT_ID="${PIX_TEST_RESTAURANT_ID:-rest_e2e_001}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "PIX E2E (curl) — Gateway: $GATEWAY_URL"

# 1. Health
if ! curl -sf "$GATEWAY_URL/health" > /dev/null; then
  echo -e "${RED}FAIL: Gateway not reachable at $GATEWAY_URL${NC}"
  exit 1
fi
echo -e "${GREEN}[1/3] Gateway health OK${NC}"

# 2. POST PIX checkout
RESP=$(curl -sf -X POST "$GATEWAY_URL/api/v1/payment/pix/checkout" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: $TOKEN" \
  -d "{
    \"order_id\": \"$ORDER_ID\",
    \"amount\": 10.50,
    \"currency\": \"BRL\",
    \"restaurant_id\": \"$RESTAURANT_ID\",
    \"description\": \"PIX E2E script\"
  }" 2>/dev/null) || true

if [ -z "$RESP" ]; then
  echo -e "${RED}[2/3] FAIL: PIX checkout request failed (no response or 4xx/5xx)${NC}"
  exit 1
fi

CHECKOUT_ID=$(echo "$RESP" | jq -r '.checkout_id // .checkout_id // empty')
if [ -z "$CHECKOUT_ID" ]; then
  echo -e "${YELLOW}[2/3] Response (check for 503 if SumUp not configured):${NC}"
  echo "$RESP" | jq . 2>/dev/null || echo "$RESP"
  echo -e "${RED}PIX checkout did not return checkout_id (gateway may be in mock or SumUp not set)${NC}"
  exit 1
fi
echo -e "${GREEN}[2/3] PIX checkout created: $CHECKOUT_ID${NC}"

# 3. GET status
STATUS_RESP=$(curl -sf -X GET "$GATEWAY_URL/api/v1/payment/sumup/checkout/$CHECKOUT_ID" \
  -H "X-Internal-Token: $TOKEN" 2>/dev/null) || true
if [ -n "$STATUS_RESP" ]; then
  echo -e "${GREEN}[3/3] Status response OK${NC}"
  echo "$STATUS_RESP" | jq . 2>/dev/null || echo "$STATUS_RESP"
else
  echo -e "${YELLOW}[3/3] Status request failed or empty (non-fatal)${NC}"
fi

echo -e "${GREEN}PIX E2E (curl) passed.${NC}"
