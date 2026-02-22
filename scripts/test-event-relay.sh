#!/usr/bin/env bash
# DAY 5: Test event relay (webhooks OUT)
# Usage:
#   INTERNAL_TOKEN=... CORE_SERVICE_KEY=... JWT=... RESTAURANT_ID=... bash scripts/test-event-relay.sh
# Or with defaults (local dev): bash scripts/test-event-relay.sh
# 1. Inserts webhook_out_config (via PostgREST with service key or JWT)
# 2. POST /internal/events to gateway
# 3. Optionally checks webhook_out_delivery_log (requires DB access)
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
CORE_URL="${CORE_URL:-http://localhost:3001}"
INTERNAL_TOKEN="${INTERNAL_TOKEN:-chefiapp-internal-token-dev}"
# Use service key or JWT for inserting config
CORE_SERVICE_KEY="${CORE_SERVICE_KEY:-}"
JWT="${JWT:-$CORE_SERVICE_KEY}"
RESTAURANT_ID="${RESTAURANT_ID:-}"
WEBHOOK_URL="${WEBHOOK_URL:-https://webhook.site/unique-id-or-requestbin}"

if [[ -z "$RESTAURANT_ID" ]]; then
  echo -e "${YELLOW}RESTAURANT_ID not set. Will only test POST /internal/events (relay will fail if no config).${NC}"
fi

echo "=========================================="
echo "DAY 5: Event relay test (webhooks OUT)"
echo "=========================================="
echo "Gateway: $GATEWAY_URL"
echo "Core: $CORE_URL"
echo ""

# Step 1: Insert webhook_out_config if we have a key and restaurant
if [[ -n "$JWT" ]] && [[ -n "$RESTAURANT_ID" ]]; then
  echo -n "Insert webhook_out_config... "
  INSERT=$(curl -s -X POST "${CORE_URL}/rest/v1/webhook_out_config" \
    -H "Authorization: Bearer $JWT" \
    -H "apikey: $JWT" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d '{
      "restaurant_id":"'"$RESTAURANT_ID"'",
      "url":"'"$WEBHOOK_URL"'",
      "secret":"test-hmac-secret",
      "events":["order.created","payment.confirmed"],
      "enabled":true
    }')
  if echo "$INSERT" | jq -e '.[0].id' >/dev/null 2>&1 || echo "$INSERT" | jq -e '.id' >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}~${NC} (may already exist or RLS) $INSERT"
  fi
else
  echo "Skipping webhook_out_config insert (no JWT or RESTAURANT_ID)."
fi

# Step 2: POST /internal/events
RID="${RESTAURANT_ID:-00000000-0000-0000-0000-000000000001}"
echo -n "POST /internal/events... "
EVENT_RESP=$(curl -s -X POST "${GATEWAY_URL}/internal/events" \
  -H "X-Internal-Token: $INTERNAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event":"payment.confirmed",
    "restaurant_id":"'"$RID"'",
    "payload":{"orderId":"relay-test-'$(date +%s)'","amount_cents":999}
  }')
ACCEPTED=$(echo "$EVENT_RESP" | jq -r '.accepted // empty')
if [[ "$ACCEPTED" == "true" ]]; then
  echo -e "${GREEN}✓${NC}"
  echo "  $EVENT_RESP"
else
  echo -e "${YELLOW}~${NC}"
  echo "  $EVENT_RESP"
fi

echo ""
echo "To verify delivery log (DB):"
echo "  SELECT event, url, status_code, attempted_at FROM webhook_out_delivery_log WHERE restaurant_id = '$RID' ORDER BY attempted_at DESC LIMIT 5;"
echo ""
echo -e "${GREEN}Event relay test done.${NC}"
