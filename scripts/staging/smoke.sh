#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Staging smoke (não-UI)
# - Fail hard: Core, onboarding base, downloads, contratos críticos
# - Warn: observabilidade externa complementar
# =============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

RUN_TS="$(date -u +"%Y%m%d-%H%M%S")"
EVIDENCE_DIR="${EVIDENCE_DIR:-$ROOT_DIR/tmp/staging-smoke-${RUN_TS}}"
mkdir -p "$EVIDENCE_DIR"

START_EPOCH="$(date +%s)"
STARTED_AT_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

FRONTEND_URL="${FRONTEND_URL:-}"
CORE_URL="${CORE_URL:-}"
CORE_ANON_KEY="${CORE_ANON_KEY:-}"
RESTAURANT_ID="${RESTAURANT_ID:-}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"

DESKTOP_DOWNLOAD_BASE="${DESKTOP_DOWNLOAD_BASE:-${VITE_DESKTOP_DOWNLOAD_BASE:-}}"
DESKTOP_DOWNLOAD_MAC_FILE="${DESKTOP_DOWNLOAD_MAC_FILE:-${VITE_DESKTOP_DOWNLOAD_MAC_FILE:-ChefIApp-Desktop.dmg}}"
DESKTOP_DOWNLOAD_WINDOWS_FILE="${DESKTOP_DOWNLOAD_WINDOWS_FILE:-${VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE:-ChefIApp-Desktop-Setup.exe}}"
RELEASES_AVAILABLE="${RELEASES_AVAILABLE:-${VITE_DESKTOP_RELEASES_AVAILABLE:-1}}"
DESKTOP_DOWNLOAD_MIN_BYTES="${DESKTOP_DOWNLOAD_MIN_BYTES:-0}"
DESKTOP_DOWNLOAD_WINDOWS_SHA256="${DESKTOP_DOWNLOAD_WINDOWS_SHA256:-}"
DESKTOP_DOWNLOAD_MAC_SHA256="${DESKTOP_DOWNLOAD_MAC_SHA256:-}"

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

red() { printf "\033[31m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  green "PASS  $1"
}

warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  yellow "WARN  $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  red "FAIL  $1"
}

write_env_summary() {
  cat >"$EVIDENCE_DIR/env.summary" <<EOF
timestamp_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
frontend_url=${FRONTEND_URL}
core_url=${CORE_URL}
gateway_url=${GATEWAY_URL}
restaurant_id=${RESTAURANT_ID}
desktop_download_base=${DESKTOP_DOWNLOAD_BASE}
desktop_download_windows_file=${DESKTOP_DOWNLOAD_WINDOWS_FILE}
desktop_download_mac_file=${DESKTOP_DOWNLOAD_MAC_FILE}
releases_available=${RELEASES_AVAILABLE}
desktop_download_min_bytes=${DESKTOP_DOWNLOAD_MIN_BYTES}
has_windows_sha256=$([ -n "$DESKTOP_DOWNLOAD_WINDOWS_SHA256" ] && echo 1 || echo 0)
has_mac_sha256=$([ -n "$DESKTOP_DOWNLOAD_MAC_SHA256" ] && echo 1 || echo 0)
EOF
}

is_releases_enabled() {
  case "$RELEASES_AVAILABLE" in
    1|true|TRUE)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

require_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ]; then
    fail "Missing required env: $name"
    return 1
  fi
  pass "Env present: $name"
  return 0
}

http_code() {
  local url="$1"
  curl -sS -L -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "000"
}

check_http_ok() {
  local label="$1"
  local url="$2"
  local code
  code="$(http_code "$url")"
  case "$code" in
    200|204|301|302)
      pass "$label ($code) -> $url"
      ;;
    *)
      fail "$label ($code) -> $url"
      ;;
  esac
}

check_http_ok_warn() {
  local label="$1"
  local url="$2"
  local code
  code="$(http_code "$url")"
  case "$code" in
    200|204|301|302)
      pass "$label ($code) -> $url"
      ;;
    *)
      warn "$label ($code) -> $url"
      ;;
  esac
}

