#!/bin/sh
set -e

BASE_URL="${CORE_URL:-http://localhost:3001}"
ANON_KEY="${CORE_ANON_KEY:-chefiapp-core-secret-key-min-32-chars-long}"

curl -sS -o /dev/null -D - "${BASE_URL}/rest/v1/" | head -1 | grep -q "200"

curl -sS -o /dev/null \
  -H "apikey: ${ANON_KEY}" \
  "${BASE_URL}/rest/v1/gm_restaurants?select=id&limit=1"

echo "OK: Core REST is healthy"
