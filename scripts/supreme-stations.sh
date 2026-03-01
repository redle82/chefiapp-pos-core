#!/usr/bin/env bash
# =============================================================================
# Supreme Stations — Abre estações visuais para observação humana
# =============================================================================
# Command Center, TPV, KDS, Web Pública (e opcionalmente AppStaff via Expo).
# Porta base: PORT=5175 (ou VITE_PORT).
# =============================================================================

set -e

PORT="${PORT:-5175}"
BASE_URL="http://localhost:${PORT}"

echo "Supreme Stations — opening UIs at ${BASE_URL}"
echo ""

# Verificar se o servidor está a correr
if ! curl -sS --connect-timeout 2 "${BASE_URL}" > /dev/null 2>&1; then
  echo "Warning: server not responding at ${BASE_URL}"
  echo "Start merchant portal: cd merchant-portal && npm run dev"
  echo ""
fi

open_cmd=""
if command -v open > /dev/null 2>&1; then
  open_cmd="open"
elif command -v xdg-open > /dev/null 2>&1; then
  open_cmd="xdg-open"
fi

if [ -n "$open_cmd" ]; then
  echo "Command Center..."
  $open_cmd "${BASE_URL}/app" 2>/dev/null || true
  sleep 1
  echo "TPV..."
  $open_cmd "${BASE_URL}/tpv" 2>/dev/null || true
  sleep 1
  echo "KDS..."
  $open_cmd "${BASE_URL}/kds" 2>/dev/null || true
  sleep 1
  echo "Web Public (QR)..."
  $open_cmd "${BASE_URL}/public" 2>/dev/null || true
  echo ""
  echo "Stations opened. Optional: run AppStaff with 'cd mobile-app && npx expo start'"
else
  echo "Open manually:"
  echo "  Command Center: ${BASE_URL}/app"
  echo "  TPV:            ${BASE_URL}/tpv"
  echo "  KDS:            ${BASE_URL}/kds"
  echo "  Web Public:     ${BASE_URL}/public"
  echo "  AppStaff:       cd mobile-app && npx expo run:ios / npx expo run:android"
fi
