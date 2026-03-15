#!/usr/bin/env bash
# Serve a pasta desktop-app/out para testar os botões de download do TPV em local.
# O portal (5175) e este servidor devem usar portas diferentes para os botões aparecerem.
# Uso: bash scripts/serve-tpv-downloads.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$REPO_ROOT/desktop-app/out"
PORT="${TPV_DOWNLOAD_PORT:-9090}"

if [ ! -d "$OUT_DIR" ]; then
  echo "❌  $OUT_DIR não existe. Constrói primeiro: cd desktop-app && pnpm run dist:mac"
  exit 1
fi

echo "A servir $OUT_DIR em http://localhost:$PORT"
echo ""
if ls "$OUT_DIR"/*.dmg 1>/dev/null 2>&1; then
  DMG_NAME=$(basename "$(ls "$OUT_DIR"/*.dmg 2>/dev/null | head -1)")
  echo "Ficheiro .dmg encontrado: $DMG_NAME"
  echo "No merchant-portal/.env.local acrescenta:"
  echo "  VITE_DESKTOP_DOWNLOAD_BASE=http://localhost:$PORT"
  echo "  VITE_DESKTOP_DOWNLOAD_MAC_FILE=$DMG_NAME"
  echo "  VITE_DESKTOP_RELEASE_VERSION=0.1.0"
else
  echo "Nenhum .dmg em $OUT_DIR. No .env.local usa o nome exacto do ficheiro após dist:mac."
fi
echo ""
echo "Reinicia o dev server do merchant-portal e abre /admin/devices/tpv"
echo ""

cd "$OUT_DIR"
exec python3 -m http.server "$PORT"
