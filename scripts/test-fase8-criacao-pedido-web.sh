#!/bin/bash

# TESTE FASE 8 — CRIAÇÃO DE PEDIDO VIA WEB
# Objetivo: Validar que criação de pedido via web funciona corretamente

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 8 — CRIAÇÃO DE PEDIDO VIA WEB"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar que Docker Core está rodando
echo "1️⃣ Verificando Docker Core..."
if ! docker ps | grep -q "chefiapp-core-postgres"; then
    echo "❌ ERRO: Docker Core não está rodando"
    exit 1
fi
echo "✅ Docker Core rodando"

# 2. Obter restaurante e produto
echo ""
echo "2️⃣ Obtendo restaurante e produto..."
RESTAURANT_DATA=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id, slug FROM gm_restaurants LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$RESTAURANT_DATA" ]; then
    echo "❌ ERRO: Nenhum restaurante encontrado"
    exit 1
fi

RESTAURANT_ID=$(echo "$RESTAURANT_DATA" | cut -d'|' -f1 | xargs)
RESTAURANT_SLUG=$(echo "$RESTAURANT_DATA" | cut -d'|' -f2 | xargs)

PRODUCT_DATA=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id, name, price_cents FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' AND available = true LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$PRODUCT_DATA" ]; then
    echo "❌ ERRO: Nenhum produto encontrado"
    exit 1
fi

PRODUCT_ID=$(echo "$PRODUCT_DATA" | cut -d'|' -f1 | xargs)
PRODUCT_NAME=$(echo "$PRODUCT_DATA" | cut -d'|' -f2 | xargs)
PRODUCT_PRICE=$(echo "$PRODUCT_DATA" | cut -d'|' -f3 | xargs)

echo "✅ Restaurante: $RESTAURANT_ID"
echo "✅ Produto: $PRODUCT_NAME (R$ $(echo "scale=2; $PRODUCT_PRICE/100" | bc))"

# 3. Limpar pedidos OPEN existentes
echo ""
echo "3️⃣ Limpando pedidos OPEN existentes..."
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
    "UPDATE gm_orders SET status = 'CLOSED', payment_status = 'PAID' WHERE restaurant_id = '$RESTAURANT_ID' AND status = 'OPEN';" > /dev/null 2>&1
echo "✅ Pedidos OPEN fechados"

# 4. Criar pedido via RPC (simulando ação da página web)
echo ""
echo "4️⃣ Criando pedido via RPC (simulando página web)..."
ORDER_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "$PRODUCT_NAME",
      "quantity": 2,
      "unit_price": $PRODUCT_PRICE
    }
  ],
  "p_payment_method": "cash",
  "p_sync_metadata": {
    "origin": "WEB_PUBLIC"
  }
}
EOF
)

ORDER_RESPONSE=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
    -H "Content-Type: application/json" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -d "$ORDER_PAYLOAD" 2>&1)

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
    echo "❌ ERRO: Pedido não foi criado"
    echo "$ORDER_RESPONSE" | head -5
    exit 1
fi
echo "✅ Pedido criado: $ORDER_ID"

# 5. Verificar pedido no banco
echo ""
echo "5️⃣ Verificando pedido no banco..."
ORDER_STATUS=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT status, origin, total_cents FROM gm_orders WHERE id = '$ORDER_ID';" 2>/dev/null || echo "")

if [ -z "$ORDER_STATUS" ]; then
    echo "❌ ERRO: Pedido não encontrado no banco"
    exit 1
fi

ORDER_STATUS_VALUE=$(echo "$ORDER_STATUS" | cut -d'|' -f1 | xargs)
ORDER_ORIGIN=$(echo "$ORDER_STATUS" | cut -d'|' -f2 | xargs)
ORDER_TOTAL=$(echo "$ORDER_STATUS" | cut -d'|' -f3 | xargs)

if [ "$ORDER_STATUS_VALUE" != "OPEN" ]; then
    echo "❌ ERRO: Status do pedido incorreto: $ORDER_STATUS_VALUE (esperado: OPEN)"
    exit 1
fi
echo "✅ Status: $ORDER_STATUS_VALUE"

if [ "$ORDER_ORIGIN" != "WEB_PUBLIC" ]; then
    echo "❌ ERRO: Origem do pedido incorreta: $ORDER_ORIGIN (esperado: WEB_PUBLIC)"
    exit 1
fi
echo "✅ Origem: $ORDER_ORIGIN"

EXPECTED_TOTAL=$((PRODUCT_PRICE * 2))
if [ "$ORDER_TOTAL" != "$EXPECTED_TOTAL" ]; then
    echo "❌ ERRO: Total do pedido incorreto: $ORDER_TOTAL (esperado: $EXPECTED_TOTAL)"
    exit 1
fi
echo "✅ Total: R$ $(echo "scale=2; $ORDER_TOTAL/100" | bc)"

# 6. Verificar itens do pedido
echo ""
echo "6️⃣ Verificando itens do pedido..."
ITEMS_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT COUNT(*) FROM gm_order_items WHERE order_id = '$ORDER_ID';" 2>/dev/null || echo "0")

if [ "$ITEMS_COUNT" != "1" ]; then
    echo "❌ ERRO: Número de itens incorreto: $ITEMS_COUNT (esperado: 1)"
    exit 1
fi
echo "✅ Itens: $ITEMS_COUNT"

ITEM_QUANTITY=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT quantity FROM gm_order_items WHERE order_id = '$ORDER_ID';" 2>/dev/null || echo "0")

if [ "$ITEM_QUANTITY" != "2" ]; then
    echo "❌ ERRO: Quantidade do item incorreta: $ITEM_QUANTITY (esperado: 2)"
    exit 1
fi
echo "✅ Quantidade do item: $ITEM_QUANTITY"

# 7. Verificar frontend
echo ""
echo "7️⃣ Verificando frontend..."
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/ 2>/dev/null || echo "000")

if [ "$FRONTEND_OK" = "200" ]; then
    echo "✅ Frontend rodando"
    echo ""
    echo "📋 INSTRUÇÕES PARA TESTE MANUAL:"
    echo "   1. Abra: http://localhost:5175/public/$RESTAURANT_SLUG"
    echo "   2. Adicione produtos ao carrinho (botão '+ Adicionar')"
    echo "   3. Verifique que:"
    echo "      - Carrinho aparece no topo direito"
    echo "      - Quantidade pode ser ajustada (+/-)"
    echo "      - Total é calculado corretamente"
    echo "   4. Clique em 'Finalizar Pedido'"
    echo "   5. Verifique que:"
    echo "      - Mensagem de sucesso aparece"
    echo "      - Carrinho é limpo"
    echo "      - Pedido aparece no KDS (http://localhost:5175/kds-minimal)"
    echo "      - Origem do pedido é 'WEB_PUBLIC' no KDS"
else
    echo "⚠️  AVISO: Frontend não está rodando (porta 5175)"
fi

# 8. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 8 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Criação de pedido via web validada:"
echo "  ✅ Pedido criado via RPC create_order_atomic"
echo "  ✅ Origem 'WEB_PUBLIC' definida corretamente"
echo "  ✅ Status 'OPEN' definido corretamente"
echo "  ✅ Total calculado corretamente"
echo "  ✅ Itens do pedido criados corretamente"
if [ "$FRONTEND_OK" = "200" ]; then
    echo ""
    echo "  📋 TESTE MANUAL NECESSÁRIO:"
    echo "     Abra http://localhost:5175/public/$RESTAURANT_SLUG e teste criação de pedido"
fi
echo ""
echo "Pronto para FASE 9 — QR Mesa"
echo ""
