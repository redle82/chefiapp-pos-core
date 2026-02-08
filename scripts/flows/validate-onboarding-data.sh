#!/bin/sh
set -e

BASE_URL="${CORE_URL:-http://localhost:3001}"
ANON_KEY="${CORE_ANON_KEY:-chefiapp-core-secret-key-min-32-chars-long}"
RESTAURANT_ID="${RESTAURANT_ID:-00000000-0000-0000-0000-000000000100}"

has_row() {
  echo "$1" | grep -q '"id"'
}

restaurant=$(curl -sS -H "apikey: ${ANON_KEY}" "${BASE_URL}/rest/v1/gm_restaurants?select=id&limit=1&id=eq.${RESTAURANT_ID}")
if ! has_row "$restaurant"; then
  echo "ERROR: restaurant not found (${RESTAURANT_ID})"
  exit 1
fi

tables=$(curl -sS -H "apikey: ${ANON_KEY}" "${BASE_URL}/rest/v1/gm_tables?select=id&limit=1&restaurant_id=eq.${RESTAURANT_ID}")
if ! has_row "$tables"; then
  echo "ERROR: tables not found for restaurant (${RESTAURANT_ID})"
  exit 1
fi

products=$(curl -sS -H "apikey: ${ANON_KEY}" "${BASE_URL}/rest/v1/gm_products?select=id&limit=1&restaurant_id=eq.${RESTAURANT_ID}")
if ! has_row "$products"; then
  echo "ERROR: products not found for restaurant (${RESTAURANT_ID})"
  exit 1
fi

modules=$(curl -sS -H "apikey: ${ANON_KEY}" "${BASE_URL}/rest/v1/installed_modules?select=id&limit=1&restaurant_id=eq.${RESTAURANT_ID}&status=eq.active")
if ! has_row "$modules"; then
  echo "WARN: no active modules found for restaurant (${RESTAURANT_ID})"
else
  echo "OK: active modules found"
fi

echo "OK: onboarding data present"
