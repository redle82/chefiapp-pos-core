#!/usr/bin/env bash
# Iniciar ambiente local em um comando: Docker Core + Merchant-portal + browser.
# Uso: ./start-local.sh   ou   npm run start:local
# Ver: docs/implementation/FASE_5_COMO_INICIAR_1_MINUTO.md

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "=== Chefiapp POS — Iniciar local ==="

# 1. Docker daemon
if ! docker info >/dev/null 2>&1; then
  echo "Docker não está em execução. Inicia o Docker Desktop (ou o daemon) e volta a correr: ./start-local.sh"
  exit 1
fi

# 2. Docker Core
echo "A subir Docker Core..."
npm run docker:core:up || true

# 3. Merchant-portal em background e abrir browser
PORT=5175
echo "A subir Merchant-portal em http://localhost:$PORT ..."
(cd merchant-portal && npm run dev) &
PID=$!
trap "kill $PID 2>/dev/null || true" EXIT

# Esperar até o servidor responder
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then
    echo "Servidor pronto em http://localhost:$PORT"
    if command -v open >/dev/null 2>&1; then
      open "http://localhost:$PORT"
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "http://localhost:$PORT"
    fi
    wait $PID
    exit 0
  fi
  sleep 1
done

echo "Timeout à espera do servidor. Abre manualmente: http://localhost:$PORT"
wait $PID
