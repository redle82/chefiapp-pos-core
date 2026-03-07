#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATE_TAG="$(date +%Y-%m-%d)"
TIME_TAG="$(date +%H%M%S)"

PORT="${MRP001_CUTOVER_PORT:-4321}"
BASE_URL="${MRP001_CUTOVER_BASE_URL:-http://localhost:${PORT}}"
INTERNAL_TOKEN="${INTERNAL_API_TOKEN:-chefiapp-internal-token-dev}"

OUT_DIR="$ROOT_DIR/docs/audit/runs"
REPORT_FILE="$OUT_DIR/mrp001-cutover-smoke-${DATE_TAG}-${TIME_TAG}.md"
TMP_DIR="$(mktemp -d)"
LOG_FILE="$TMP_DIR/gateway-cutover.log"

mkdir -p "$OUT_DIR"

gateway_pid=""
started_gateway="0"

cleanup() {
  if [[ -n "$gateway_pid" ]]; then
    pkill -P "$gateway_pid" >/dev/null 2>&1 || true
    kill "$gateway_pid" >/dev/null 2>&1 || true
    wait "$gateway_pid" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

wait_for_gateway() {
  local retries=25
  local delay=1
  local i

  for ((i = 1; i <= retries; i++)); do
    if curl -sS "$BASE_URL/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
  done
  return 1
}

http_request() {
  local name="$1"
  local method="$2"
  local url="$3"
  local payload="${4:-}"
  local extra_header_name="${5:-}"
  local extra_header_value="${6:-}"

  local body_file="$TMP_DIR/${name}.body"
  local header_file="$TMP_DIR/${name}.headers"

  local cmd=(curl -sS -X "$method" "$url" -D "$header_file" -o "$body_file")
  if [[ -n "$extra_header_name" ]]; then
    cmd+=(-H "$extra_header_name: $extra_header_value")
  fi
  if [[ -n "$payload" ]]; then
    cmd+=(-H "Content-Type: application/json" -d "$payload")
  fi

  local status
  status="$("${cmd[@]}" -w "%{http_code}")"

  printf "%s\n" "$status" >"$TMP_DIR/${name}.status"
}

read_status() {
  cat "$TMP_DIR/$1.status"
}

read_body() {
  cat "$TMP_DIR/$1.body"
}

read_headers() {
  cat "$TMP_DIR/$1.headers"
}

ensure_contains() {
  local haystack="$1"
  local needle="$2"
  local label="$3"
  if ! grep -Fq "$needle" <<<"$haystack"; then
    echo "[FAIL] $label -> expected to contain: $needle"
    return 1
  fi
  return 0
}

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[INFO] Port $PORT already in use; reusing existing process for smoke run."
else
  echo "[INFO] Starting isolated gateway on port $PORT with INTEGRATION_LEGACY_COMPAT_MODE=0"
  (
    cd "$ROOT_DIR"
    PORT="$PORT" INTEGRATION_LEGACY_COMPAT_MODE=0 pnpm run server:integration-gateway
  ) >"$LOG_FILE" 2>&1 &
  gateway_pid=$!
  started_gateway="1"
fi

if ! wait_for_gateway; then
  echo "[FAIL] Gateway did not become ready at $BASE_URL"
  if [[ -f "$LOG_FILE" ]]; then
    echo "--- gateway log tail ---"
    tail -n 80 "$LOG_FILE" || true
  fi
  exit 1
fi

echo "[INFO] Running MRP-001 cutover smoke matrix against $BASE_URL"

http_request health GET "$BASE_URL/health"
http_request webhook POST "$BASE_URL/api/v1/webhook/sumup" '{"paymentId":"cutover-smoke-1","status":"COMPLETED","amount":1500,"orderRef":"cutover"}'
http_request pix POST "$BASE_URL/api/v1/payment/pix/checkout" '{"order_id":"cutover-smoke","amount":1}' "x-internal-token" "$INTERNAL_TOKEN"
http_request ack_get GET "$BASE_URL/desktop/launch-acks/cutover-nonce-test"
http_request ack_post POST "$BASE_URL/desktop/launch-acks" '{"nonce":"cutover-nonce-test","moduleId":"tpv"}'

health_status="$(read_status health)"
webhook_status="$(read_status webhook)"
pix_status="$(read_status pix)"
ack_get_status="$(read_status ack_get)"
ack_post_status="$(read_status ack_post)"

health_body="$(read_body health)"
webhook_body="$(read_body webhook)"
pix_body="$(read_body pix)"
ack_get_body="$(read_body ack_get)"
ack_post_body="$(read_body ack_post)"

health_headers="$(read_headers health)"
webhook_headers="$(read_headers webhook)"
pix_headers="$(read_headers pix)"

ok=1

[[ "$health_status" == "200" ]] || { echo "[FAIL] health status expected 200 got $health_status"; ok=0; }
ensure_contains "$health_body" '"compat_mode":false' "health body" || ok=0
ensure_contains "$health_headers" 'x-chefiapp-compat-mode: disabled' "health header compat mode" || ok=0

[[ "$webhook_status" == "410" ]] || { echo "[FAIL] webhook status expected 410 got $webhook_status"; ok=0; }
ensure_contains "$webhook_body" '"error":"compatibility_disabled"' "webhook body" || ok=0
ensure_contains "$webhook_headers" 'x-chefiapp-compat-mode: disabled' "webhook header compat mode" || ok=0

[[ "$pix_status" == "410" ]] || { echo "[FAIL] pix status expected 410 got $pix_status"; ok=0; }
ensure_contains "$pix_body" '"error":"compatibility_disabled"' "pix body" || ok=0
ensure_contains "$pix_headers" 'x-chefiapp-compat-mode: disabled' "pix header compat mode" || ok=0

[[ "$ack_get_status" == "200" ]] || { echo "[FAIL] ack GET status expected 200 got $ack_get_status"; ok=0; }
ensure_contains "$ack_get_body" '"found":false' "ack GET body" || ok=0

[[ "$ack_post_status" == "202" ]] || { echo "[FAIL] ack POST status expected 202 got $ack_post_status"; ok=0; }
ensure_contains "$ack_post_body" '"recorded":true' "ack POST body" || ok=0

cat >"$REPORT_FILE" <<EOF
# MRP-001 Cutover Smoke Report

Date: ${DATE_TAG}
Time: ${TIME_TAG}
Base URL: ${BASE_URL}
Legacy compat mode: 0

## Matrix Results

- GET /health -> ${health_status}
- POST /api/v1/webhook/sumup -> ${webhook_status}
- POST /api/v1/payment/pix/checkout -> ${pix_status}
- GET /desktop/launch-acks/:nonce -> ${ack_get_status}
- POST /desktop/launch-acks -> ${ack_post_status}

## Health Body

\`\`\`
${health_body}
\`\`\`

## Webhook Body

\`\`\`
${webhook_body}
\`\`\`

## PIX Body

\`\`\`
${pix_body}
\`\`\`

## Desktop ACK GET Body

\`\`\`
${ack_get_body}
\`\`\`

## Desktop ACK POST Body

\`\`\`
${ack_post_body}
\`\`\`

## Verdict

$([[ "$ok" == "1" ]] && echo "PASS" || echo "FAIL")
EOF

echo "[INFO] Report generated: $REPORT_FILE"

if [[ "$started_gateway" == "1" && -f "$LOG_FILE" ]]; then
  echo "[INFO] Gateway log tail (last 20 lines):"
  tail -n 20 "$LOG_FILE" || true
fi

if [[ "$ok" != "1" ]]; then
  echo "[FAIL] MRP-001 cutover smoke failed"
  exit 1
fi

echo "[PASS] MRP-001 cutover smoke passed"
