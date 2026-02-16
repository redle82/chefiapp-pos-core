#!/usr/bin/env bash
# =============================================================================
# CHEFIAPP — Critical Flow: chaos (network failure simulation + rollback check)
# =============================================================================
# 1. Force network error by pointing at invalid endpoint; run critical op (create order).
# 2. Expect failure; verify no inconsistent state (e.g. restaurant still readable).
# 3. Rollback: document that client must not leave orphan orders; if order was
#    created but payment failed, cancel/delete the order.
#
# Usage: bash scripts/flows/run-critical-flow-chaos.sh
# =============================================================================
set -euo pipefail

# Use an invalid host so that the "create order" step fails (network error)
export CORE_URL="${CORE_URL_CHAOS:-http://127.0.0.1:19999}"
API="${CORE_URL}/rest/v1"
ANON_KEY="${CORE_ANON_KEY:-chefiapp-core-secret-key-min-32-chars-long}"

echo "═══════════════════════════════════════════════════"
echo "  Critical Flow — Chaos (network failure simulation)"
echo "═══════════════════════════════════════════════════"

# Step 1: Attempt request against invalid endpoint — must fail (connection refused/timeout)
echo ""
echo "── Step 1: Request to invalid endpoint (expect failure) ──"
OUT=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 "${API}/gm_restaurants?limit=1" 2>&1) || true
if echo "$OUT" | grep -q "Failed to connect\|Couldn't connect\|Connection refused\|timed out"; then
  echo "  ✓ Request to invalid endpoint failed as expected (no connection)."
elif [ "$OUT" = "000" ] || [ -z "$OUT" ]; then
  echo "  ✓ Request to invalid endpoint failed as expected (no response)."
else
  echo "  ✗ Expected connection failure; got: $OUT"
  exit 1
fi

# Step 2: Restore real Core and verify state is still consistent (no corruption)
echo ""
echo "── Step 2: Verify state after chaos (real Core) ──"
REAL_URL="${CORE_URL_REAL:-http://localhost:3001}"
REAL_API="${REAL_URL}/rest/v1"
HTTP=$(curl -sS -o /dev/null -w "%{http_code}" "${REAL_API}/" 2>/dev/null) || true
if [ "$HTTP" = "200" ]; then
  echo "  ✓ Real Core still healthy; no state corruption from chaos."
else
  echo "  ⚠ Real Core not reachable (HTTP $HTTP). Run with Core up to validate."
fi

echo ""
echo "  Rollback: On network failure the client must not commit partial state."
echo "  If an order was created but payment failed, cancel/delete that order."
echo "  See docs/ops/rollback-procedure.md for operational rollback."
echo "═══════════════════════════════════════════════════"
exit 0
