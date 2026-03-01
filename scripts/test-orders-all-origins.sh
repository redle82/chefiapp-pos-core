#!/bin/bash
# =============================================================================
# Script de Teste de Pedidos - Todas as Origens
# =============================================================================
# Cria pedidos de teste em diferentes origens e valida no KDS
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "═══════════════════════════════════════════════════════════"
echo "  🧪 Teste de Pedidos - Todas as Origens"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se serviços estão rodando
echo "1️⃣  Verificando Serviços..."
echo ""

if ! docker ps --filter "name=chefiapp-core-postgres" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "  ${RED}❌ Postgres não está rodando${NC}"
    exit 1
fi

if ! docker ps --filter "name=chefiapp-core-postgrest" --format "{{.Status}}" | grep -q "Up"; then
    echo -e "  ${RED}❌ PostgREST não está rodando${NC}"
    exit 1
fi

if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "  ${RED}❌ PostgREST não responde${NC}"
    exit 1
fi

echo -e "  ${GREEN}✅ Serviços rodando${NC}"
echo ""

# Obter dados necessários
echo "2️⃣  Obtendo Dados do Banco..."
echo ""

RESTAURANT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT id FROM gm_restaurants LIMIT 1" 2>/dev/null || echo "")

if [ -z "$RESTAURANT_ID" ]; then
    echo -e "  ${RED}❌ Nenhum restaurante encontrado${NC}"
    exit 1
fi

echo -e "  ${GREEN}✅ Restaurante: ${RESTAURANT_ID:0:8}...${NC}"

# Obter produtos
PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1" 2>/dev/null || echo "")

if [ -z "$PRODUCT_ID" ]; then
    echo -e "  ${RED}❌ Nenhum produto encontrado${NC}"
    exit 1
fi

echo -e "  ${GREEN}✅ Produto: ${PRODUCT_ID:0:8}...${NC}"

# Obter mesa
TABLE_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT id FROM gm_tables WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1" 2>/dev/null || echo "")

if [ -z "$TABLE_ID" ]; then
    echo -e "  ${RED}❌ Nenhuma mesa encontrada${NC}"
    exit 1
fi

TABLE_NUMBER=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT number FROM gm_tables WHERE id = '$TABLE_ID'" 2>/dev/null || echo "1")

echo -e "  ${GREEN}✅ Mesa: $TABLE_NUMBER${NC}"
echo ""

# Preparar payload do pedido
ORDER_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste",
      "quantity": 1,
      "unit_price": 1000
    }
  ],
  "p_payment_method": "cash",
  "p_sync_metadata": {
    "origin": "TEST",
    "test_type": "automated",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
)

