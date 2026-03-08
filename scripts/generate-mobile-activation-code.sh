#!/usr/bin/env bash
# Gera um código de ativação (token + PIN) para entrar no AppStaff mobile.
#
# Requer:
#   - Gateway a correr: pnpm run dev:gateway (porta 4320)
#   - Core com migração 20260401_mobile_activation_v1.sql aplicada
#
# Uso:
#   ./scripts/generate-mobile-activation-code.sh          # role driver (entregador)
#   ./scripts/generate-mobile-activation-code.sh manager  # role manager
#
# No app: ecrã Ativar → colar o Token e o PIN de 6 dígitos.

set -e

GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
INTERNAL_TOKEN="${INTERNAL_API_TOKEN:-chefiapp-internal-token-dev}"
RESTAURANT_ID="${RESTAURANT_ID:-00000000-0000-0000-0000-000000000100}"
STAFF_MEMBER_ID="${STAFF_MEMBER_ID:-00000000-0000-0000-0000-000000000201}"
REQUESTED_ROLE="${1:-driver}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${GATEWAY_URL}/mobile/activation-requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${INTERNAL_TOKEN}" \
  -d "{
    \"restaurantId\": \"${RESTAURANT_ID}\",
    \"staffMemberId\": \"${STAFF_MEMBER_ID}\",
    \"requestedRole\": \"${REQUESTED_ROLE}\",
    \"label\": \"Holly (entregador)\",
    \"ttlSeconds\": 600
  }") || {
  echo "Não foi possível contactar o gateway em ${GATEWAY_URL}"
  echo "Inicia o gateway com: pnpm run dev:gateway"
  exit 1
}

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" != "201" ]; then
  echo "Erro HTTP $HTTP_CODE (gateway em ${GATEWAY_URL}?)"
  echo "Garante que o gateway está a correr: pnpm run dev:gateway"
  echo "$HTTP_BODY" | jq . 2>/dev/null || echo "$HTTP_BODY"
  exit 1
fi

# qr.value = "chefiapp://activate?token=atk_xxxxx"
TOKEN=$(echo "$HTTP_BODY" | jq -r '.qr.value | split("=") | .[1] // empty')
PIN=$(echo "$HTTP_BODY" | jq -r '.pinDelivery.pin')

echo ""
echo "=============================================="
echo "  Código para entrar no AppStaff (mobile)"
echo "=============================================="
echo ""
echo "  Token (colar no campo QR/Token):  $TOKEN"
echo "  PIN (6 dígitos):                  $PIN"
echo ""
echo "  Role: $REQUESTED_ROLE | Expira em 10 min"
echo "=============================================="
echo ""
