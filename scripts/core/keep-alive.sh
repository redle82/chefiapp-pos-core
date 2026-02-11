#!/usr/bin/env bash
##############################################################################
# keep-alive.sh — Keeps Docker Core + Vite ALWAYS running.
#
# Usage:
#   bash scripts/core/keep-alive.sh          # run in foreground
#   bash scripts/core/keep-alive.sh &         # run in background
#   nohup bash scripts/core/keep-alive.sh &   # survive terminal close
#
# What it does:
#   Every 15 seconds, checks:
#   1. Docker Core (localhost:3001) — restarts containers if down
#   2. Vite dev server (localhost:5175) — restarts if down
#
# Stop: kill the process or press Ctrl+C
##############################################################################

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CORE_COMPOSE="$ROOT_DIR/docker-core/docker-compose.core.yml"
MERCHANT_DIR="$ROOT_DIR/merchant-portal"
CHECK_INTERVAL=15  # seconds
VITE_PORT=5175
CORE_PORT=3001

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "[$(date '+%H:%M:%S')] $1"; }

check_core() {
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${CORE_PORT}/rest/v1/" 2>/dev/null || echo "000")
  [[ "$status" == "200" ]]
}

check_vite() {
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${VITE_PORT}/" 2>/dev/null || echo "000")
  [[ "$status" != "000" ]]
}

start_core() {
  log "${YELLOW}↻ Docker Core is down — restarting...${NC}"
  cd "$ROOT_DIR"
  docker compose -f "$CORE_COMPOSE" up -d 2>&1 | tail -5
  # Wait for PostgREST to be ready (max 30s)
  for i in $(seq 1 30); do
    if check_core; then
      log "${GREEN}✓ Docker Core is UP (attempt $i)${NC}"
      return 0
    fi
    sleep 1
  done
  log "${RED}✗ Docker Core failed to start after 30s${NC}"
  return 1
}

start_vite() {
  log "${YELLOW}↻ Vite is down — restarting...${NC}"
  # Kill any zombie vite processes on port
  lsof -ti :${VITE_PORT} 2>/dev/null | xargs kill -9 2>/dev/null || true
  sleep 1
  cd "$MERCHANT_DIR"
  VITE_DEBUG_DIRECT_FLOW=true nohup npx vite --port ${VITE_PORT} --host > /tmp/vite-keep-alive.log 2>&1 &
  local vite_pid=$!
  # Wait for Vite to be ready (max 20s)
  for i in $(seq 1 20); do
    if check_vite; then
      log "${GREEN}✓ Vite is UP on :${VITE_PORT} (pid=$vite_pid, attempt $i)${NC}"
      return 0
    fi
    sleep 1
  done
  log "${RED}✗ Vite failed to start after 20s — check /tmp/vite-keep-alive.log${NC}"
  return 1
}

# --- Main loop ---
log "${GREEN}🔒 Keep-alive started — monitoring Core(:${CORE_PORT}) + Vite(:${VITE_PORT})${NC}"
log "   Press Ctrl+C to stop"
echo ""

while true; do
  # Check Core
  if check_core; then
    log "${GREEN}✓ Core OK${NC}"
  else
    start_core || true
  fi

  # Check Vite
  if check_vite; then
    log "${GREEN}✓ Vite OK${NC}"
  else
    start_vite || true
  fi

  sleep "$CHECK_INTERVAL"
done
