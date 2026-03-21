#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# validate-build-artifact.sh
# Asserts the Vite + VitePWA build produced a deployable artifact
# inside public/app/ (the Vercel outputDirectory).
#
# Usage:  bash scripts/ci/validate-build-artifact.sh
# Exit 0 = all good.  Exit 1 = missing/broken artifact.
# ──────────────────────────────────────────────────────────────
set -euo pipefail

DIR="public/app"
FAIL=0

check() {
  local label="$1" path="$2"
  if [ -f "$path" ]; then
    echo "  ✅ $label"
  else
    echo "  ❌ $label  ($path not found)"
    FAIL=1
  fi
}

echo "── Validating build artifact in $DIR ──"

check "index.html"            "$DIR/index.html"
check "manifest.webmanifest"  "$DIR/manifest.webmanifest"
check "sw.js"                 "$DIR/sw.js"

# At least 1 hashed JS + 1 hashed CSS in assets/
JS_COUNT=$(find "$DIR/assets" -name '*.js' 2>/dev/null | wc -l | tr -d ' ')
CSS_COUNT=$(find "$DIR/assets" -name '*.css' 2>/dev/null | wc -l | tr -d ' ')

if [ "$JS_COUNT" -gt 0 ]; then
  echo "  ✅ JS bundles ($JS_COUNT files)"
else
  echo "  ❌ No JS bundles in $DIR/assets/"
  FAIL=1
fi

if [ "$CSS_COUNT" -gt 0 ]; then
  echo "  ✅ CSS bundles ($CSS_COUNT files)"
else
  echo "  ❌ No CSS bundles in $DIR/assets/"
  FAIL=1
fi

# Sanity: index.html contains the React mount point
if grep -q '<div id="root"' "$DIR/index.html" 2>/dev/null; then
  echo "  ✅ index.html contains <div id=\"root\">"
else
  echo "  ❌ index.html missing <div id=\"root\"> — possible Vite error page"
  FAIL=1
fi

echo ""
if [ "$FAIL" -ne 0 ]; then
  echo "❌ Build artifact validation FAILED"
  exit 1
fi
echo "✅ Build artifact is valid and deployable"
