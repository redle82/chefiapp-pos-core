#!/bin/bash
# =============================================================================
# Fix Capacitor paths for npm workspaces
# =============================================================================
# npm workspaces hoist @capacitor/* to root node_modules/, but
# capacitor.settings.gradle expects them at merchant-portal/node_modules/.
# This script creates symlinks so both `npx cap sync` and Gradle resolve correctly.
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MP_DIR="$SCRIPT_DIR"
ROOT_DIR="$(cd "$MP_DIR/.." && pwd)"
MP_NM="$MP_DIR/node_modules"
ROOT_NM="$ROOT_DIR/node_modules"

# Packages that Capacitor/Gradle needs to find locally
SCOPED_DIRS=(
  "@capacitor"
  "@capacitor-mlkit"
  "@capgo"
)

for scope in "${SCOPED_DIRS[@]}"; do
  if [ -d "$ROOT_NM/$scope" ] && [ ! -d "$MP_NM/$scope" ]; then
    mkdir -p "$MP_NM"
    ln -sfn "$ROOT_NM/$scope" "$MP_NM/$scope"
    echo "✓ Symlinked $scope → root node_modules"
  fi
done

echo "✓ Capacitor workspace paths ready"
