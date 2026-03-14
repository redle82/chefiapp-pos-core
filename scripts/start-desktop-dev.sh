#!/usr/bin/env bash
# Inicia o portal (Vite) em background e abre o app TPV de desktop (Electron).
# Uso: na raiz do projeto, pnpm run dev:desktop (ou ./scripts/start-desktop-dev.sh)

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Se a porta 5175 já estiver em uso, assumir que o portal já corre
if ! command -v lsof &>/dev/null; then
  echo "⚠️  lsof não encontrado; a iniciar Electron. Se o app não carregar, execute noutro terminal: pnpm -w merchant-portal run dev"
else
  if lsof -ti:5175 &>/dev/null; then
    echo "✓ Portal já a correr em :5175"
  else
    echo "A iniciar portal em background (porta 5175)..."
    pnpm -w merchant-portal run dev &
    VITE_PID=$!
    echo "Aguardar 5s para o Vite estar pronto..."
    sleep 5
  fi
fi

echo "A abrir app TPV de desktop..."
cd desktop-app
pnpm run build 2>/dev/null || true
CHEFIAPP_DEV_SERVER_URL=http://localhost:5175 ELECTRON_DEV=true pnpm exec electron .
