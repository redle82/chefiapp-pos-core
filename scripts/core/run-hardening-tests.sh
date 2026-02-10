#!/bin/sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-core/docker-compose.core.yml"
CORE_DB_URL="${CORE_DB_URL:-postgres://postgres:postgres@127.0.0.1:54320/chefiapp_core}"
MAX_WAIT_SECONDS="${CORE_HEALTH_TIMEOUT:-60}"

cd "$ROOT_DIR"

docker compose -f "$COMPOSE_FILE" up -d

elapsed=0
while ! bash scripts/core/health-check-core.sh >/dev/null 2>&1; do
  sleep 2
  elapsed=$((elapsed + 2))
  if [ "$elapsed" -ge "$MAX_WAIT_SECONDS" ]; then
    echo "Core did not become healthy within ${MAX_WAIT_SECONDS}s."
    exit 1
  fi
done

echo "Core is healthy. Running Hardening P0 DB integration tests..."

DATABASE_URL="$CORE_DB_URL" \
  (cd merchant-portal && npx vitest run \
    tests/core/HardeningP0.locking.test.ts \
    tests/core/HardeningP0.triggers.test.ts \
    --reporter=verbose)

if [ "${CORE_DOWN_AFTER:-0}" = "1" ]; then
  docker compose -f "$COMPOSE_FILE" down -v
fi
