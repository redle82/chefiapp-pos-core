#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
JWT_SECRET="${JWT_SECRET:-chefiapp-core-secret-key-min-32-chars-long}"

# Pick two real principals from current membership table.
A_ROW="$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -At -F '|' -c "SELECT user_id, restaurant_id FROM public.gm_restaurant_members ORDER BY created_at DESC LIMIT 1")"
B_ROW="$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -At -F '|' -c "SELECT user_id, restaurant_id FROM public.gm_restaurant_members ORDER BY created_at DESC OFFSET 1 LIMIT 1")"

if [[ -z "${A_ROW}" || -z "${B_ROW}" ]]; then
  echo "ERROR: need at least two rows in public.gm_restaurant_members"
  exit 1
fi

USER_A="${A_ROW%%|*}"
REST_A="${A_ROW##*|}"
USER_B="${B_ROW%%|*}"
REST_B="${B_ROW##*|}"

make_jwt() {
  node -e '
    const crypto = require("crypto");
    const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const secret = process.argv[1];
    const sub = process.argv[2];
    const role = process.argv[3];
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "HS256", typ: "JWT" };
    const payload = { sub, role, aud: "authenticated", iat: now, exp: now + 3600 };
    const input = `${b(header)}.${b(payload)}`;
    const sig = crypto.createHmac("sha256", secret).update(input).digest("base64url");
    process.stdout.write(`${input}.${sig}`);
  ' "$1" "$2" "$3"
}

JWT_A="$(make_jwt "${JWT_SECRET}" "${USER_A}" "authenticated")"
JWT_B="$(make_jwt "${JWT_SECRET}" "${USER_B}" "authenticated")"
JWT_SERVICE="$(make_jwt "${JWT_SECRET}" "00000000-0000-0000-0000-000000000001" "service_role")"

RID="$(uuidgen | tr '[:upper:]' '[:lower:]')"

echo "=== WS1 RLS Probe ==="
echo "API_URL=${API_URL}"
echo "USER_A=${USER_A} REST_A=${REST_A}"
echo "USER_B=${USER_B} REST_B=${REST_B}"

echo "\n[1] Legit A own-data access (read own membership)"
A_OWN="$(curl -s "${API_URL}/rest/v1/gm_restaurant_members?select=user_id,restaurant_id&user_id=eq.${USER_A}" -H "Authorization: Bearer ${JWT_A}" -H "apikey: ${JWT_A}")"
echo "${A_OWN}" | jq .

echo "\n[2] A attempts cross-tenant read (read B membership)"
A_READ_B="$(curl -s "${API_URL}/rest/v1/gm_restaurant_members?select=user_id,restaurant_id&user_id=eq.${USER_B}" -H "Authorization: Bearer ${JWT_A}" -H "apikey: ${JWT_A}")"
echo "${A_READ_B}" | jq .

echo "\n[2b] A attempts cross-tenant write (insert reservation for B)"
HTTP_CODE_WRITE="$(curl -s -o /tmp/ws1_rls_write.json -w "%{http_code}" "${API_URL}/rest/v1/gm_reservations" \
  -X POST \
  -H "Authorization: Bearer ${JWT_A}" \
  -H "apikey: ${JWT_A}" \
  -H "Content-Type: application/json" \
  -d "[{\"id\":\"${RID}\",\"restaurant_id\":\"${REST_B}\",\"customer_name\":\"WS1-cross-tenant\",\"reservation_date\":\"2026-03-09\",\"reservation_time\":\"12:00\",\"party_size\":2,\"status\":\"confirmed\",\"source\":\"internal\"}]")"
echo "HTTP_CODE=${HTTP_CODE_WRITE}"
cat /tmp/ws1_rls_write.json | jq .

echo "\n[2c] B reads reservation written by A into B tenant"
B_READ_INSERTED="$(curl -s "${API_URL}/rest/v1/gm_reservations?select=id,restaurant_id,customer_name&id=eq.${RID}" -H "Authorization: Bearer ${JWT_B}" -H "apikey: ${JWT_B}")"
echo "${B_READ_INSERTED}" | jq .

echo "\n[3] service_role explicit capability check (event_store count)"
SERVICE_EVENT_COUNT="$(curl -s "${API_URL}/rest/v1/event_store?select=id" -H "Authorization: Bearer ${JWT_SERVICE}" -H "apikey: ${JWT_SERVICE}" | jq 'length')"
AUTH_EVENT_COUNT="$(curl -s "${API_URL}/rest/v1/event_store?select=id" -H "Authorization: Bearer ${JWT_A}" -H "apikey: ${JWT_A}" | jq 'length')"
echo "service_role event_store count=${SERVICE_EVENT_COUNT}"
echo "authenticated event_store count=${AUTH_EVENT_COUNT}"

echo "\nRID=${RID}"
