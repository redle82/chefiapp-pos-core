#!/bin/bash

# =============================================================================
# Criar Pedidos de Todas as Origens para Teste
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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
echo -e "${BLUE}Criando Pedidos de Todas as Origens${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Restaurante: $RESTAURANT_ID"
echo "Mesa: $TABLE_NUMBER"
echo "Produto: $PRODUCT_ID"
echo ""

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
    
    local response=$(curl -s -X POST "http://localhost:3001/rest/v1/rpc/create_order_atomic" \
        -H "Content-Type: application/json" \
        -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
        -d "{
            \"p_restaurant_id\": \"$RESTAURANT_ID\",
            \"p_items\": $items_json,
            \"p_payment_method\": \"cash\",
            \"p_sync_metadata\": $sync_metadata
        }")
    
    if echo "$response" | grep -q '"id"'; then
        local order_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}✅ $origin${NC} - Pedido: $order_id"
        return 0
    else
        if echo "$response" | grep -q "TABLE_HAS_ACTIVE_ORDER"; then
            echo -e "${BLUE}ℹ️  $origin${NC} - Mesa já tem pedido aberto (adicionando item...)"
            # TODO: Implementar adicionar item ao pedido existente
            return 1
        else
            echo -e "${RED}❌ $origin${NC} - Erro: $response"
            return 1
        fi
    fi
}

# Obter mesas diferentes para evitar constraint
TABLES=($(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT number FROM gm_tables WHERE restaurant_id = '$RESTAURANT_ID' ORDER BY number LIMIT 6;" | xargs))

TABLE_INDEX=0

# Criar pedidos
echo "Criando pedidos..."
echo ""

# 1. QR Mesa (múltiplos dispositivos)
echo "1. QR Mesa (Dispositivo 1)..."
create_order "QR_MESA" "QR_MESA" "qr-device-1-$(date +%s)" "device-qr-1" "${TABLES[$TABLE_INDEX]}"
((TABLE_INDEX++))

sleep 1

echo "2. QR Mesa (Dispositivo 2)..."
create_order "QR_MESA" "QR_MESA" "qr-device-2-$(date +%s)" "device-qr-2" "${TABLES[$TABLE_INDEX]}"
((TABLE_INDEX++))

sleep 1

# 3. Web Pública
echo "3. Web Pública..."
create_order "WEB_PUBLIC" "WEB_PUBLIC" "web-user-$(date +%s)" "" "${TABLES[$TABLE_INDEX]}"
((TABLE_INDEX++))

sleep 1

# 4. TPV Caixa
echo "4. TPV Caixa..."
create_order "TPV" "cashier" "tpv-user-$(date +%s)" "" "${TABLES[$TABLE_INDEX]}"
((TABLE_INDEX++))

sleep 1

# 5. AppStaff (waiter)
echo "5. AppStaff (waiter)..."
create_order "APPSTAFF" "waiter" "waiter-$(date +%s)" "" "${TABLES[$TABLE_INDEX]}"
((TABLE_INDEX++))

sleep 1

# 6. AppStaff (manager)
echo "6. AppStaff (manager)..."
create_order "APPSTAFF_MANAGER" "manager" "manager-$(date +%s)" "" "${TABLES[$TABLE_INDEX]}"
((TABLE_INDEX++))

sleep 1

# 7. AppStaff (owner)
echo "7. AppStaff (owner)..."
if [ $TABLE_INDEX -lt ${#TABLES[@]} ]; then
    create_order "APPSTAFF_OWNER" "owner" "owner-$(date +%s)" "" "${TABLES[$TABLE_INDEX]}"
else
    echo -e "${BLUE}ℹ️  AppStaff (owner)${NC} - Sem mesa disponível (usar mesa existente)"
    create_order "APPSTAFF_OWNER" "owner" "owner-$(date +%s)" "" "${TABLES[0]}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "✅ Pedidos criados!"
echo ""
echo "Verificar pedidos:"
echo "  docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \"SELECT id, origin, status, table_number FROM gm_orders WHERE sync_metadata->>'test' = 'true' ORDER BY created_at DESC;\""
echo ""
echo "Verificar autoria:"
echo "  docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \"SELECT oi.name_snapshot, oi.created_by_role, oi.created_by_user_id, o.origin FROM gm_order_items oi JOIN gm_orders o ON oi.order_id = o.id WHERE o.sync_metadata->>'test' = 'true';\""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
