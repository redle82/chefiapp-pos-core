#!/bin/bash
# =============================================================================
# Criar Pedidos de Todas as Origens Possíveis
# =============================================================================
# Cria um pedido para cada origem suportada pelo sistema
# =============================================================================

set -e

echo "📦 Criando Pedidos de Todas as Origens"
echo "========================================"
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

# URL do PostgREST
POSTGREST_URL="http://localhost:3001"
API_KEY="chefiapp-core-secret-key-min-32-chars-long"

# Definir todas as origens possíveis
ORIGINS=(
    "CAIXA"
    "TPV"
    "WEB"
    "WEB_PUBLIC"
    "GARCOM"
    "MOBILE"
    "APPSTAFF"
    "QR_MESA"
)

# Função para obter descrição da origem
get_origin_desc() {
    case "$1" in
        "CAIXA") echo "💰 CAIXA (Verde)" ;;
        "TPV") echo "💰 TPV/CAIXA (Verde)" ;;
        "WEB") echo "🌐 WEB (Laranja)" ;;
        "WEB_PUBLIC") echo "🌐 WEB PÚBLICO (Laranja)" ;;
        "GARCOM") echo "📱 GARÇOM (Azul)" ;;
        "MOBILE") echo "📱 MOBILE/GARÇOM (Azul)" ;;
        "APPSTAFF") echo "👤 APPSTAFF (Roxo)" ;;
        "QR_MESA") echo "📋 QR MESA (Rosa)" ;;
        *) echo "❓ $1" ;;
    esac
}

# Contador de mesa
TABLE_NUMBER=1
SUCCESS_COUNT=0
FAIL_COUNT=0

echo "🚀 Criando pedidos para todas as origens..."
echo ""

# Criar pedido para cada origem
for ORIGIN in "${ORIGINS[@]}"; do
    ORIGIN_DESC=$(get_origin_desc "$ORIGIN")
    
    echo "📝 Criando pedido: $ORIGIN_DESC"
    
    # Criar pedido
    RESPONSE=$(curl -s -X POST "${POSTGREST_URL}/rest/v1/rpc/create_order_atomic" \
      -H "apikey: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -d "{
        \"p_restaurant_id\": \"${RESTAURANT_ID}\",
        \"p_items\": [{
          \"product_id\": \"${PRODUCT_ID}\",
          \"name\": \"Teste ${ORIGIN}\",
          \"quantity\": 1,
          \"unit_price\": 1000
        }],
        \"p_payment_method\": \"cash\",
        \"p_sync_metadata\": {
          \"origin\": \"${ORIGIN}\",
          \"table_number\": ${TABLE_NUMBER}
        }
      }")
    
    ORDER_ID=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null || echo "")
    
    if [ -z "$ORDER_ID" ]; then
        echo "   ❌ Erro ao criar pedido"
        echo "   Resposta: $RESPONSE"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    else
        echo "   ✅ Pedido criado: ${ORDER_ID:0:8}... (Mesa $TABLE_NUMBER)"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
    
    TABLE_NUMBER=$((TABLE_NUMBER + 1))
    echo ""
    
    # Pequeno delay entre pedidos
    sleep 0.5
done

echo "========================================"
echo "📊 Resumo:"
echo "   ✅ Sucessos: $SUCCESS_COUNT"
echo "   ❌ Falhas: $FAIL_COUNT"
echo ""

# Verificar pedidos criados
echo "📋 Verificando pedidos criados:"
echo ""

docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    table_number,
    status,
    (sync_metadata->>'origin') as origin,
    created_at
FROM gm_orders
WHERE restaurant_id = '${RESTAURANT_ID}'
  AND status = 'OPEN'
  AND (sync_metadata->>'origin') IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
"

echo ""
echo "✅ Teste concluído!"
echo ""
echo "💡 Agora abra o KDS em http://localhost:5173/kds-minimal"
echo "   Você deve ver pedidos com badges de todas as origens:"
echo "   - 💰 CAIXA/TPV (verde)"
echo "   - 🌐 WEB (laranja)"
echo "   - 📱 GARÇOM/MOBILE (azul)"
echo "   - 👤 APPSTAFF (roxo)"
echo "   - 📋 QR MESA (rosa)"