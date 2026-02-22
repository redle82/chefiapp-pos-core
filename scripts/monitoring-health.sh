#!/usr/bin/env bash
# DAY 6: Basic monitoring — health checks with latency
# Usage: API_URL=... GATEWAY_URL=... bash scripts/monitoring-health.sh
# Output: one line per check (timestamp, service, status, latency_ms) — suitable for logs or cron.
# Optional: MONITORING_JSON=1 to output a single JSON object.
set -e

API_URL="${API_URL:-http://localhost:3001}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Curl time_total is in seconds; convert to integer ms
latency_ms() {
  local url="$1"
  local t
  t=$(curl -s -o /dev/null -w "%{time_total}" "$url" 2>/dev/null || echo "0")
  echo "${t:-0}" | awk '{ printf "%.0f", $1 * 1000 }'
}

core_code=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/rest/v1/" 2>/dev/null || echo "000")
core_ms=$(latency_ms "${API_URL}/rest/v1/" 2>/dev/null || echo "0")
gate_code=$(curl -s -o /dev/null -w "%{http_code}" "${GATEWAY_URL}/health" 2>/dev/null || echo "000")
gate_ms=$(latency_ms "${GATEWAY_URL}/health" 2>/dev/null || echo "0")

if [[ "${MONITORING_JSON:-0}" == "1" ]]; then
  echo "{\"ts\":\"$TS\",\"core\":{\"status\":$core_code,\"latency_ms\":$core_ms},\"gateway\":{\"status\":$gate_code,\"latency_ms\":$gate_ms}}"
else
  echo "$TS core $core_code ${core_ms}ms"
  echo "$TS gateway $gate_code ${gate_ms}ms"
fi
