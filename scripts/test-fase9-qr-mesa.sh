#!/bin/bash

# TESTE FASE 9 — QR MESA
# Objetivo: Validar que página da mesa e criação de pedido via QR funcionam

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 9 — QR MESA"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar que Docker Core está rodando
echo "1️⃣ Verificando Docker Core..."
if ! docker ps | grep -q "chefiapp-core-postgres"; then
    echo "❌ ERRO: Docker Core não está rodando"
    exit 1
fi
echo "✅ Docker Core rodando"

# 2. Obter restaurante, mesa e produto
echo ""
echo "2️⃣ Obtendo restaurante, mesa e produto..."
RESTAURANT_DATA=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id, slug FROM gm_restaurants LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$RESTAURANT_DATA" ]; then
    echo "❌ ERRO: Nenhum restaurante encontrado"
    exit 1
fi

RESTAURANT_ID=$(echo "$RESTAURANT_DATA" | cut -d'|' -f1 | xargs)
RESTAURANT_SLUG=$(echo "$RESTAURANT_DATA" | cut -d'|' -f2 | xargs)

TABLE_DATA=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id, number FROM gm_tables WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$TABLE_DATA" ]; then
    echo "❌ ERRO: Nenhuma mesa encontrada"
    exit 1
fi

TABLE_ID=$(echo "$TABLE_DATA" | cut -d'|' -f1 | xargs)
TABLE_NUMBER=$(echo "$TABLE_DATA" | cut -d'|' -f2 | xargs)

PRODUCT_DATA=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id, name, price_cents FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' AND available = true LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$PRODUCT_DATA" ]; then
    echo "❌ ERRO: Nenhum produto encontrado"
    exit 1
fi

PRODUCT_ID=$(echo "$PRODUCT_DATA" | cut -d'|' -f1 | xargs)
PRODUCT_NAME=$(echo "$PRODUCT_DATA" | cut -d'|' -f2 | xargs)
PRODUCT_PRICE=$(echo "$PRODUCT_DATA" | cut -d'|' -f3 | xargs)

echo "✅ Restaurante: $RESTAURANT_ID (slug: $RESTAURANT_SLUG)"
echo "✅ Mesa: $TABLE_NUMBER (ID: $TABLE_ID)"
echo "✅ Produto: $PRODUCT_NAME (R$ $(echo "scale=2; $PRODUCT_PRICE/100" | bc))"

# 3. Verificar acesso à mesa via PostgREST
echo ""
echo "3️⃣ Verificando acesso à mesa via PostgREST..."
TABLE_RESPONSE=$(curl -s -X GET \
    "http://localhost:3001/gm_tables?select=id,number&restaurant_id=eq.$RESTAURANT_ID&number=eq.$TABLE_NUMBER" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -H "Content-Type: application/json" 2>&1)

TABLE_COUNT=$(echo "$TABLE_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" = "0" ]; then
    echo "❌ ERRO: Mesa não encontrada via PostgREST"
    exit 1
fi
echo "✅ Mesa acessível via PostgREST"

# 4. Limpar pedidos OPEN existentes da mesa
echo ""
echo "4️⃣ Limpando pedidos OPEN existentes da mesa..."
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
    "UPDATE gm_orders SET status = 'CLOSED', payment_status = 'PAID' WHERE restaurant_id = '$RESTAURANT_ID' AND table_id = '$TABLE_ID' AND status = 'OPEN';" > /dev/null 2>&1
echo "✅ Pedidos OPEN da mesa fechados"

