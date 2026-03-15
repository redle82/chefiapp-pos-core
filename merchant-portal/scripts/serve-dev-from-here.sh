#!/usr/bin/env bash
# Garante que o dev na 5175 corre a partir DESTA pasta (merchant-portal).
# Mata qualquer processo na 5175, limpa cache Vite, arranca o servidor.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTAL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PORTAL_ROOT"

echo "=== merchant-portal: $PORTAL_ROOT ==="
echo ""

# 1. Matar processo na 5175 (macOS/Linux)
if command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -nP -iTCP:5175 -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $2}')
  if [ -n "$PID" ]; then
    echo "A matar processo na porta 5175 (PID $PID)..."
    kill -9 "$PID" 2>/dev/null || true
    sleep 2
  fi
fi

# 2. Limpar cache Vite e dist
echo "A limpar node_modules/.vite e dist..."
rm -rf node_modules/.vite dist 2>/dev/null || true

# 3. Arrancar dev (porta 5175)
echo ""
echo "A arrancar dev server (porta 5175)..."
echo "Quando aparecer 'Local: http://localhost:5175/', abre no browser:"
echo "  http://localhost:5175/admin/modules"
echo "  http://localhost:5175/admin/devices"
echo "  http://localhost:5175/admin/devices/tpv"
echo ""
exec pnpm run dev
