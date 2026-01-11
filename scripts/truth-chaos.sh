#!/usr/bin/env bash
set -euo pipefail

# TRUTH CHAOS RUNNER — spins a flapping mock core and runs the headed TPV truth check.
# Usage:
#   ./scripts/truth-chaos.sh                # headed run, default ports/intervals
#   CHAOS_PORT=4500 ./scripts/truth-chaos.sh --grep "Chaos"
#   HEADLESS=1 ./scripts/truth-chaos.sh     # run headless (CI)
#
# Env knobs:
#   CHAOS_PORT (default 4321)
#   CHAOS_UP_MS (default 5000)
#   CHAOS_DOWN_MS (default 3000)
#   CHAOS_FAIL_RATE (default 0.1)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CHAOS_PORT="${CHAOS_PORT:-4321}"
CHAOS_UP_MS="${CHAOS_UP_MS:-5000}"
CHAOS_DOWN_MS="${CHAOS_DOWN_MS:-3000}"
CHAOS_FAIL_RATE="${CHAOS_FAIL_RATE:-0.1}"
CHAOS_API_BASE="http://127.0.0.1:${CHAOS_PORT}"

PLAYWRIGHT_FLAGS=()
if [[ "${HEADLESS:-0}" != "1" ]]; then
  PLAYWRIGHT_FLAGS+=(--headed)
fi
PLAYWRIGHT_FLAGS+=("$@")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TRUTH CHAOS — Mock core flapping + TPV Truth"
echo "  CHAOS_PORT=${CHAOS_PORT} UP_MS=${CHAOS_UP_MS} DOWN_MS=${CHAOS_DOWN_MS} FAIL_RATE=${CHAOS_FAIL_RATE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start chaos core in background
CHAOS_AUTO=1 \
CHAOS_PORT="${CHAOS_PORT}" \
CHAOS_UP_MS="${CHAOS_UP_MS}" \
CHAOS_DOWN_MS="${CHAOS_DOWN_MS}" \
CHAOS_FAIL_RATE="${CHAOS_FAIL_RATE}" \
node scripts/chaos-core-flap.js &
CHAOS_PID=$!

cleanup() {
  if kill -0 "${CHAOS_PID}" 2>/dev/null; then
    echo "Stopping Chaos Core (${CHAOS_PID})..."
    kill "${CHAOS_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Wait for chaos core to respond
for i in {1..15}; do
  if curl -fs "http://127.0.0.1:${CHAOS_PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.3
done

CHAOS_API_BASE="${CHAOS_API_BASE}" \
CHAOS_MODE=1 \
npx playwright test tests/playwright/truth/truth.chaos.spec.ts \
  --config=playwright.config.truth.ts \
  "${PLAYWRIGHT_FLAGS[@]}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TRUTH CHAOS COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
