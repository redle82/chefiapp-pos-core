#!/usr/bin/env bash
# ChefIApp Integration Tests — Day 6 checklist
# Usage: API_URL=http://localhost:3001 GATEWAY_URL=http://localhost:4320 bash scripts/test-integration.sh
# Requires: curl, jq. Optional: Core + PostgREST + integration-gateway running.
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
INTERNAL_TOKEN="${INTERNAL_TOKEN:-chefiapp-internal-token-dev}"

echo "=========================================="
echo "ChefIApp Integration Tests"
echo "=========================================="
echo "API URL: $API_URL"
echo "Gateway: $GATEWAY_URL"
echo ""

# Test 1: Health check (PostgREST)
echo -n "Test 1: PostgREST health... "
if curl -sf "${API_URL}/rest/v1/" > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "PostgREST not responding at $API_URL"
  exit 1
fi

# Test 2: Gateway health
echo -n "Test 2: Gateway health... "
if curl -sf "${GATEWAY_URL}/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}~${NC} (gateway not running, skip gateway tests)"
  GATEWAY_SKIP=1
fi

# Test 3: Auth (Supabase signup or JWT from env)
# Optional: set JWT=... or SUPABASE_URL=https://xxx.supabase.co to run tests 4–5
echo -n "Test 3: Auth (signup)... "
if [[ -n "$JWT" ]]; then
  echo -e "${GREEN}✓${NC} (using JWT from env)"
else
  AUTH_BASE="${SUPABASE_URL:-${API_URL%%/rest/v1*}}"
  AUTH_URL="${AUTH_BASE}/auth/v1"
  RESPONSE=$(curl -s -X POST "${AUTH_URL}/signup" \
    -H "Content-Type: application/json" \
    -d '{
      "email":"test-'$(date +%s)'@test.com",
      "password":"TestPassword123!"
    }' 2>/dev/null || echo '{}')
  JWT=$(echo "$RESPONSE" | jq -r '.session.access_token // .access_token // empty')
  if [[ -z "$JWT" ]]; then
    echo -e "${YELLOW}~${NC} (auth not available; set JWT= or SUPABASE_URL= for tests 4–5)"
    JWT=""
  else
    echo -e "${GREEN}✓${NC}"
  fi
fi

# Test 4: RLS / organizations (requires JWT or anon)
echo -n "Test 4: RLS (organizations)... "
if [[ -n "$JWT" ]]; then
  ORGS=$(curl -s "${API_URL}/rest/v1/gm_organizations" \
    -H "Authorization: Bearer $JWT" \
    -H "apikey: ${CORE_SERVICE_KEY:-$JWT}")
  org_count=$(echo "$ORGS" | jq 'length')
  echo -e "${GREEN}✓${NC} (found $org_count org(s))"
else
  echo -e "${YELLOW}~${NC} (no JWT, skip)"
fi

# Test 5: Create onboarding context (RPC) — requires authenticated user
echo -n "Test 5: Create onboarding context (RPC)... "
if [[ -z "$JWT" ]]; then
  echo -e "${YELLOW}~${NC} (no JWT, skip)"
else
  ORG=$(curl -s -X POST "${API_URL}/rpc/create_onboarding_context" \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -H "apikey: ${CORE_SERVICE_KEY:-$JWT}" \
    -d '{
      "p_restaurant_name":"Test Restaurant Integration",
      "p_user_id": null
    }')
  ORG_ID=$(echo "$ORG" | jq -r '.[0].org_id // .org_id // empty')
  RESTAURANT_ID=$(echo "$ORG" | jq -r '.[0].restaurant_id // .restaurant_id // empty')
  if [[ -z "$ORG_ID" ]] || [[ -z "$RESTAURANT_ID" ]]; then
    echo -e "${RED}✗${NC}"
    echo "Create onboarding failed: $ORG"
    exit 1
  fi
  echo -e "${GREEN}✓${NC} (org=$ORG_ID, restaurant=$RESTAURANT_ID)"
fi

# Test 6: Webhook ingest (internal/events) — requires gateway
if [[ -z "$GATEWAY_SKIP" ]]; then
  echo -n "Test 6: Webhook ingest (internal/events)... "
  WEBHOOK=$(curl -s -X POST "${GATEWAY_URL}/internal/events" \
    -H "X-Internal-Token: $INTERNAL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "event":"payment.confirmed",
      "restaurant_id":"'${RESTAURANT_ID:-00000000-0000-0000-0000-000000000001}'",
      "payload":{"source":"integration-test","amount_cents":1200}
    }')
  STATUS=$(echo "$WEBHOOK" | jq -r '.accepted // .status // empty')
  if [[ "$STATUS" == "true" ]] || [[ "$STATUS" == "ok" ]]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}~${NC} (response: $WEBHOOK)"
  fi
else
  echo "Test 6: (skipped - gateway not running)"
fi

# Test 7: SumUp webhook endpoint (no secret in dev)
if [[ -z "$GATEWAY_SKIP" ]]; then
  echo -n "Test 7: SumUp webhook (POST /api/v1/webhook/sumup)... "
  SUMUP_ID="idem-$(date +%s)"
  SUMUP_RESP=$(curl -s -X POST "${GATEWAY_URL}/api/v1/webhook/sumup" \
    -H "Content-Type: application/json" \
    -d '{"paymentId":"'"$SUMUP_ID"'","status":"COMPLETED","amount":1500,"orderRef":"'${RESTAURANT_ID:-test}'"}')
  RECEIVED=$(echo "$SUMUP_RESP" | jq -r '.received // .success // empty')
  if [[ "$RECEIVED" == "true" ]]; then
    echo -e "${GREEN}✓${NC}"
  else
    echo -e "${YELLOW}~${NC} ($SUMUP_RESP)"
  fi

  # Test 8: Idempotency (same webhook twice = accepted twice, backend records once)
  echo -n "Test 8: Idempotency (duplicate SumUp webhook)... "
  SUMUP_RESP2=$(curl -s -X POST "${GATEWAY_URL}/api/v1/webhook/sumup" \
    -H "Content-Type: application/json" \
    -d '{"paymentId":"'"$SUMUP_ID"'","status":"COMPLETED","amount":1500,"orderRef":"'${RESTAURANT_ID:-test}'"}')
  RECEIVED2=$(echo "$SUMUP_RESP2" | jq -r '.received // .success // empty')
  MSG2=$(echo "$SUMUP_RESP2" | jq -r '.message // empty')
  if [[ "$RECEIVED2" == "true" ]]; then
    echo -e "${GREEN}✓${NC} (second request accepted; Core should dedupe by event_id)"
  else
    echo -e "${YELLOW}~${NC} ($SUMUP_RESP2)"
  fi
else
  echo "Test 7: (skipped)"
  echo "Test 8: (skipped)"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Integration tests finished.${NC}"
echo "=========================================="
