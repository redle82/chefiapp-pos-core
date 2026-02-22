#!/usr/bin/env bash
# DAY 1: Verify local stack — PostgREST, optional Gateway, optional DB state
# Usage: API_URL=http://localhost:3001 GATEWAY_URL=http://localhost:4320 bash scripts/verify-local-stack.sh
# Success: exit 0 if Core (and optionally Gateway) respond; exit 1 otherwise.
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"

echo "=========================================="
echo "DAY 1: Verify local stack"
echo "=========================================="
echo "PostgREST/Core: $API_URL"
echo "Gateway:        $GATEWAY_URL"
echo ""

FAIL=0

# 1. PostgREST health
echo -n "PostgREST /rest/v1/... "
CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/rest/v1/" 2>/dev/null || echo "000")
if [[ "$CODE" == "200" ]] || [[ "$CODE" == "401" ]]; then
  echo -e "${GREEN}✓${NC} (HTTP $CODE)"
else
  echo -e "${RED}✗${NC} (HTTP $CODE)"
  FAIL=1
fi

# 2. Gateway health (optional)
echo -n "Gateway /health... "
GATE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${GATEWAY_URL}/health" 2>/dev/null || echo "000")
if [[ "$GATE_CODE" == "200" ]]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}~${NC} (HTTP $GATE_CODE — gateway not required for Day 1)"
fi

# 3. Optional: check that a core table is exposed (schema loaded)
echo -n "Core schema (HEAD gm_organizations)... "
HEAD_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X HEAD "${API_URL}/rest/v1/gm_organizations" -H "Accept: application/json" 2>/dev/null || echo "000")
if [[ "$HEAD_CODE" == "200" ]] || [[ "$HEAD_CODE" == "401" ]] || [[ "$HEAD_CODE" == "406" ]]; then
  echo -e "${GREEN}✓${NC} (table exposed)"
else
  echo -e "${YELLOW}~${NC} (HTTP $HEAD_CODE — migrations may not be applied yet)"
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo -e "${GREEN}Local stack verification passed.${NC}"
  echo "Next: run seed if needed: psql -d chefiapp_core -f docker-core/schema/seeds_dev.sql"
  exit 0
else
  echo -e "${RED}Verification failed. Ensure PostgREST/Core is running (e.g. docker-core).${NC}"
  exit 1
fi
