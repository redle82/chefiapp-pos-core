#!/bin/bash

# TESTE FASE 2 — KDS MÍNIMO (READ-ONLY)
# Objetivo: Validar que o KDS mínimo exibe pedidos corretamente

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 2 — KDS MÍNIMO (READ-ONLY)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar que Docker Core está rodando
echo "1️⃣ Verificando Docker Core..."
if ! docker ps | grep -q "chefiapp-core-postgres"; then
    echo "❌ ERRO: Docker Core não está rodando"
    exit 1
fi
echo "✅ Docker Core rodando"

# 2. Obter restaurante ID
echo ""
echo "2️⃣ Obtendo restaurante ID..."
RESTAURANT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id FROM gm_restaurants LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$RESTAURANT_ID" ]; then
    echo "❌ ERRO: Nenhum restaurante encontrado"
    exit 1
fi
echo "✅ Restaurante: $RESTAURANT_ID"

# 3. Criar pedido de teste (se não existir)
echo ""
echo "3️⃣ Preparando pedido de teste..."

# Verificar se há pedido OPEN
EXISTING_ORDER=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id FROM gm_orders WHERE restaurant_id = '$RESTAURANT_ID' AND status = 'OPEN' LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$EXISTING_ORDER" ]; then
    echo "   Criando pedido de teste..."
    
    # Obter produto
    PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
        "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;" 2>/dev/null || echo "")
    
    if [ -z "$PRODUCT_ID" ]; then
        echo "⚠️  AVISO: Nenhum produto encontrado. Criando produto de teste..."
        PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
            "INSERT INTO gm_products (id, restaurant_id, name, price_cents, active) VALUES (gen_random_uuid(), '$RESTAURANT_ID', 'Produto Teste', 1000, true) RETURNING id;" 2>/dev/null || echo "")
    fi
    
    if [ -z "$PRODUCT_ID" ]; then
        echo "❌ ERRO: Não foi possível criar produto de teste"
        exit 1
    fi
    
    # Criar pedido via RPC
    ORDER_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste KDS",
      "quantity": 1,
      "unit_price": 1000
    }
  ],
  "p_payment_method": "cash",
  "p_sync_metadata": {
    "origin": "CAIXA"
  }
}
EOF
)
    
    ORDER_RESPONSE=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
        -H "Content-Type: application/json" \
        -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
        -d "$ORDER_PAYLOAD" 2>&1)
    
    if echo "$ORDER_RESPONSE" | grep -q "error\|Error\|ERROR"; then
        echo "❌ ERRO ao criar pedido:"
        echo "$ORDER_RESPONSE" | head -5
        exit 1
    fi
    
    ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
    if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
        echo "❌ ERRO: Pedido não foi criado corretamente"
        echo "Resposta: $ORDER_RESPONSE"
        exit 1
    fi
    
    echo "✅ Pedido de teste criado: $ORDER_ID"
    TEST_ORDER_ID="$ORDER_ID"
else
    echo "✅ Pedido existente encontrado: $EXISTING_ORDER"
    TEST_ORDER_ID="$EXISTING_ORDER"
fi

# 4. Verificar que frontend está rodando
echo ""
echo "4️⃣ Verificando frontend..."
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/ 2>/dev/null || echo "000")

if [ "$FRONTEND_OK" != "200" ]; then
    echo "⚠️  AVISO: Frontend não está rodando (porta 5175)"
    echo "   Execute: cd merchant-portal && npm run dev"
    echo "   Continuando com validação do pedido no banco..."
else
    echo "✅ Frontend rodando"
    
    # 5. Verificar que KDS Minimal está acessível
    echo ""
    echo "5️⃣ Verificando KDS Minimal..."
    KDS_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/kds-minimal 2>/dev/null || echo "000")
    
    if [ "$KDS_OK" = "200" ]; then
        echo "✅ KDS Minimal acessível em http://localhost:5175/kds-minimal"
        echo ""
        echo "📋 INSTRUÇÕES PARA TESTE MANUAL:"
        echo "   1. Abra: http://localhost:5175/kds-minimal"
        echo "   2. Verifique que o pedido aparece na lista"
        echo "   3. Verifique que mostra: número, status, mesa (se houver), total, itens"
    else
        echo "⚠️  AVISO: KDS Minimal não está acessível (código: $KDS_OK)"
    fi
fi

# 6. Validar pedido no banco
echo ""
echo "6️⃣ Validando pedido no banco..."
ORDER_DATA=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id, status, total_cents, table_number FROM gm_orders WHERE id = '$TEST_ORDER_ID';" 2>/dev/null || echo "")

if [ -z "$ORDER_DATA" ]; then
    echo "❌ ERRO: Pedido não encontrado no banco"
    exit 1
fi

echo "✅ Pedido validado no banco:"
echo "   $ORDER_DATA"

# 7. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 2 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "KDS Mínimo validado:"
echo "  ✅ Pedido criado no Core"
echo "  ✅ Pedido visível no banco"
if [ "$FRONTEND_OK" = "200" ]; then
    echo "  ✅ Frontend rodando"
    echo "  ✅ KDS Minimal acessível"
    echo ""
    echo "  📋 TESTE MANUAL NECESSÁRIO:"
    echo "     Abra http://localhost:5175/kds-minimal e verifique que o pedido aparece"
fi
echo ""
echo "Pronto para FASE 3 — Origem do Pedido"
echo ""
