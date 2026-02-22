#!/usr/bin/env bash
# DAY 4: Test webhook flow (manual) — SumUp inbound
# Usage: GATEWAY_URL=http://localhost:4320 bash scripts/test-webhook-flow.sh
# Optional: CORE_URL, psql to verify webhook_events table
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
ORDER_REF="${1:-00000000-0000-0000-0000-000000000001}"
PAYMENT_ID="test-manual-$(date +%s)"

echo "=========================================="
echo "DAY 4: Webhook flow test (SumUp inbound)"
echo "=========================================="
echo "Gateway: $GATEWAY_URL"
echo "paymentId: $PAYMENT_ID"
echo "orderRef: $ORDER_REF"
echo ""

echo -n "POST /api/v1/webhook/sumup... "
RESP=$(curl -s -X POST "${GATEWAY_URL}/api/v1/webhook/sumup" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId":"'"$PAYMENT_ID"'",
    "status":"COMPLETED",
    "amount":1500,
    "orderRef":"'"$ORDER_REF"'",
    "currency":"EUR"
  }')
RECEIVED=$(echo "$RESP" | jq -r '.received // .success // empty')
if [[ "$RECEIVED" == "true" ]]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "$RESP" | jq .
  exit 1
fi

echo ""
echo "Response: $RESP"
echo ""
echo "To verify in DB (if Core/psql available):"
echo "  SELECT id, provider, event_type, event_id, status, received_at FROM webhook_events WHERE event_id = '$PAYMENT_ID';"
echo ""
echo -e "${GREEN}Webhook flow test done.${NC}"