check_download_strict() {
  local label="$1"
  local url="$2"
  local expected_sha="$3"
  local tmp_file="$EVIDENCE_DIR/${label}.bin"
  local headers_file="$EVIDENCE_DIR/${label}.headers.txt"

  local code
  code="$(curl -sS -L --connect-timeout 20 -D "$headers_file" -o "$tmp_file" -w "%{http_code}" "$url" 2>/dev/null || echo "000")"
  case "$code" in
    200|204)
      ;;
    *)
      fail "${label} strict download failed (${code}) -> ${url}"
      rm -f "$tmp_file"
      return 1
      ;;
  esac

  local size
  size="$(wc -c <"$tmp_file" | tr -d ' ')"
  if [ "$DESKTOP_DOWNLOAD_MIN_BYTES" -gt 0 ] && [ "$size" -lt "$DESKTOP_DOWNLOAD_MIN_BYTES" ]; then
    fail "${label} size below minimum (${size} < ${DESKTOP_DOWNLOAD_MIN_BYTES})"
    rm -f "$tmp_file"
    return 1
  fi

  if [ -n "$expected_sha" ]; then
    local actual_sha
    actual_sha="$(shasum -a 256 "$tmp_file" | awk '{print $1}')"
    if [ "$actual_sha" != "$expected_sha" ]; then
      fail "${label} checksum mismatch"
      rm -f "$tmp_file"
      return 1
    fi
  fi

  pass "${label} strict validation passed (bytes=${size})"
  rm -f "$tmp_file"
  return 0
}

run_critical() {
  local label="$1"
  shift
  if "$@"; then
    pass "$label"
  else
    fail "$label"
  fi
}

run_warn() {
  local label="$1"
  shift
  if "$@"; then
    pass "$label"
  else
    warn "$label"
  fi
}

printf "\n=== ChefIApp Staging Smoke (non-UI) ===\n"
printf "Timestamp: %s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
printf "Repo: %s\n\n" "$ROOT_DIR"
printf "Evidence: %s\n\n" "$EVIDENCE_DIR"

write_env_summary

# 0) Required env for staging checks (critical)
require_var FRONTEND_URL || true
require_var CORE_URL || true
require_var CORE_ANON_KEY || true
require_var RESTAURANT_ID || true
if is_releases_enabled; then
  require_var DESKTOP_DOWNLOAD_BASE || true
else
  warn "RELEASES_AVAILABLE disabled; desktop download checks are skipped"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  red "\nAborting early due to missing required env."
  cat >"$EVIDENCE_DIR/result.json" <<EOF
{"timestamp":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","status":"FAIL","result":"FAIL","reason":"missing_env","started_at_utc":"${STARTED_AT_UTC}","finished_at_utc":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","pass":${PASS_COUNT},"warn":${WARN_COUNT},"fail":${FAIL_COUNT},"evidence_dir":"$(json_escape "$EVIDENCE_DIR")"}
EOF
  exit 1
fi

# 1) Core health + onboarding data (critical)
curl -sS -D "$EVIDENCE_DIR/curl-core-health.txt" -o /dev/null --connect-timeout 10 "${CORE_URL}/rest/v1/" || true
run_critical "core health-check script" env CORE_URL="$CORE_URL" CORE_ANON_KEY="$CORE_ANON_KEY" bash scripts/core/health-check-core.sh
run_critical "onboarding data validation" env CORE_URL="$CORE_URL" CORE_ANON_KEY="$CORE_ANON_KEY" RESTAURANT_ID="$RESTAURANT_ID" bash scripts/flows/validate-onboarding-data.sh

# 2) Frontend route availability (technical support checks)
curl -sS -D "$EVIDENCE_DIR/curl-frontend-head.txt" -o /dev/null --connect-timeout 10 "$FRONTEND_URL" || true
check_http_ok "frontend root" "$FRONTEND_URL"
check_http_ok "admin devices route" "$FRONTEND_URL/admin/devices"
check_http_ok "install route (technical HTTP check)" "$FRONTEND_URL/app/install"

# 3) Desktop downloads (critical)
if is_releases_enabled; then
  check_http_ok "desktop download windows" "$DESKTOP_DOWNLOAD_BASE/$DESKTOP_DOWNLOAD_WINDOWS_FILE"
  check_http_ok "desktop download mac" "$DESKTOP_DOWNLOAD_BASE/$DESKTOP_DOWNLOAD_MAC_FILE"

  if [ "$DESKTOP_DOWNLOAD_MIN_BYTES" -gt 0 ] || [ -n "$DESKTOP_DOWNLOAD_WINDOWS_SHA256" ] || [ -n "$DESKTOP_DOWNLOAD_MAC_SHA256" ]; then
    check_download_strict "desktop-windows" "$DESKTOP_DOWNLOAD_BASE/$DESKTOP_DOWNLOAD_WINDOWS_FILE" "$DESKTOP_DOWNLOAD_WINDOWS_SHA256" || true
    check_download_strict "desktop-mac" "$DESKTOP_DOWNLOAD_BASE/$DESKTOP_DOWNLOAD_MAC_FILE" "$DESKTOP_DOWNLOAD_MAC_SHA256" || true
  else
    warn "desktop strict integrity checks skipped (set DESKTOP_DOWNLOAD_MIN_BYTES and/or checksums to enable)"
  fi
