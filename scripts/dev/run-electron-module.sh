#!/usr/bin/env bash
set -euo pipefail

MODULE="${1:-tpv}"

if [[ "$MODULE" != "tpv" && "$MODULE" != "kds" ]]; then
  echo "Uso: bash scripts/dev/run-electron-module.sh [tpv|kds]"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DESKTOP_DIR="$ROOT_DIR/desktop-app"

echo "[desktop] building desktop-app..."
cd "$DESKTOP_DIR"
pnpm run build

echo "[desktop] launching module=$MODULE from $DESKTOP_DIR"
ELECTRON_DEV=true CHEFIAPP_MODULE="$MODULE" npx electron .
