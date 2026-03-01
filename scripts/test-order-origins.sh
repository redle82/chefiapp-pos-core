#!/bin/bash
# =============================================================================
# Script para testar criação de pedidos com diferentes origens
# =============================================================================
# Cria pedidos via AppStaff e TPV para verificar badges no KDS
# =============================================================================

set -e

echo "🧪 Testando Origens de Pedidos"
echo "================================"
echo ""

# Verificar se Docker Core está rodando
if ! docker ps --format "{{.Names}}" | grep -q "^chefiapp-core-postgres$"; then
    echo "❌ Erro: Docker Core não está rodando"
    echo "Execute: cd docker-core && docker compose -f docker-compose.core.yml up -d"
    exit 1
fi

echo "✅ Docker Core está rodando"
echo ""

# Obter restaurante de exemplo
RESTAURANT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM gm_restaurants LIMIT 1;" | xargs)

if [ -z "$RESTAURANT_ID" ]; then
    echo "❌ Erro: Nenhum restaurante encontrado no banco"
    exit 1
fi

echo "📋 Restaurante: $RESTAURANT_ID"
echo ""

# Obter produto de exemplo
PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM gm_products LIMIT 1;" | xargs)

if [ -z "$PRODUCT_ID" ]; then
    echo "❌ Erro: Nenhum produto encontrado no banco"
    exit 1
fi

echo "📦 Produto: $PRODUCT_ID"
echo ""

# Obter mesa de exemplo
TABLE_NUMBER=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT number FROM gm_tables LIMIT 1;" | xargs)

if [ -z "$TABLE_NUMBER" ]; then
    echo "⚠️  Nenhuma mesa ativa encontrada, usando mesa 1"
    TABLE_NUMBER=1
fi

echo "🪑 Mesa: $TABLE_NUMBER"
echo ""

# URL do PostgREST
POSTGREST_URL="http://localhost:3001"
API_KEY="chefiapp-core-secret-key-min-32-chars-long"

echo "📝 Criando pedido via APPSTAFF..."
echo ""

# Criar pedido com origem APPSTAFF
RESPONSE1=$(curl -s -X POST "${POSTGREST_URL}/rest/v1/rpc/create_order_atomic" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_restaurant_id\": \"${RESTAURANT_ID}\",
    \"p_items\": [{
      \"product_id\": \"${PRODUCT_ID}\",
      \"name\": \"Teste AppStaff\",
      \"quantity\": 1,
      \"unit_price\": 1000
    }],
    \"p_payment_method\": \"cash\",
    \"p_sync_metadata\": {
      \"origin\": \"APPSTAFF\",
      \"table_number\": ${TABLE_NUMBER}
    }
  }")

ORDER_ID_1=$(echo $RESPONSE1 | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -z "$ORDER_ID_1" ]; then
    echo "❌ Erro ao criar pedido APPSTAFF"
    echo "Resposta: $RESPONSE1"
    exit 1
fi

echo "✅ Pedido APPSTAFF criado: $ORDER_ID_1"
echo ""

# Aguardar um pouco
sleep 1

echo "📝 Criando pedido via TPV..."
echo ""

# Criar pedido com origem TPV/CAIXA
RESPONSE2=$(curl -s -X POST "${POSTGREST_URL}/rest/v1/rpc/create_order_atomic" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_restaurant_id\": \"${RESTAURANT_ID}\",
    \"p_items\": [{
      \"product_id\": \"${PRODUCT_ID}\",
      \"name\": \"Teste TPV\",
      \"quantity\": 1,
      \"unit_price\": 1000
    }],
    \"p_payment_method\": \"cash\",
    \"p_sync_metadata\": {
      \"origin\": \"CAIXA\",
      \"table_number\": $((TABLE_NUMBER + 1))
    }
  }")

ORDER_ID_2=$(echo $RESPONSE2 | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")

if [ -z "$ORDER_ID_2" ]; then
    echo "❌ Erro ao criar pedido TPV"
    echo "Resposta: $RESPONSE2"
    exit 1
fi

echo "✅ Pedido TPV criado: $ORDER_ID_2"
echo ""

# Verificar pedidos criados
echo "📊 Verificando pedidos criados:"
echo ""

docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    id,
    table_number,
    status,
    (sync_metadata->>'origin') as origin,
    created_at
FROM gm_orders
WHERE id IN ('${ORDER_ID_1}', '${ORDER_ID_2}')
ORDER BY created_at DESC;
"

echo ""
echo "✅ Teste concluído!"
echo ""
echo "💡 Agora abra o KDS em http://localhost:5175/app/kds"
echo "   Você deve ver dois pedidos com badges diferentes:"
echo "   - 📱 APPSTAFF (roxo)"
echo "   - 💰 CAIXA (verde)"