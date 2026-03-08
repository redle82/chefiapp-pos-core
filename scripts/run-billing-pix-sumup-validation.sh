#!/usr/bin/env bash
# =============================================================================
# Billing + PIX + SumUp — Validação unificada (gateway, APIs, checklist)
# Requer: gateway em 4320 (ou GATEWAY_URL). Portal opcional em 5175.
# Uso: ./scripts/run-billing-pix-sumup-validation.sh
# =============================================================================
set -e

GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
PORTAL_URL="${PORTAL_URL:-http://localhost:5175}"
TOKEN="${INTERNAL_API_TOKEN:-chefiapp-internal-token-dev}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FAIL=0

echo -e "${BLUE}====== Billing + PIX + SumUp validation ======${NC}"
echo "Gateway: $GATEWAY_URL | Portal: $PORTAL_URL"
echo ""

# --- 1. Gateway health ---
echo -e "${YELLOW}[1/6] Gateway health${NC}"
if curl -sf "$GATEWAY_URL/health" | jq -e '.status == "ok"' > /dev/null 2>&1; then
  echo -e "${GREEN}  OK${NC}"
else
  echo -e "${RED}  FAIL${NC}"
  ((FAIL++)) || true
fi

# --- 2. Billing create-checkout-session (mock or Stripe) ---
# restaurant_id is required for subscription checkout (metadata for webhook sync)
RESTAURANT_ID="${RESTAURANT_ID:-00000000-0000-0000-0000-000000000100}"
echo -e "${YELLOW}[2/6] Billing create-checkout-session${NC}"
BILLING_RESP=$(curl -sf -X POST "$GATEWAY_URL/internal/billing/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: $TOKEN" \
  -H "Origin: http://localhost:5175" \
  -d "{\"price_id\":\"price_dev_pro\",\"success_url\":\"http://localhost:5175/billing/success\",\"cancel_url\":\"http://localhost:5175/app/billing\",\"restaurant_id\":\"$RESTAURANT_ID\"}" 2>/dev/null) || true
if echo "$BILLING_RESP" | jq -e '.url or .session_id' > /dev/null 2>&1; then
  echo -e "${GREEN}  OK (session or mock url)${NC}"
elif echo "$BILLING_RESP" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${YELLOW}  Response: $(echo "$BILLING_RESP" | jq -c .)${NC}"
  echo -e "${GREEN}  Endpoint reachable${NC}"
else
  echo -e "${RED}  FAIL or unreachable${NC}"
  ((FAIL++)) || true
fi

# --- 3. PIX checkout ---
echo -e "${YELLOW}[3/6] PIX checkout${NC}"
PIX_BODY=$(curl -s -X POST "$GATEWAY_URL/api/v1/payment/pix/checkout" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: $TOKEN" \
  -d '{"order_id":"val_order_1","amount":5,"currency":"BRL","restaurant_id":"r1","description":"Validation"}' 2>/dev/null) || true
if echo "$PIX_BODY" | jq -e '.checkout_id' > /dev/null 2>&1; then
  echo -e "${GREEN}  OK${NC}"
elif echo "$PIX_BODY" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${YELLOW}  $(echo "$PIX_BODY" | jq -r '.error // .message // "error"') (e.g. SumUp not configured)${NC}"
  echo -e "${GREEN}  Endpoint reachable${NC}"
else
  echo -e "${RED}  FAIL or unreachable${NC}"
  ((FAIL++)) || true
fi

# --- 4. SumUp checkout (POST) ---
echo -e "${YELLOW}[4/6] SumUp checkout POST${NC}"
SUMUP_BODY=$(curl -s -X POST "$GATEWAY_URL/api/v1/sumup/checkout" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: $TOKEN" \
  -d '{"orderId":"val_o1","restaurantId":"r1","amount":10}' 2>/dev/null) || true
if echo "$SUMUP_BODY" | jq -e '.checkout.id or .success' > /dev/null 2>&1; then
  echo -e "${GREEN}  OK${NC}"
elif echo "$SUMUP_BODY" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${YELLOW}  $(echo "$SUMUP_BODY" | jq -r '.error // .message') (e.g. SumUp not configured)${NC}"
  echo -e "${GREEN}  Endpoint reachable${NC}"
else
  echo -e "${RED}  FAIL or unreachable${NC}"
  ((FAIL++)) || true
fi

# --- 5. Portal (optional) ---
echo -e "${YELLOW}[5/6] Portal (optional)${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PORTAL_URL/" 2>/dev/null) || true
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}  OK (HTTP 200)${NC}"
else
  echo -e "${YELLOW}  Skip or not running (HTTP $STATUS)${NC}"
fi

# --- 6. Checklist reminder ---
echo -e "${YELLOW}[6/6] Billing stress test (manual)${NC}"
echo "  Run scenarios from: docs/ops/BILLING_STRESS_TEST_CHECKLIST.md"
echo "  (Trial→Active, Past_due, Canceled, hardening)"
echo ""

echo -e "${BLUE}====== Result ======${NC}"
if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}All automated checks passed.${NC}"
  exit 0
else
  echo -e "${RED}$FAIL check(s) failed.${NC}"
  exit 1
fi
