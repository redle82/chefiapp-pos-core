#!/bin/bash

# TESTE FASE 3 — ORIGEM DO PEDIDO
# Objetivo: Validar que origem do pedido aparece corretamente no KDS

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 3 — ORIGEM DO PEDIDO"
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

# 3. Obter produto para criar pedidos
echo ""
echo "3️⃣ Obtendo produto..."
PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$PRODUCT_ID" ]; then
    echo "⚠️  AVISO: Nenhum produto encontrado. Criando produto de teste..."
    PRODUCT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
        "INSERT INTO gm_products (id, restaurant_id, name, price_cents, active) VALUES (gen_random_uuid(), '$RESTAURANT_ID', 'Produto Teste', 1000, true) RETURNING id;" 2>/dev/null || echo "")
fi

if [ -z "$PRODUCT_ID" ]; then
    echo "❌ ERRO: Não foi possível obter/criar produto"
    exit 1
fi
echo "✅ Produto: $PRODUCT_ID"

# 4. Limpar pedidos OPEN existentes
echo ""
echo "4️⃣ Limpando pedidos OPEN existentes..."
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
    "UPDATE gm_orders SET status = 'CLOSED', payment_status = 'PAID' WHERE restaurant_id = '$RESTAURANT_ID' AND status = 'OPEN';" > /dev/null 2>&1
echo "✅ Pedidos OPEN fechados"

# 5. Criar pedidos com origens diferentes
echo ""
echo "5️⃣ Criando pedidos com origens diferentes..."

# Pedido 1: CAIXA
echo "   Criando pedido CAIXA..."
CAIXA_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste CAIXA",
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
CAIXA_RESPONSE=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
    -H "Content-Type: application/json" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -d "$CAIXA_PAYLOAD" 2>&1)
CAIXA_ORDER_ID=$(echo "$CAIXA_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
if [ -n "$CAIXA_ORDER_ID" ] && [ "$CAIXA_ORDER_ID" != "null" ]; then
    echo "   ✅ Pedido CAIXA criado: $CAIXA_ORDER_ID"
else
    echo "   ❌ ERRO ao criar pedido CAIXA"
    echo "$CAIXA_RESPONSE" | head -3
    exit 1
fi

# Pedido 2: WEB
echo "   Criando pedido WEB..."
WEB_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste WEB",
      "quantity": 1,
      "unit_price": 1500
    }
  ],
  "p_payment_method": "cash",
  "p_sync_metadata": {
    "origin": "WEB"
  }
}
EOF
)
WEB_RESPONSE=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
    -H "Content-Type: application/json" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -d "$WEB_PAYLOAD" 2>&1)
WEB_ORDER_ID=$(echo "$WEB_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
if [ -n "$WEB_ORDER_ID" ] && [ "$WEB_ORDER_ID" != "null" ]; then
    echo "   ✅ Pedido WEB criado: $WEB_ORDER_ID"
else
    echo "   ❌ ERRO ao criar pedido WEB"
    echo "$WEB_RESPONSE" | head -3
    exit 1
fi

# Pedido 3: QR_MESA
echo "   Criando pedido QR_MESA..."
QR_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste QR_MESA",
      "quantity": 1,
      "unit_price": 2000
    }
  ],
  "p_payment_method": "cash",
  "p_sync_metadata": {
    "origin": "QR_MESA"
  }
}
EOF
)
QR_RESPONSE=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
    -H "Content-Type: application/json" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -d "$QR_PAYLOAD" 2>&1)
QR_ORDER_ID=$(echo "$QR_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
if [ -n "$QR_ORDER_ID" ] && [ "$QR_ORDER_ID" != "null" ]; then
    echo "   ✅ Pedido QR_MESA criado: $QR_ORDER_ID"
else
    echo "   ❌ ERRO ao criar pedido QR_MESA"
    echo "$QR_RESPONSE" | head -3
    exit 1
fi

# 6. Validar origens no banco
echo ""
echo "6️⃣ Validando origens no banco..."

CAIXA_ORIGIN=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT sync_metadata->>'origin' FROM gm_orders WHERE id = '$CAIXA_ORDER_ID';" 2>/dev/null || echo "")
WEB_ORIGIN=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT sync_metadata->>'origin' FROM gm_orders WHERE id = '$WEB_ORDER_ID';" 2>/dev/null || echo "")
QR_ORIGIN=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT sync_metadata->>'origin' FROM gm_orders WHERE id = '$QR_ORDER_ID';" 2>/dev/null || echo "")

if [ "$CAIXA_ORIGIN" = "CAIXA" ]; then
    echo "   ✅ Pedido CAIXA tem origem correta: $CAIXA_ORIGIN"
else
    echo "   ❌ ERRO: Pedido CAIXA tem origem incorreta: $CAIXA_ORIGIN (esperado: CAIXA)"
    exit 1
fi

if [ "$WEB_ORIGIN" = "WEB" ]; then
    echo "   ✅ Pedido WEB tem origem correta: $WEB_ORIGIN"
else
    echo "   ❌ ERRO: Pedido WEB tem origem incorreta: $WEB_ORIGIN (esperado: WEB)"
    exit 1
fi

if [ "$QR_ORIGIN" = "QR_MESA" ]; then
    echo "   ✅ Pedido QR_MESA tem origem correta: $QR_ORIGIN"
else
    echo "   ❌ ERRO: Pedido QR_MESA tem origem incorreta: $QR_ORIGIN (esperado: QR_MESA)"
    exit 1
fi

# 7. Verificar frontend
echo ""
echo "7️⃣ Verificando frontend..."
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/ 2>/dev/null || echo "000")

if [ "$FRONTEND_OK" = "200" ]; then
    echo "✅ Frontend rodando"
    echo ""
    echo "📋 INSTRUÇÕES PARA TESTE MANUAL:"
    echo "   1. Abra: http://localhost:5175/kds-minimal"
    echo "   2. Verifique que aparecem 3 pedidos:"
    echo "      - Pedido CAIXA (badge verde 💰)"
    echo "      - Pedido WEB (badge laranja 🌐)"
    echo "      - Pedido QR_MESA (badge rosa 📋)"
    echo "   3. Verifique que cada badge mostra a origem correta"
else
    echo "⚠️  AVISO: Frontend não está rodando (porta 5175)"
fi

# 8. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 3 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Origem do pedido validada:"
echo "  ✅ Pedidos criados com origens diferentes"
echo "  ✅ Origens corretas no banco"
echo "  ✅ CAIXA: $CAIXA_ORIGIN"
echo "  ✅ WEB: $WEB_ORIGIN"
echo "  ✅ QR_MESA: $QR_ORIGIN"
if [ "$FRONTEND_OK" = "200" ]; then
    echo ""
    echo "  📋 TESTE MANUAL NECESSÁRIO:"
    echo "     Abra http://localhost:5175/kds-minimal e verifique badges de origem"
fi
echo ""
echo "Pronto para FASE 4 — Timer do Pedido"
echo ""
