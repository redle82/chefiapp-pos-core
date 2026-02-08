#!/usr/bin/env bash
# check-financial-supabase.sh — Fail CI if Supabase is used for financial domain tables.
# Forbidden: supabase.from("gm_orders"), .from("gm_order_items"), .from("fiscal_event_store"), .from("inventory_*")
#            supabase.rpc("...") where the RPC/table name contains gm_orders|gm_order_items|fiscal_event_store|inventory_
# Excludes: tests, mocks, core/supabase/index.ts (shim), core/auth/useSupabaseAuth.ts, core/infra/supabaseClient.ts,
#            *.test.*, *.spec.*, *.skip, core/scripts/**, core/sync/*test.ts
# Exit 0 = pass; exit 1 = fail.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/merchant-portal/src"
FAILED=0

report() { echo "[check-financial-supabase] $*"; }

skip_file() {
  local file="$1"
  [[ "$file" == *"core/supabase/index.ts"* ]] && return 0
  [[ "$file" == *"core/auth/useSupabaseAuth.ts"* ]] && return 0
  [[ "$file" == *"core/infra/supabaseClient.ts"* ]] && return 0
  [[ "$file" == *"/tests/"* ]] || [[ "$file" == *"/__mocks__/"* ]] && return 0
  [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]] || [[ "$file" == *".skip"* ]] && return 0
  [[ "$file" == *"core/sync/"* ]] && [[ "$file" == *".test."* ]] && return 0
  [[ "$file" == *"mock"* ]] || [[ "$file" == *"Mock"* ]] && return 0
  [[ "$file" == *"/scripts/"* ]] && return 0
  [[ "$file" == *"core/scripts/"* ]] && return 0
  return 1
}

# Forbidden: Supabase .from() on financial domain tables
PATTERN_FROM_GM_ORDERS='supabase\.from\s*\(\s*["'\'']gm_orders["'\'']'
PATTERN_FROM_GM_ORDER_ITEMS='supabase\.from\s*\(\s*["'\'']gm_order_items["'\'']'
PATTERN_FROM_FISCAL='supabase\.from\s*\(\s*["'\'']fiscal_event_store["'\'']'
PATTERN_FROM_INVENTORY='supabase\.from\s*\(\s*["'\'']inventory_'

# Forbidden: Supabase .rpc() where name contains financial domain identifiers
PATTERN_RPC_DOMAIN='supabase\.rpc\s*\(\s*["'\''][^"'\'']*(gm_orders|gm_order_items|fiscal_event_store|inventory_)'

report "Checking merchant-portal/src for Supabase usage on gm_orders, gm_order_items, fiscal_event_store, inventory_*..."

# Check .from() patterns
while IFS= read -r line; do
  file="${line%%:*}"
  skip_file "$file" && continue
  report "VIOLATION: $line"
  report "  Financial domain must use Docker Core (getTableClient/DbWriteGate), not Supabase."
  FAILED=1
done < <(cd "$REPO_ROOT" && grep -Rn -E "$PATTERN_FROM_GM_ORDERS|$PATTERN_FROM_GM_ORDER_ITEMS|$PATTERN_FROM_FISCAL|$PATTERN_FROM_INVENTORY" "$SRC" --include='*.ts' --include='*.tsx' 2>/dev/null || true)

# Check .rpc() patterns (same exclusions)
while IFS= read -r line; do
  file="${line%%:*}"
  skip_file "$file" && continue
  report "VIOLATION: $line"
  report "  Financial domain must use Docker Core (getTableClient/RPC), not Supabase."
  FAILED=1
done < <(cd "$REPO_ROOT" && grep -Rn -E "$PATTERN_RPC_DOMAIN" "$SRC" --include='*.ts' --include='*.tsx' 2>/dev/null || true)

if [ "$FAILED" -eq 1 ]; then
  report "FAILED. No supabase.from(gm_orders|gm_order_items|fiscal_event_store|inventory_*) or supabase.rpc(...) on those domains allowed. Use Docker Core."
  exit 1
fi

report "PASSED (no Supabase usage on financial domain tables)."
exit 0
