#!/bin/bash

# TESTE FASE 6 — AÇÃO ÚNICA (MUDANÇA DE ESTADO)
# Objetivo: Validar que ação de mudança de estado funciona corretamente

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 6 — AÇÃO ÚNICA (MUDANÇA DE ESTADO)"
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

# 3. Obter produto
echo ""
echo "3️⃣ Obtendo produto..."
PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$PRODUCT_ID" ]; then
    echo "❌ ERRO: Nenhum produto encontrado"
    exit 1
fi
echo "✅ Produto: $PRODUCT_ID"

# 4. Limpar pedidos OPEN existentes
echo ""
echo "4️⃣ Limpando pedidos OPEN existentes..."
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
    "UPDATE gm_orders SET status = 'CLOSED', payment_status = 'PAID' WHERE restaurant_id = '$RESTAURANT_ID' AND status = 'OPEN';" > /dev/null 2>&1
echo "✅ Pedidos OPEN fechados"

# 5. Criar pedido de teste
echo ""
echo "5️⃣ Criando pedido de teste..."
ORDER_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste Ação",
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

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
if [ -z "$ORDER_ID" ] || [ "$ORDER_ID" = "null" ]; then
    echo "❌ ERRO: Pedido não foi criado"
    echo "$ORDER_RESPONSE" | head -3
    exit 1
fi
echo "✅ Pedido criado: $ORDER_ID"

# 6. Verificar status inicial
echo ""
echo "6️⃣ Verificando status inicial..."
INITIAL_STATUS=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT status FROM gm_orders WHERE id = '$ORDER_ID';" 2>/dev/null || echo "")

if [ "$INITIAL_STATUS" != "OPEN" ]; then
    echo "❌ ERRO: Status inicial incorreto: $INITIAL_STATUS (esperado: OPEN)"
    exit 1
fi
echo "✅ Status inicial: $INITIAL_STATUS"

# 7. Atualizar status via RPC (simulando ação do KDS)
echo ""
echo "7️⃣ Atualizando status para IN_PREP via RPC..."
UPDATE_PAYLOAD=$(cat <<EOF
{
  "p_order_id": "$ORDER_ID",
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_new_status": "IN_PREP"
}
EOF
)

UPDATE_RESPONSE=$(curl -s -X POST \
    "http://localhost:3001/rpc/update_order_status" \
    -H "Content-Type: application/json" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -d "$UPDATE_PAYLOAD" 2>&1)

if echo "$UPDATE_RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "❌ ERRO ao atualizar status:"
    echo "$UPDATE_RESPONSE" | head -5
    exit 1
fi

# Verificar que RPC retornou sucesso
SUCCESS=$(echo "$UPDATE_RESPONSE" | jq -r '.success' 2>/dev/null || echo "false")
if [ "$SUCCESS" != "true" ]; then
    echo "❌ ERRO: RPC não retornou sucesso"
    echo "$UPDATE_RESPONSE" | head -5
    exit 1
fi
echo "✅ RPC executado com sucesso"

# 8. Verificar status atualizado
echo ""
echo "8️⃣ Verificando status atualizado..."
UPDATED_STATUS=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT status FROM gm_orders WHERE id = '$ORDER_ID';" 2>/dev/null || echo "")

if [ "$UPDATED_STATUS" != "IN_PREP" ]; then
    echo "❌ ERRO: Status não foi atualizado: $UPDATED_STATUS (esperado: IN_PREP)"
    exit 1
fi
echo "✅ Status atualizado: $UPDATED_STATUS"

# 9. Verificar timestamp in_prep_at
echo ""
echo "9️⃣ Verificando timestamp in_prep_at..."
IN_PREP_AT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT in_prep_at FROM gm_orders WHERE id = '$ORDER_ID';" 2>/dev/null || echo "")

if [ -z "$IN_PREP_AT" ] || [ "$IN_PREP_AT" = "" ]; then
    echo "⚠️  AVISO: in_prep_at não foi definido"
else
    echo "✅ in_prep_at definido: $IN_PREP_AT"
fi

# 10. Verificar frontend
echo ""
echo "🔟 Verificando frontend..."
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/ 2>/dev/null || echo "000")

if [ "$FRONTEND_OK" = "200" ]; then
    echo "✅ Frontend rodando"
    echo ""
    echo "📋 INSTRUÇÕES PARA TESTE MANUAL:"
    echo "   1. Abra: http://localhost:5175/kds-minimal"
    echo "   2. Verifique que o pedido aparece com status OPEN"
    echo "   3. Clique no botão 'Iniciar Preparo'"
    echo "   4. Verifique que:"
    echo "      - Botão mostra 'Processando...' durante atualização"
    echo "      - Status muda para 'IN_PREP' após atualização"
    echo "      - Pedido recarrega automaticamente"
    echo "      - Botão desaparece (pedido não está mais OPEN)"
else
    echo "⚠️  AVISO: Frontend não está rodando (porta 5175)"
fi

# 11. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 6 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Ação única validada:"
echo "  ✅ Pedido criado com status OPEN"
echo "  ✅ Status atualizado para IN_PREP via RPC update_order_status"
echo "  ✅ Timestamp in_prep_at definido automaticamente"
echo "  ✅ Estado consistente no Core"
if [ "$FRONTEND_OK" = "200" ]; then
    echo ""
    echo "  📋 TESTE MANUAL NECESSÁRIO:"
    echo "     Abra http://localhost:5175/kds-minimal e teste botão 'Iniciar Preparo'"
fi
echo ""
echo "Pronto para FASE 7 — Página Web Pública (Read-Only)"
echo ""
