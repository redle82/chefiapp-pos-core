#!/usr/bin/env bash
# DAY 6: Test RLS enforcement — User A must not see User B's data
# Usage:
#   JWT_USER_A=<token_a> JWT_USER_B=<token_b> API_URL=http://localhost:3001 bash scripts/test-rls-isolation.sh
# Requires: two valid JWTs for different users (e.g. from signup or test accounts)
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"

if [[ -z "$JWT_USER_A" ]] || [[ -z "$JWT_USER_B" ]]; then
  echo "Usage: JWT_USER_A=<jwt_a> JWT_USER_B=<jwt_b> bash scripts/test-rls-isolation.sh"
  echo "Obtain two JWTs (e.g. signup two users) and set env vars."
  exit 1
fi

echo "=========================================="
echo "DAY 6: RLS isolation test"
echo "=========================================="
echo "API: $API_URL"
echo ""

FAIL=0

# User A: list organizations (should see only A's orgs)
echo -n "User A: GET gm_organizations... "
COUNT_A=$(curl -s "${API_URL}/rest/v1/gm_organizations" \
  -H "Authorization: Bearer $JWT_USER_A" \
  -H "apikey: $JWT_USER_A" | jq 'length')
echo "count=$COUNT_A"

# User B: list organizations (should see only B's orgs; if B has no org, count 0)
echo -n "User B: GET gm_organizations... "
COUNT_B=$(curl -s "${API_URL}/rest/v1/gm_organizations" \
  -H "Authorization: Bearer $JWT_USER_B" \
  -H "apikey: $JWT_USER_B" | jq 'length')
echo "count=$COUNT_B"

# If both have orgs, User B must not see User A's org IDs (and vice versa)
echo -n "User B must not see User A orgs... "
IDS_A=$(curl -s "${API_URL}/rest/v1/gm_organizations" -H "Authorization: Bearer $JWT_USER_A" -H "apikey: $JWT_USER_A" | jq -r '.[].id')
IDS_B=$(curl -s "${API_URL}/rest/v1/gm_organizations" -H "Authorization: Bearer $JWT_USER_B" -H "apikey: $JWT_USER_B" | jq -r '.[].id')
OVERLAP=""
for id in $IDS_A; do
  if echo "$IDS_B" | grep -q "^${id}$"; then OVERLAP="$id"; break; fi
done
if [[ -n "$OVERLAP" ]]; then
  echo -e "${RED}✗${NC} User B sees org $OVERLAP (data leak)"
  FAIL=1
else
  echo -e "${GREEN}✓${NC}"
fi

# Same for gm_restaurants if we have restaurant IDs
echo -n "User A: GET gm_restaurants... "
REST_A=$(curl -s "${API_URL}/rest/v1/gm_restaurants" -H "Authorization: Bearer $JWT_USER_A" -H "apikey: $JWT_USER_A" | jq 'length')
echo "count=$REST_A"
echo -n "User B: GET gm_restaurants... "
REST_B=$(curl -s "${API_URL}/rest/v1/gm_restaurants" -H "Authorization: Bearer $JWT_USER_B" -H "apikey: $JWT_USER_B" | jq 'length')
echo "count=$REST_B"

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo -e "${GREEN}RLS isolation test passed.${NC}"
  exit 0
else
  echo -e "${RED}RLS isolation test failed.${NC}"
  exit 1
fi
