#!/usr/bin/env bash
# Mostra qual processo está na porta 5175 e de que pasta está a correr.
# Confirma que AdminDevicesPage.tsx em disco tem título "AppStaff".

set -e
echo "=== 1. Processo na porta 5175 ==="
lsof -nP -iTCP:5175 -sTCP:LISTEN 2>/dev/null || { echo "Nenhum processo na 5175."; exit 1; }
echo ""
echo "=== 2. PID e pasta de trabalho do processo (cwd) ==="
PID=$(lsof -nP -iTCP:5175 -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $2}')
if [ -n "$PID" ]; then
  echo "PID: $PID"
  lsof -p "$PID" 2>/dev/null | grep cwd || true
fi
echo ""
echo "=== 3. Conteúdo em disco: título da página em AdminDevicesPage.tsx ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTAL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
grep -n "title=" "$PORTAL_ROOT/src/features/admin/devices/AdminDevicesPage.tsx" | head -5
echo ""
echo "=== 4. Marcador de versão no ficheiro ==="
grep -n "15.mar.2025 B" "$PORTAL_ROOT/src/features/admin/devices/AdminDevicesPage.tsx" || echo "Marcador '15.mar.2025 B' NÃO encontrado no ficheiro."
echo ""
echo "Pasta do merchant-portal: $PORTAL_ROOT"
echo "Se o processo na 5175 não estiver a correr desta pasta, para o processo e executa: cd $PORTAL_ROOT && pnpm run dev"
