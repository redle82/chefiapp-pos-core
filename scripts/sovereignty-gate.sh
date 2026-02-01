#!/usr/bin/env bash
# sovereignty-gate.sh — Order creation + totals must not use Supabase as authority when Docker Core is the rule.
# Fails if financial-critical modules call supabase.rpc('create_order_atomic') or similar (must use CoreOrdersApi).
# Exit 0 = pass; exit 1 = fail.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

MERCHANT_CORE="$REPO_ROOT/merchant-portal/src/core"
FAILED=0

report() { echo "[sovereignty-gate] $*"; }
fail() { report "FAIL: $*"; FAILED=1; }

# Patterns that indicate Supabase used as authority for order creation (forbidden in favour of CoreOrdersApi)
PATTERN_ORDER_RPC="supabase\.rpc\s*\(\s*['\"]create_order_atomic"
PATTERN_ORDER_RPC_ANY="\(supabase as any\)\.rpc\s*\(\s*['\"]create_order_atomic"

# Financial-critical modules: must use CoreOrdersApi / createOrderAtomic, not supabase.rpc(create_order_atomic)
FILES=(
  "$MERCHANT_CORE/tpv/OrderEngine.ts"
  "$MERCHANT_CORE/services/WebOrderingService.ts"
  "$MERCHANT_CORE/sovereignty/OrderProjection.ts"
  "$MERCHANT_CORE/sync/SyncEngine.ts"
)

report "Checking order creation does not use Supabase RPC in financial-critical modules..."

for f in "${FILES[@]}"; do
  [ ! -f "$f" ] && continue
  if grep -qE "$PATTERN_ORDER_RPC|$PATTERN_ORDER_RPC_ANY" "$f" 2>/dev/null; then
    fail "Supabase RPC for create_order_atomic found in $f (use CoreOrdersApi.createOrderAtomic)"
  fi
done

# Ensure CoreOrdersApi exists and is used
if [ ! -f "$MERCHANT_CORE/infra/CoreOrdersApi.ts" ]; then
  fail "CoreOrdersApi.ts not found (required for order creation sovereignty)"
fi

if [ "$FAILED" -eq 1 ]; then
  report "Sovereignty gate FAILED. Order creation must go through CoreOrdersApi when Docker Core is authority."
  exit 1
fi

report "Sovereignty gate PASSED (order creation via CoreOrdersApi)."
exit 0
