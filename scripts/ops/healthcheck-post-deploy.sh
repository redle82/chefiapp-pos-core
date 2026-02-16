#!/usr/bin/env bash
# =============================================================================
# Healthcheck pós-deploy — valida que frontend e Core/API respondem.
# =============================================================================
# Uso:
#   bash scripts/ops/healthcheck-post-deploy.sh
#   FRONTEND_URL=https://app.example.com CORE_URL=https://api.example.com bash scripts/ops/healthcheck-post-deploy.sh
# =============================================================================
set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-https://app.chefiapp.com}"
CORE_URL="${CORE_URL:-https://api.chefiapp.com}"
# Core health: PostgREST root or /rest/v1/
CORE_HEALTH="${CORE_URL}/rest/v1"
if [ "${CORE_URL}" != "${CORE_URL%/rest/v1}" ]; then
  CORE_HEALTH="${CORE_URL}"
fi

PASS=0
FAIL=0

check() {
  local name="$1" url="$2" expected="${3:-200}"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null) || true
  if [ "$code" = "$expected" ] || [ "$code" = "302" ]; then
    echo "  ✓ $name (HTTP $code)"
    PASS=$((PASS + 1))
    return 0
  fi
  echo "  ✗ $name (HTTP $code, expected $expected)"
  FAIL=$((FAIL + 1))
  return 1
}

echo "Healthcheck pós-deploy"
echo "  Frontend: $FRONTEND_URL"
echo "  Core:     $CORE_HEALTH"
echo ""

check "Frontend" "$FRONTEND_URL" "200"
check "Core / PostgREST" "$CORE_HEALTH" "200"

echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "  Result: $PASS passed, $FAIL failed."
  exit 1
fi
echo "  Result: $PASS passed."
exit 0
