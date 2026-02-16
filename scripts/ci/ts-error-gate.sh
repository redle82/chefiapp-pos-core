#!/usr/bin/env bash
# =============================================================================
# TypeScript error count gate — fail CI if TS errors exceed baseline.
# Usage: bash scripts/ci/ts-error-gate.sh
# Baseline: scripts/baseline-ts-errors.txt (one integer)
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASELINE_FILE="${ROOT}/scripts/baseline-ts-errors.txt"

cd "$ROOT"

# Run root typecheck and merchant-portal type-check; capture stderr+stdout (allow failure)
# Prefer pnpm if available (matches AGENTS.md), else npm for CI
if command -v pnpm &>/dev/null; then
  OUT_ROOT=$(pnpm run typecheck 2>&1) || true
  OUT_MP=$(cd merchant-portal && pnpm run type-check 2>&1) || true
else
  OUT_ROOT=$(npm run typecheck 2>&1) || true
  OUT_MP=$(npm -w merchant-portal run type-check 2>&1) || true
fi

COMBINED="${OUT_ROOT}
${OUT_MP}"

# Count lines that look like "error TS" (tsc error lines)
ERROR_COUNT=$(echo "$COMBINED" | grep -c "error TS" || true)
# Ensure numeric
ERROR_COUNT=${ERROR_COUNT:-0}

BASELINE=0
if [ -f "$BASELINE_FILE" ]; then
  BASELINE=$(cat "$BASELINE_FILE" | tr -d ' \n')
  BASELINE=${BASELINE:-0}
fi

if [ "$ERROR_COUNT" -gt "$BASELINE" ]; then
  echo "TS errors: $ERROR_COUNT (baseline: $BASELINE). Failing gate."
  exit 1
fi

echo "TS error count: $ERROR_COUNT (baseline: $BASELINE). Gate passed."
exit 0
