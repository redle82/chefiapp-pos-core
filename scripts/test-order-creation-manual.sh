#!/bin/bash
# Script para testar criação de pedido manualmente e capturar erro exato
# Uso: ./scripts/test-order-creation-manual.sh

set -e

BASE_URL="http://localhost:4320"
EMAIL="test@chefiapp.test"
PRODUCT_ID="00000000-0000-0000-0000-000000000001"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TESTE MANUAL: Criação de Pedido"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se servidor está rodando
echo "1️⃣ Verificando se servidor está rodando..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "❌ Servidor não está respondendo em $BASE_URL"
    echo "   Execute: npm run dev"
    exit 1
fi
echo "✅ Servidor está rodando"
echo ""

# Passo 1: Request Magic Link
echo "2️⃣ Autenticando (Magic Link)..."
MAGIC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/request-magic-link" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\"}")

DEV_TOKEN=$(echo "$MAGIC_RESPONSE" | jq -r '.dev_token // empty')

if [ -z "$DEV_TOKEN" ] || [ "$DEV_TOKEN" = "null" ]; then
    echo "❌ Falha ao obter dev_token"
    echo "Resposta: $MAGIC_RESPONSE"
    exit 1
fi

echo "✅ dev_token obtido: ${DEV_TOKEN:0:20}..."
echo ""

# Passo 2: Verify Magic Link
echo "3️⃣ Verificando Magic Link..."
VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/verify-magic-link?token=$DEV_TOKEN")

SESSION_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.session_token // empty')

if [ -z "$SESSION_TOKEN" ] || [ "$SESSION_TOKEN" = "null" ]; then
    echo "❌ Falha ao obter session_token"
    echo "Resposta: $VERIFY_RESPONSE"
    exit 1
fi

echo "✅ session_token obtido: ${SESSION_TOKEN:0:20}..."
echo ""

# Passo 3: Criar Pedido
echo "4️⃣ Criando pedido..."
echo "   Payload:"
echo "   {"
echo "     \"items\": ["
echo "       {"
echo "         \"productId\": \"$PRODUCT_ID\","
echo "         \"name\": \"Test Product\","
echo "         \"quantity\": 1,"
echo "         \"unitPrice\": 1000"
echo "       }"
echo "     ]"
echo "   }"
echo ""

ORDER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/orders" \
    -H "Content-Type: application/json" \
    -H "x-chefiapp-token: $SESSION_TOKEN" \
    -d "{
        \"items\": [
            {
                \"productId\": \"$PRODUCT_ID\",
                \"name\": \"Test Product\",
                \"quantity\": 1,
                \"unitPrice\": 1000
            }
        ]
    }")

HTTP_STATUS=$(echo "$ORDER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
ORDER_BODY=$(echo "$ORDER_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTADO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    echo "✅ SUCESSO! Pedido criado"
    echo "$ORDER_BODY" | jq .
else
    echo "❌ ERRO: HTTP $HTTP_STATUS"
    echo ""
    echo "Resposta completa:"
    echo "$ORDER_BODY" | jq . 2>/dev/null || echo "$ORDER_BODY"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 VERIFICAR LOGS DO SERVIDOR:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Procure por: [API] /api/orders POST failed:"
    echo ""
    echo "O erro específico estará nos logs do servidor."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
