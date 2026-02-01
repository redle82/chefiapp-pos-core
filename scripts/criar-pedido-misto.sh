#!/bin/bash
# Script para criar pedido com itens mistos (BAR + COZINHA) para validação

RESTAURANT_ID="bbce08c7-63c0-473d-b693-ec2997f73a68"
DOCKER_CORE_URL="http://localhost:3001"
API_KEY="chefiapp-core-secret-key-min-32-chars-long"

echo "🔍 Buscando produtos..."
AGUA_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' AND name = 'Água Mineral' LIMIT 1;" | tr -d ' \n')
HAMBURGUER_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' AND name = 'Hambúrguer Artesanal' LIMIT 1;" | tr -d ' \n')

if [ -z "$AGUA_ID" ] || [ -z "$HAMBURGUER_ID" ]; then
  echo "❌ Produtos não encontrados. Criando..."
  docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core <<SQL
INSERT INTO gm_products (restaurant_id, name, price_cents, prep_time_seconds, prep_category, station, available)
VALUES 
  ('$RESTAURANT_ID', 'Água Mineral', 200, 60, 'drink', 'BAR', true),
  ('$RESTAURANT_ID', 'Hambúrguer Artesanal', 1800, 720, 'main', 'KITCHEN', true)
ON CONFLICT DO NOTHING;
SQL
  AGUA_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' AND name = 'Água Mineral' LIMIT 1;" | tr -d ' \n')
  HAMBURGUER_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' AND name = 'Hambúrguer Artesanal' LIMIT 1;" | tr -d ' \n')
fi

echo "✅ Água Mineral ID: $AGUA_ID"
echo "✅ Hambúrguer Artesanal ID: $HAMBURGUER_ID"

echo "📦 Criando pedido com itens mistos..."
RESPONSE=$(curl -s -X POST "$DOCKER_CORE_URL/rest/v1/rpc/create_order_atomic" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_restaurant_id\": \"$RESTAURANT_ID\",
    \"p_items\": [
      {
        \"product_id\": \"$AGUA_ID\",
        \"name\": \"Água Mineral\",
        \"quantity\": 2,
        \"unit_price\": 200
      },
      {
        \"product_id\": \"$HAMBURGUER_ID\",
        \"name\": \"Hambúrguer Artesanal\",
        \"quantity\": 1,
        \"unit_price\": 1800
      }
    ],
    \"p_payment_method\": \"cash\",
    \"p_sync_metadata\": {
      \"origin\": \"CAIXA\"
    }
  }")

echo "📋 Resposta: $RESPONSE"

ORDER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ -n "$ORDER_ID" ]; then
  echo "✅ Pedido criado: $ORDER_ID"
  echo ""
  echo "🔍 Verificando itens do pedido:"
  docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core <<SQL
SELECT 
  oi.name_snapshot,
  oi.prep_time_seconds,
  oi.station,
  oi.prep_category
FROM gm_order_items oi
WHERE oi.order_id = '$ORDER_ID'
ORDER BY oi.station;
SQL
else
  echo "❌ Erro ao criar pedido"
fi
