#!/usr/bin/env bash
set -euo pipefail

# TRUTH STRESS RUNNER — parallel + repeat for race detection
# Defaults match the "modo agressivo" requested:
#   workers=4, repeat=10, retries=0
#
# Usage:
#   ./scripts/truth-stress.sh
#   WORKERS=6 REPEAT=15 ./scripts/truth-stress.sh --headed
#   ./scripts/truth-stress.sh --grep "tpv"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WORKERS="${WORKERS:-4}"
REPEAT="${REPEAT:-10}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TRUTH STRESS — Playwright Truth Suite"
echo "  workers=${WORKERS} repeat-each=${REPEAT} retries=0"
echo "  excludes=Chaos (run ./scripts/truth-chaos.sh for chaos mode)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npx playwright test tests/playwright/truth \
  --config=playwright.config.truth.ts \
  --workers="${WORKERS}" \
  --repeat-each="${REPEAT}" \
  --retries=0 \
  --grep-invert="Chaos" \
  "$@"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TRUTH STRESS COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
