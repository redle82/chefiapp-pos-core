#!/usr/bin/env bash
set -euo pipefail

# Optional staging smoke gate for audit pipelines.
# Behavior:
# - If staging env is present, run full smoke script.
# - If not present, SKIP without failing.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

RUN_TS="$(date -u +"%Y%m%d-%H%M%S")"
EVIDENCE_DIR="${EVIDENCE_DIR:-$ROOT_DIR/tmp/staging-smoke-${RUN_TS}}"

required_vars=(
  FRONTEND_URL
  CORE_URL
  CORE_ANON_KEY
  RESTAURANT_ID
)

missing=0
for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name:-}" ]; then
    missing=1
  fi
done

if [ $missing -ne 0 ] && [ -z "${DESKTOP_DOWNLOAD_BASE:-${VITE_DESKTOP_DOWNLOAD_BASE:-}}" ]; then
  mkdir -p "$EVIDENCE_DIR"
  cat >"$EVIDENCE_DIR/result.json" <<EOF
{"timestamp":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","status":"SKIPPED","result":"SKIPPED","reason":"missing_env_for_staging_gate","started_at_utc":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","finished_at_utc":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","pass":0,"warn":0,"fail":0,"duration_sec":0,"evidence_dir":"${EVIDENCE_DIR}"}
EOF
  echo "[audit:staging] SKIPPED (no env)"
  exit 0
fi

echo "[audit:staging] Running scripts/staging/smoke.sh"
bash scripts/staging/smoke.sh
