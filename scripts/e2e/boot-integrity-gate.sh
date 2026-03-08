#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# 🔒 Boot Integrity Gate — run BEFORE E2E tests
#
# Checks:
#   1. No unresolved Git merge-conflict markers (incl. stash-base |||||||)
#   2. Vite build compiles cleanly
#   3. Backend health (optional — set SKIP_HEALTH=1 to skip)
#
# TypeScript type-check is handled by the 'Validate Code Quality' job.
# E2E validates behaviour, not typings.
#
# Usage:
#   bash scripts/e2e/boot-integrity-gate.sh
#
# Exit codes:
#   0 = all checks passed
#   1 = conflict markers found
#   2 = build failed
# ──────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORTAL="$ROOT/merchant-portal"

echo "🔍 Boot Integrity Gate — $(date '+%H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Check 1: Merge-conflict markers ──────────────────────────
echo ""
echo "① Scanning for unresolved merge-conflict markers…"

CONFLICT_FILES=$(grep -rEl '^(<{7} |={7}$|>{7} |\|{7} )' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' \
  --include='*.json' --include='*.css' --include='*.html' \
  "$PORTAL/src" "$PORTAL/tests" 2>/dev/null || true)

if [[ -n "$CONFLICT_FILES" ]]; then
  echo "❌ FAIL: Unresolved merge-conflict markers found in:"
  echo "$CONFLICT_FILES" | while read -r f; do echo "   • $f"; done
  echo ""
  echo "   Fix: resolve all <<<<<<< / ======= / >>>>>>> / ||||||| markers before running E2E."
  exit 1
fi
echo "   ✅ No conflict markers found."

# ── Check 2: Build compiles ─────────────────────────────────
echo ""
echo "② Building merchant-portal (vite build)…"

cd "$PORTAL"
if npx vite build --mode development 2>&1 | tail -5; then
  echo "   ✅ Build succeeded."
else
  echo "❌ FAIL: Vite build failed. Fix compilation errors before running E2E."
  exit 2
fi

# ── Check 3: Backend health (optional — skip if SKIP_HEALTH=1) ──
if [[ "${SKIP_HEALTH:-0}" != "1" ]]; then
  echo ""
  echo "③ Checking backend health (Core REST)…"

  HEALTH_SCRIPT="$ROOT/scripts/core/health-check-core.sh"
  if [[ -f "$HEALTH_SCRIPT" ]]; then
    if bash "$HEALTH_SCRIPT" 2>&1; then
      echo "   ✅ Backend is healthy."
    else
      echo "⚠️  WARNING: Backend health check failed. E2E tests may hit 500s."
      echo "   Continuing anyway — set SKIP_HEALTH=1 to silence this warning."
    fi
  else
    echo "   ⏭  Health script not found, skipping."
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Boot integrity: ALL CHECKS PASSED"
echo ""