else
  warn "desktop download URL checks skipped because RELEASES_AVAILABLE=0"
  warn "desktop strict integrity checks skipped because RELEASES_AVAILABLE=0"
fi

# 4) Contract checks in code (critical)
CONTRACTS_FILE="$EVIDENCE_DIR/contracts.txt"
{
  echo "# Contract checks"
  echo "timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""
  echo "- /app/install redirect contract"
  grep -En 'path="/app/install"|Navigate to="/admin/devices"' merchant-portal/src/routes/OperationalRoutes.tsx || true
  echo ""
  echo "- extractInstallToken contract"
  grep -En 'new URL\(|searchParams\.get\("token"\)|\[\?&\]token=' merchant-portal/src/pages/ElectronSetup/extractInstallToken.ts || true
  echo ""
  echo "- print wizard functions"
  grep -En 'labels|kitchen|receipt' merchant-portal/src/features/admin/devices/PrinterAssignmentWizard.tsx || true
  echo ""
  echo "- handoff route"
  grep -En 'path="handoff"|TPVHandoffPage' merchant-portal/src/routes/OperationalRoutes.tsx || true
} >"$CONTRACTS_FILE"

run_critical "contract: extractInstallToken supports URL token parsing" grep -Eq 'new URL\(|searchParams\.get\("token"\)|\[\?&\]token=' merchant-portal/src/pages/ElectronSetup/extractInstallToken.ts
run_critical "contract: print wizard has 3 functions" grep -Eq 'labels|kitchen|receipt' merchant-portal/src/features/admin/devices/PrinterAssignmentWizard.tsx
run_critical "contract: /app/install route exists" grep -Eq 'path="/app/install"' merchant-portal/src/routes/OperationalRoutes.tsx
run_critical "contract: /app/install navigates to admin devices" grep -Eq 'Navigate to="/admin/devices"' merchant-portal/src/routes/OperationalRoutes.tsx
run_critical "contract: handoff route exists" grep -Eq 'path="handoff".*TPVHandoffPage' merchant-portal/src/routes/OperationalRoutes.tsx

# 5) Observability (warn-only)
run_warn "monitoring health script" env API_URL="$CORE_URL" GATEWAY_URL="$GATEWAY_URL" bash scripts/monitoring-health.sh >/dev/null
check_http_ok_warn "gateway health" "$GATEWAY_URL/health"

printf "\n=== Summary ===\n"
printf "PASS: %s\n" "$PASS_COUNT"
printf "WARN: %s\n" "$WARN_COUNT"
printf "FAIL: %s\n" "$FAIL_COUNT"

END_EPOCH="$(date +%s)"
DURATION_SEC=$((END_EPOCH - START_EPOCH))
FINISHED_AT_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [ "$FAIL_COUNT" -gt 0 ]; then
  cat >"$EVIDENCE_DIR/result.json" <<EOF
{"timestamp":"${FINISHED_AT_UTC}","status":"FAIL","result":"FAIL","has_warnings":$([ "$WARN_COUNT" -gt 0 ] && echo true || echo false),"started_at_utc":"${STARTED_AT_UTC}","finished_at_utc":"${FINISHED_AT_UTC}","pass":${PASS_COUNT},"warn":${WARN_COUNT},"fail":${FAIL_COUNT},"duration_sec":${DURATION_SEC},"evidence_dir":"$(json_escape "$EVIDENCE_DIR")"}
EOF
  red "\nResult: FAIL"
  exit 1
fi

if [ "$WARN_COUNT" -gt 0 ]; then
  cat >"$EVIDENCE_DIR/result.json" <<EOF
{"timestamp":"${FINISHED_AT_UTC}","status":"PASS","result":"PASS","has_warnings":true,"started_at_utc":"${STARTED_AT_UTC}","finished_at_utc":"${FINISHED_AT_UTC}","pass":${PASS_COUNT},"warn":${WARN_COUNT},"fail":${FAIL_COUNT},"duration_sec":${DURATION_SEC},"evidence_dir":"$(json_escape "$EVIDENCE_DIR")"}
EOF
  yellow "\nResult: PASS with WARNINGS"
  exit 0
fi

cat >"$EVIDENCE_DIR/result.json" <<EOF
{"timestamp":"${FINISHED_AT_UTC}","status":"PASS","result":"PASS","has_warnings":false,"started_at_utc":"${STARTED_AT_UTC}","finished_at_utc":"${FINISHED_AT_UTC}","pass":${PASS_COUNT},"warn":${WARN_COUNT},"fail":${FAIL_COUNT},"duration_sec":${DURATION_SEC},"evidence_dir":"$(json_escape "$EVIDENCE_DIR")"}
EOF

green "\nResult: PASS"
exit 0