# 5. Criar pedido via RPC (simulando ação da página QR Mesa)
echo ""
echo "5️⃣ Criando pedido via RPC (simulando QR Mesa)..."
ORDER_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "$PRODUCT_NAME",
      "quantity": 1,
      "unit_price": $PRODUCT_PRICE
    }
  ],
  "p_payment_method": "cash",
  "p_sync_metadata": {
    "origin": "QR_MESA",
    "table_id": "$TABLE_ID",
    "table_number": $TABLE_NUMBER
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

# 6. Verificar pedido no banco
echo ""
echo "6️⃣ Verificando pedido no banco..."
ORDER_DATA=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT status, origin, table_id, table_number, total_cents FROM gm_orders WHERE id = '$ORDER_ID';" 2>/dev/null || echo "")

if [ -z "$ORDER_DATA" ]; then
    echo "❌ ERRO: Pedido não encontrado no banco"
    exit 1
fi

ORDER_STATUS=$(echo "$ORDER_DATA" | cut -d'|' -f1 | xargs)
ORDER_ORIGIN=$(echo "$ORDER_DATA" | cut -d'|' -f2 | xargs)
ORDER_TABLE_ID=$(echo "$ORDER_DATA" | cut -d'|' -f3 | xargs)
ORDER_TABLE_NUMBER=$(echo "$ORDER_DATA" | cut -d'|' -f4 | xargs)
ORDER_TOTAL=$(echo "$ORDER_DATA" | cut -d'|' -f5 | xargs)

if [ "$ORDER_STATUS" != "OPEN" ]; then
    echo "❌ ERRO: Status do pedido incorreto: $ORDER_STATUS (esperado: OPEN)"
    exit 1
fi
echo "✅ Status: $ORDER_STATUS"

if [ "$ORDER_ORIGIN" != "QR_MESA" ]; then
    echo "❌ ERRO: Origem do pedido incorreta: $ORDER_ORIGIN (esperado: QR_MESA)"
    exit 1
fi
echo "✅ Origem: $ORDER_ORIGIN"

if [ "$ORDER_TABLE_ID" != "$TABLE_ID" ]; then
    echo "❌ ERRO: table_id do pedido incorreto: $ORDER_TABLE_ID (esperado: $TABLE_ID)"
    exit 1
fi
echo "✅ table_id: $ORDER_TABLE_ID"

if [ "$ORDER_TABLE_NUMBER" != "$TABLE_NUMBER" ]; then
    echo "❌ ERRO: table_number do pedido incorreto: $ORDER_TABLE_NUMBER (esperado: $TABLE_NUMBER)"
    exit 1
fi
echo "✅ table_number: $ORDER_TABLE_NUMBER"

if [ "$ORDER_TOTAL" != "$PRODUCT_PRICE" ]; then
    echo "❌ ERRO: Total do pedido incorreto: $ORDER_TOTAL (esperado: $PRODUCT_PRICE)"
    exit 1
fi
echo "✅ Total: R$ $(echo "scale=2; $ORDER_TOTAL/100" | bc)"

# 7. Verificar frontend
echo ""
echo "7️⃣ Verificando frontend..."
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/ 2>/dev/null || echo "000")

if [ "$FRONTEND_OK" = "200" ]; then
    echo "✅ Frontend rodando"
    echo ""
    echo "📋 INSTRUÇÕES PARA TESTE MANUAL:"
    echo "   1. Abra: http://localhost:5175/public/$RESTAURANT_SLUG/mesa/$TABLE_NUMBER"
    echo "   2. Verifique que:"
    echo "      - Página mostra 'Mesa $TABLE_NUMBER'"
    echo "      - Menu completo aparece"
    echo "      - Botões '+ Adicionar' funcionam"
    echo "   3. Adicione produtos ao carrinho"
    echo "   4. Clique em 'Finalizar Pedido'"
    echo "   5. Verifique que:"
    echo "      - Mensagem de sucesso aparece"
    echo "      - Pedido aparece no KDS (http://localhost:5175/kds-minimal)"
    echo "      - Origem do pedido é 'QR MESA' (badge rosa) no KDS"
    echo "      - Pedido está associado à mesa $TABLE_NUMBER"
    echo ""
    echo "   📋 Para gerar QR Code:"
    echo "      URL: http://localhost:5175/public/$RESTAURANT_SLUG/mesa/$TABLE_NUMBER"
    echo "      Use qualquer gerador de QR code online com esta URL"
else
    echo "⚠️  AVISO: Frontend não está rodando (porta 5175)"
fi

# 8. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 9 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "QR Mesa validado:"
echo "  ✅ Mesa acessível via PostgREST"
echo "  ✅ Pedido criado via RPC com origem QR_MESA"
echo "  ✅ Pedido associado à mesa (table_id e table_number)"
echo "  ✅ Origem 'QR_MESA' definida corretamente"
echo "  ✅ Status 'OPEN' definido corretamente"
echo "  ✅ Total calculado corretamente"
if [ "$FRONTEND_OK" = "200" ]; then
    echo ""
    echo "  📋 TESTE MANUAL NECESSÁRIO:"
    echo "     Abra http://localhost:5175/public/$RESTAURANT_SLUG/mesa/$TABLE_NUMBER e teste criação de pedido"
fi
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ RECONSTRUÇÃO DISCIPLINADA — CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Todas as fases (0-9) foram concluídas com sucesso!"
echo ""
