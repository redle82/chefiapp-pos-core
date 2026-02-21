#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORT="${PORT:-5175}"

cd "$ROOT"

echo "[merchant-demo-up] stopping stale Vite sessions..."
bash scripts/vite-persistent.sh stop >/dev/null 2>&1 || true

# guarantee plain HTTP mode by default
unset VITE_DEV_HTTPS VITE_HTTPS_KEY VITE_HTTPS_CERT || true

echo "[merchant-demo-up] starting merchant portal on http://localhost:${PORT}"
PORT="$PORT" bash scripts/vite-persistent.sh

echo "[merchant-demo-up] running startup checks"
bash scripts/ops/merchant-demo-check.sh

echo "[merchant-demo-up] ready: http://localhost:${PORT}/compare"
