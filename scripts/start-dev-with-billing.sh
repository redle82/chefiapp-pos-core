#!/usr/bin/env bash
# Um comando: gateway (4320) + frontend (5175). O frontend usa proxy /internal → 4320 (sem CORS).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GATEWAY_PID=""
cleanup() {
  if [ -n "$GATEWAY_PID" ]; then
    kill "$GATEWAY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

export PORT="${PORT:-4320}"
export INTERNAL_API_TOKEN="${INTERNAL_API_TOKEN:-chefiapp-internal-token-dev}"
echo "A subir gateway em http://localhost:$PORT ..."
pnpm run server:integration-gateway &
GATEWAY_PID=$!
sleep 2
echo "A subir frontend em http://localhost:5175 ..."
pnpm -w merchant-portal run dev