# Função para criar pedido via RPC
create_order() {
    local origin="$1"
    local table_id="$2"
    local table_number="$3"

    local payload=$(echo "$ORDER_PAYLOAD" | jq --arg origin "$origin" --arg table_id "$table_id" --arg table_number "$table_number" \
        '.p_sync_metadata.origin = $origin |
         if $table_id != "" then .p_sync_metadata.table_id = $table_id else . end |
         if $table_number != "" then .p_sync_metadata.table_number = $table_number else . end')

    local response=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer chefiapp-core-secret-key-min-32-chars-long" \
        -d "$payload" 2>&1)

    echo "$response"
}

# Função para verificar pedido no banco
check_order() {
    local origin="$1"

    docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
        "SELECT COUNT(*) FROM gm_orders WHERE origin = '$origin' AND created_at > NOW() - INTERVAL '5 minutes';" 2>/dev/null || echo "0"
}

echo "3️⃣  Criando Pedidos de Teste..."
echo ""

# Teste 1: Pedido via TPV (CAIXA)
echo -n "  Testando origem CAIXA... "
RESPONSE=$(create_order "CAIXA" "" "")
if echo "$RESPONSE" | grep -q "order_id\|id"; then
    echo -e "${GREEN}✅ Criado${NC}"
    sleep 1
    COUNT=$(check_order "CAIXA")
    if [ "$COUNT" -gt 0 ]; then
        echo -e "    ${GREEN}✅ Verificado no banco${NC}"
    else
        echo -e "    ${YELLOW}⚠️  Não encontrado no banco${NC}"
    fi
else
    echo -e "${RED}❌ Falhou${NC}"
    echo "    Resposta: $RESPONSE"
fi
echo ""

# Teste 2: Pedido via Web (WEB_PUBLIC)
echo -n "  Testando origem WEB_PUBLIC... "
RESPONSE=$(create_order "WEB_PUBLIC" "" "")
if echo "$RESPONSE" | grep -q "order_id\|id"; then
    echo -e "${GREEN}✅ Criado${NC}"
    sleep 1
    COUNT=$(check_order "WEB_PUBLIC")
    if [ "$COUNT" -gt 0 ]; then
        echo -e "    ${GREEN}✅ Verificado no banco${NC}"
    else
        echo -e "    ${YELLOW}⚠️  Não encontrado no banco${NC}"
    fi
else
    echo -e "${RED}❌ Falhou${NC}"
    echo "    Resposta: $RESPONSE"
fi
echo ""

# Teste 3: Pedido via QR Mesa (QR_MESA)
echo -n "  Testando origem QR_MESA... "
RESPONSE=$(create_order "QR_MESA" "$TABLE_ID" "$TABLE_NUMBER")
if echo "$RESPONSE" | grep -q "order_id\|id"; then
    echo -e "${GREEN}✅ Criado${NC}"
    sleep 1
    COUNT=$(check_order "QR_MESA")
    if [ "$COUNT" -gt 0 ]; then
        echo -e "    ${GREEN}✅ Verificado no banco${NC}"
    else
        echo -e "    ${YELLOW}⚠️  Não encontrado no banco${NC}"
    fi
else
    echo -e "${RED}❌ Falhou${NC}"
    echo "    Resposta: $RESPONSE"
fi
echo ""

# Teste 4: Pedido via Garçom (GARÇOM)
echo -n "  Testando origem GARÇOM... "
RESPONSE=$(create_order "GARÇOM" "$TABLE_ID" "$TABLE_NUMBER")
if echo "$RESPONSE" | grep -q "order_id\|id"; then
    echo -e "${GREEN}✅ Criado${NC}"
    sleep 1
    COUNT=$(check_order "GARÇOM")
    if [ "$COUNT" -gt 0 ]; then
        echo -e "    ${GREEN}✅ Verificado no banco${NC}"
    else
        echo -e "    ${YELLOW}⚠️  Não encontrado no banco${NC}"
    fi
else
    echo -e "${RED}❌ Falhou${NC}"
    echo "    Resposta: $RESPONSE"
fi
echo ""

# Resumo
echo "4️⃣  Resumo dos Pedidos Criados..."
echo ""

TOTAL_CAIXA=$(check_order "CAIXA")
TOTAL_WEB=$(check_order "WEB_PUBLIC")
TOTAL_QR=$(check_order "QR_MESA")
TOTAL_GARCOM=$(check_order "GARÇOM")

echo -e "  ${BLUE}Origem CAIXA:${NC}     $TOTAL_CAIXA pedido(s)"
echo -e "  ${BLUE}Origem WEB_PUBLIC:${NC} $TOTAL_WEB pedido(s)"
echo -e "  ${BLUE}Origem QR_MESA:${NC}    $TOTAL_QR pedido(s)"
echo -e "  ${BLUE}Origem GARÇOM:${NC}     $TOTAL_GARCOM pedido(s)"
echo ""

# Verificar no KDS
echo "5️⃣  Verificando Pedidos no Banco..."
echo ""

RECENT_ORDERS=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT origin, COUNT(*) FROM gm_orders WHERE created_at > NOW() - INTERVAL '5 minutes' GROUP BY origin;" 2>/dev/null || echo "")

if [ -n "$RECENT_ORDERS" ]; then
    echo "$RECENT_ORDERS" | while IFS='|' read -r origin count; do
        if [ -n "$origin" ]; then
            echo -e "  ${GREEN}✅ $origin: $count pedido(s)${NC}"
        fi
    done
else
    echo -e "  ${YELLOW}⚠️  Nenhum pedido recente encontrado${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Próximos Passos"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "  ${BLUE}1. Abrir KDS:${NC} http://localhost:5175/app/kds"
echo -e "  ${BLUE}2. Verificar que pedidos aparecem com origens corretas:${NC}"
echo -e "     - CAIXA 💰 (verde)"
echo -e "     - WEB 🌐 (laranja)"
echo -e "     - QR MESA 📱 (rosa)"
echo -e "     - GARÇOM 📱 (azul)"
echo ""
echo -e "  ${BLUE}3. Verificar sincronização em tempo real:${NC}"
echo -e "     - Pedidos devem aparecer automaticamente (sem refresh)"
echo -e "     - Status deve ser 'NOVO' (dourado)"
echo ""
echo ""
