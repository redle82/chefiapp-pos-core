#!/usr/bin/env bash
# Iniciar ambiente local em um comando: Docker Core + Merchant-portal (persistente) + browser.
# Uso: ./start-local.sh   ou   pnpm run start:local
# Ver: docs/implementation/FASE_5_COMO_INICIAR_1_MINUTO.md

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS="$ROOT/scripts"
cd "$ROOT"

echo "=== Chefiapp POS — Iniciar local ==="

# 1. Docker daemon
if ! docker info >/dev/null 2>&1; then
  echo "Docker não está em execução. Inicia o Docker Desktop (ou o daemon) e volta a correr: ./start-local.sh"
  exit 1
fi

# 2. Docker Core
echo "A subir Docker Core..."
pnpm run docker:core:up || true

# 3. Merchant-portal via sessão tmux persistente
PORT=5175
echo "A subir Merchant-portal (persistente) em http://localhost:$PORT ..."
"$SCRIPTS/vite-persistent.sh"

# 4. Abrir browser
if command -v open >/dev/null 2>&1; then
  open "http://localhost:$PORT"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:$PORT"
fi

echo "✅ Tudo ativo!"
echo "   Core API:  http://localhost:3001/rest/v1/"
echo "   Portal:    http://localhost:$PORT"
echo "   TPV:       http://localhost:$PORT/op/tpv"
echo "   Vite logs: tmux attach -t vite"
