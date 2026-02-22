#!/usr/bin/env bash
# DAY 7: Load testing — simulate concurrent users
# Usage:
#   API_URL=http://localhost:3001 JWT=<bearer> bash scripts/load-test.sh
# Requires: wrk (install: brew install wrk)
# Target: p99 latency < 200ms (see IMPLEMENTATION_CHECKLIST.md)
set -e

API_URL="${API_URL:-http://localhost:3001}"
JWT="${JWT:-}"
DURATION="${LOAD_DURATION:-30s}"
THREADS="${LOAD_THREADS:-4}"
CONNECTIONS="${LOAD_CONNECTIONS:-100}"

if ! command -v wrk >/dev/null 2>&1; then
  echo "wrk not found. Install: brew install wrk (macOS) or see https://github.com/wg/wrk"
  exit 1
fi

echo "=========================================="
echo "DAY 7: Load test"
echo "=========================================="
echo "API: $API_URL"
echo "Duration: $DURATION | Threads: $THREADS | Connections: $CONNECTIONS"
echo ""

URL="${API_URL}/rest/v1/"
if [[ -n "$JWT" ]]; then
  echo "Running with Authorization header."
  wrk -t "$THREADS" -c "$CONNECTIONS" -d "$DURATION" \
    -H "Authorization: Bearer $JWT" \
    -H "apikey: $JWT" \
    -H "Content-Type: application/json" \
    "$URL"
else
  echo "JWT not set. Running without auth (anon may get 401)."
  wrk -t "$THREADS" -c "$CONNECTIONS" -d "$DURATION" \
    -H "Content-Type: application/json" \
    "$URL"
fi

echo ""
echo "Check Latency Distribution above; p99 target < 200ms."
