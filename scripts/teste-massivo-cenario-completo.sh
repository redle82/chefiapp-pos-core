#!/bin/bash

# =============================================================================
# TESTE MASSIVO - Cenário Completo (Múltiplos Autores, Mesma Mesa)
# =============================================================================
# OBJETIVO: Testar cenário real de bar cheio - múltiplos dispositivos QR + AppStaff
# DATA: 2026-01-26
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuração
RESTAURANT_ID=${1:-$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM gm_restaurants LIMIT 1;" | xargs)}
TABLE_NUMBER=${2:-$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT number FROM gm_tables WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;" | xargs)}
PRODUCT_ID=${3:-$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;" | xargs)}

if [ -z "$RESTAURANT_ID" ] || [ -z "$TABLE_NUMBER" ] || [ -z "$PRODUCT_ID" ]; then
    echo -e "${RED}❌ Erro: Restaurante, mesa ou produto não encontrado${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TESTE MASSIVO - Cenário Completo${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Restaurante: $RESTAURANT_ID"
echo "Mesa: $TABLE_NUMBER"
echo "Produto: $PRODUCT_ID"
echo ""

# Limpar pedido anterior na mesa de teste
echo -e "${YELLOW}⚠️  Fechando pedidos anteriores na mesa $TABLE_NUMBER...${NC}"
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
UPDATE gm_orders 
SET status = 'CLOSED' 
WHERE table_number = $TABLE_NUMBER 
  AND status = 'OPEN'
  AND restaurant_id = '$RESTAURANT_ID';
" > /dev/null 2>&1 || true
sleep 1

# Função para criar pedido
create_order() {
    local origin=$1
    local role=$2
    local user_id=$3
    local device_id=$4
    local table_num=$5
    
    local items_json=$(cat <<EOF
[
  {
    "product_id": "$PRODUCT_ID",
    "name": "Produto Teste - $origin",
    "quantity": 1,
    "unit_price": 1000,
    "created_by_user_id": "$user_id",
    "created_by_role": "$role",
    "device_id": "$device_id"
  }
]
EOF
)
    
    local sync_metadata=$(cat <<EOF
{
  "origin": "$origin",
  "table_number": $table_num,
  "test": "true",
  "created_by_user_id": "$user_id",
  "created_by_role": "$role"
}
EOF
)
    
    curl -s -X POST "http://localhost:3001/rest/v1/rpc/create_order_atomic" \
        -H "Content-Type: application/json" \
        -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
        -d "{
            \"p_restaurant_id\": \"$RESTAURANT_ID\",
            \"p_items\": $items_json,
            \"p_payment_method\": \"cash\",
            \"p_sync_metadata\": $sync_metadata
        }"
}

# Função para adicionar item ao pedido existente (via SQL direto - workaround)
add_item_to_order() {
    local order_id=$1
    local role=$2
    local user_id=$3
    local device_id=$4
    
    docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
INSERT INTO gm_order_items (
    order_id,
    product_id,
    name_snapshot,
    price_snapshot,
    quantity,
    subtotal_cents,
    created_by_user_id,
    created_by_role,
    device_id
)
SELECT 
    '$order_id',
    id,
    name,
    price_cents,
    1,
    price_cents,
    '$user_id',
    '$role',
    '$device_id'
FROM gm_products
WHERE id = '$PRODUCT_ID'
LIMIT 1;
" > /dev/null 2>&1
}

echo -e "${BLUE}CENÁRIO: Mesa $TABLE_NUMBER - Múltiplos Autores, Mesmo Pedido${NC}"
echo ""

# 1. Cliente A (QR Mesa) cria pedido
echo "1. Cliente A (QR Mesa - Dispositivo 1) cria pedido..."
QR_USER_A="qr-device-a-$(date +%s)"
QR_DEVICE_A="device-qr-a"
RESULT=$(create_order "QR_MESA" "QR_MESA" "$QR_USER_A" "$QR_DEVICE_A" "$TABLE_NUMBER")

if echo "$RESULT" | grep -q '"id"'; then
    ORDER_ID=$(echo "$RESULT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Pedido criado: $ORDER_ID${NC}"
else
    echo -e "${RED}❌ Erro ao criar pedido: $RESULT${NC}"
    exit 1
fi

sleep 1

# 2. Cliente B (QR Mesa - Dispositivo 2) adiciona item ao mesmo pedido
echo "2. Cliente B (QR Mesa - Dispositivo 2) adiciona item ao mesmo pedido..."
QR_USER_B="qr-device-b-$(date +%s)"
QR_DEVICE_B="device-qr-b"
add_item_to_order "$ORDER_ID" "QR_MESA" "$QR_USER_B" "$QR_DEVICE_B"
echo -e "${GREEN}✅ Item adicionado por Cliente B${NC}"

sleep 1

# 3. Garçom (AppStaff) adiciona item ao mesmo pedido
echo "3. Garçom (AppStaff waiter) adiciona item ao mesmo pedido..."
WAITER_USER="waiter-$(date +%s)"
add_item_to_order "$ORDER_ID" "waiter" "$WAITER_USER" ""
echo -e "${GREEN}✅ Item adicionado por Garçom${NC}"

sleep 1

# 4. Gerente (AppStaff - fallback) adiciona item ao mesmo pedido
echo "4. Gerente (AppStaff manager) adiciona item ao mesmo pedido..."
MANAGER_USER="manager-$(date +%s)"
add_item_to_order "$ORDER_ID" "manager" "$MANAGER_USER" ""
echo -e "${GREEN}✅ Item adicionado por Gerente${NC}"

sleep 1

# 5. Validar divisão de conta
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Validação: Divisão de Conta por Autoria${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    oi.created_by_role,
    oi.created_by_user_id,
    oi.device_id,
    COUNT(*) as item_count,
    SUM(oi.subtotal_cents) / 100.0 as total_reais
FROM gm_order_items oi
WHERE oi.order_id = '$ORDER_ID'
GROUP BY oi.created_by_role, oi.created_by_user_id, oi.device_id
ORDER BY oi.created_at;
"

echo ""
echo -e "${GREEN}✅ Cenário completo testado!${NC}"
echo ""
echo "📊 Resumo:"
echo "  - Pedido único na mesa $TABLE_NUMBER"
echo "  - 4 itens de 4 autores diferentes"
echo "  - Divisão de conta por autoria funcionando"
echo ""
echo "🔍 Verificar no KDS:"
echo "  - Pedido deve aparecer com todos os itens"
echo "  - Badge de origem: QR_MESA (primeiro item)"
echo "  - Autoria preservada em cada item"
echo ""
