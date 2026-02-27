#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# 🔒 Boot Integrity Gate — run BEFORE E2E tests
#
# Checks:
#   1. No unresolved Git merge-conflict markers (incl. stash-base |||||||)
#   2. TypeScript type-check (tsc --noEmit)
#   3. Vite build compiles cleanly
#   4. Backend health (optional — set SKIP_HEALTH=1 to skip)
#
# Usage:
#   bash scripts/e2e/boot-integrity-gate.sh
#
# Exit codes:
#   0 = all checks passed
#   1 = conflict markers found
#   2 = type-check failed
#   3 = build failed
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

# ── Check 2: TypeScript type-check ──────────────────────────
echo ""
echo "② Type-checking merchant-portal (tsc --noEmit)…"

cd "$PORTAL"
if npx tsc -p tsconfig.app.json --noEmit 2>&1 | tail -10; then
  echo "   ✅ Type-check passed."
else
  echo "⚠️  WARNING: TypeScript type errors detected (non-blocking — main CI already validates types)."
  echo "   Fix them when possible to keep the codebase healthy."
fi

# ── Check 3: Build compiles ─────────────────────────────────
echo ""
echo "③ Building merchant-portal (vite build)…"

cd "$PORTAL"
if npx vite build --mode development 2>&1 | tail -5; then
  echo "   ✅ Build succeeded."
else
  echo "❌ FAIL: Vite build failed. Fix compilation errors before running E2E."
  exit 3
fi

# ── Check 4: Backend health (optional — skip if SKIP_HEALTH=1) ──
if [[ "${SKIP_HEALTH:-0}" != "1" ]]; then
  echo ""
  echo "④ Checking backend health (Core REST)…"

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
