#!/usr/bin/env bash
# Activa os botões de download do TPV no Admin (local): build do instalador,
# servidor de ficheiros e variáveis no .env.local.
# Uso: bash scripts/enable-tpv-download-now.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$REPO_ROOT/desktop-app/out"
PORT="${TPV_DOWNLOAD_PORT:-9090}"
ENV_LOCAL="$REPO_ROOT/merchant-portal/.env.local"

echo "════════════════════════════════════════════════════════════"
echo "  Activar download TPV no Admin (local)"
echo "════════════════════════════════════════════════════════════"
echo ""

# 1. Build do instalador se não existir .dmg
if ! ls "$OUT_DIR"/*.dmg 1>/dev/null 2>&1; then
  echo "▶ A construir o instalador (pode demorar alguns minutos)..."
  (cd "$REPO_ROOT" && pnpm run build:desktop) || {
    echo "❌ Build falhou. Verifica erros em cima."
    exit 1
  }
  echo ""
fi

DMG_NAME=$(basename "$(ls "$OUT_DIR"/*.dmg 2>/dev/null | head -1)")
[ -z "$DMG_NAME" ] && { echo "❌ Nenhum .dmg em $OUT_DIR"; exit 1; }
VERSION=$(node -e "console.log(require('$REPO_ROOT/desktop-app/package.json').version)" 2>/dev/null || echo "0.1.0")

echo "▶ Ficheiro instalador: $DMG_NAME"
echo ""

# 2. Servir out/ em background (porta 9090)
if lsof -ti:$PORT >/dev/null 2>&1; then
  echo "▶ Servidor já a correr em http://localhost:$PORT"
else
  echo "▶ A iniciar servidor de ficheiros em http://localhost:$PORT"
  (cd "$OUT_DIR" && python3 -m http.server "$PORT" >/dev/null 2>&1) &
  sleep 1
fi
echo ""

# 3. Actualizar .env.local (só se ainda não tiver as variáveis)
if [ -f "$ENV_LOCAL" ] && grep -q "VITE_DESKTOP_DOWNLOAD_BASE" "$ENV_LOCAL" 2>/dev/null; then
  echo "▶ merchant-portal/.env.local já tem variáveis TPV (podes ajustar se precisares)."
else
  BLOCK="
# ── TPV download (local) — activar botões no Admin ──
VITE_DESKTOP_DOWNLOAD_BASE=http://localhost:$PORT
VITE_DESKTOP_DOWNLOAD_MAC_FILE=$DMG_NAME
VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE=ChefIApp Desktop Setup $VERSION.exe
VITE_DESKTOP_RELEASE_VERSION=$VERSION
"
  echo "$BLOCK" >> "$ENV_LOCAL"
  echo "▶ Variáveis TPV adicionadas a merchant-portal/.env.local"
fi
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  Próximo passo"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Reinicia o dev server do merchant-portal (Ctrl+C e depois):"
echo "   pnpm -w merchant-portal run dev"
echo ""
echo "2. Abre no browser:"
echo "   http://localhost:5175/admin/devices/tpv"
echo ""
echo "3. Os botões de download devem aparecer; clica para descarregar o instalador."
echo ""
