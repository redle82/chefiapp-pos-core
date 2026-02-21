#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-5175}"
BASE="http://localhost:${PORT}"
CORE="${CORE_URL:-http://localhost:3001}"

check_route() {
  local route="$1"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "${BASE}${route}" || true)"
  if [[ "$code" != "200" ]]; then
    echo "[merchant-demo-check] FAIL ${route} -> HTTP ${code}"
    return 1
  fi
  echo "[merchant-demo-check] OK   ${route} -> HTTP ${code}"
}

echo "[merchant-demo-check] checking Core health (${CORE}/rest/v1/)"
core_code="$(curl -s -o /dev/null -w "%{http_code}" "${CORE}/rest/v1/" || true)"
if [[ "$core_code" != "200" && "$core_code" != "401" ]]; then
  echo "[merchant-demo-check] FAIL core health -> HTTP ${core_code}"
  exit 1
fi
echo "[merchant-demo-check] OK   core health -> HTTP ${core_code}"

check_route "/landing"
check_route "/features"
check_route "/compare"

echo "[merchant-demo-check] all checks passed"
