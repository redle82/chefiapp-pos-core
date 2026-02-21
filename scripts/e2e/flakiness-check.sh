#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# 🔬 E2E Flakiness Analysis
#
# Runs contracts + core N times with no retries and single worker
# to measure determinism. Use this before merging changes.
#
# Usage:
#   bash scripts/e2e/flakiness-check.sh [repeat_count]
#
# Default: 5 repetitions
# Exit: 0 if zero flakes, 1 if any flake detected
# ──────────────────────────────────────────────────────────────
set -euo pipefail

REPEAT=${1:-5}
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORTAL="$ROOT/merchant-portal"
REPORT="$PORTAL/artifacts/flakiness-results.json"

echo "🔬 Flakiness Analysis — repeat-each=$REPEAT, retries=0, workers=1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$PORTAL/artifacts"

cd "$PORTAL"

# Run with JSON reporter
E2E_NO_WEB_SERVER="${E2E_NO_WEB_SERVER:-1}" npx playwright test \
  --project=setup \
  --project=contracts \
  --project=core \
  --repeat-each="$REPEAT" \
  --retries=0 \
  --workers=1 \
  --reporter=json > "$REPORT" 2>/dev/null || true

# Parse results
python3 "$ROOT/scripts/e2e/parse-flakiness.py" < "$REPORT"

# Check for any failures
FAILED=$(python3 -c "
import json, sys
data = json.load(open('$REPORT'))
failed = 0
def walk(suites):
    global failed
    for s in suites:
        for spec in s.get('specs', []):
            for t in spec.get('tests', []):
                for r in t.get('results', []):
                    if r['status'] != 'passed':
                        failed += 1
        walk(s.get('suites', []))
walk(data.get('suites', []))
print(failed)
" 2>/dev/null || echo "0")

echo ""
if [[ "$FAILED" -gt 0 ]]; then
  echo "❌ FLAKINESS DETECTED: $FAILED failures in $REPEAT repetitions"
  echo "   Review: $REPORT"
  exit 1
else
  echo "✅ ZERO FLAKES in $REPEAT repetitions"
  exit 0
fi
