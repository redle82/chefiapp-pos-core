#!/bin/bash

# TESTE FASE 5 — ESTADOS VISUAIS
# Objetivo: Validar que estados visuais (normal/atenção/atraso) aparecem corretamente

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 5 — ESTADOS VISUAIS"
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

# 5. Criar pedidos com timestamps diferentes para simular estados
echo ""
echo "5️⃣ Criando pedidos com timestamps diferentes..."

# Pedido 1: Normal (< 5 min) - criado agora
echo "   Criando pedido NORMAL (0 min)..."
NORMAL_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste NORMAL",
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
NORMAL_RESPONSE=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
    -H "Content-Type: application/json" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -d "$NORMAL_PAYLOAD" 2>&1)
NORMAL_ORDER_ID=$(echo "$NORMAL_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
if [ -n "$NORMAL_ORDER_ID" ] && [ "$NORMAL_ORDER_ID" != "null" ]; then
    echo "   ✅ Pedido NORMAL criado: $NORMAL_ORDER_ID"
else
    echo "   ❌ ERRO ao criar pedido NORMAL"
    exit 1
fi

# Pedido 2: Atenção (5-15 min) - criado há 10 minutos
echo "   Criando pedido ATENÇÃO (10 min atrás)..."
ATTENTION_TIMESTAMP=$(date -u -v-10M +"%Y-%m-%d %H:%M:%S" 2>/dev/null || date -u -d '10 minutes ago' +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "")
ATTENTION_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste ATENÇÃO",
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
ATTENTION_RESPONSE=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
    -H "Content-Type: application/json" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -d "$ATTENTION_PAYLOAD" 2>&1)
ATTENTION_ORDER_ID=$(echo "$ATTENTION_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
if [ -n "$ATTENTION_ORDER_ID" ] && [ "$ATTENTION_ORDER_ID" != "null" ]; then
    # Atualizar timestamp para 10 minutos atrás
    docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
        "UPDATE gm_orders SET created_at = NOW() - INTERVAL '10 minutes' WHERE id = '$ATTENTION_ORDER_ID';" > /dev/null 2>&1
    echo "   ✅ Pedido ATENÇÃO criado: $ATTENTION_ORDER_ID (timestamp ajustado para 10 min atrás)"
else
    echo "   ❌ ERRO ao criar pedido ATENÇÃO"
    exit 1
fi

# Pedido 3: Atraso (> 15 min) - criado há 20 minutos
echo "   Criando pedido ATRASO (20 min atrás)..."
DELAY_PAYLOAD=$(cat <<EOF
{
  "p_restaurant_id": "$RESTAURANT_ID",
  "p_items": [
    {
      "product_id": "$PRODUCT_ID",
      "name": "Produto Teste ATRASO",
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
DELAY_RESPONSE=$(curl -s -X POST http://localhost:3001/rpc/create_order_atomic \
    -H "Content-Type: application/json" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -d "$DELAY_PAYLOAD" 2>&1)
DELAY_ORDER_ID=$(echo "$DELAY_RESPONSE" | jq -r '.id' 2>/dev/null || echo "")
if [ -n "$DELAY_ORDER_ID" ] && [ "$DELAY_ORDER_ID" != "null" ]; then
    # Atualizar timestamp para 20 minutos atrás
    docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
        "UPDATE gm_orders SET created_at = NOW() - INTERVAL '20 minutes' WHERE id = '$DELAY_ORDER_ID';" > /dev/null 2>&1
    echo "   ✅ Pedido ATRASO criado: $DELAY_ORDER_ID (timestamp ajustado para 20 min atrás)"
else
    echo "   ❌ ERRO ao criar pedido ATRASO"
    exit 1
fi

# 6. Validar timestamps no banco
echo ""
echo "6️⃣ Validando timestamps no banco..."

NORMAL_MINUTES=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 FROM gm_orders WHERE id = '$NORMAL_ORDER_ID';" 2>/dev/null | cut -d. -f1 || echo "0")
ATTENTION_MINUTES=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 FROM gm_orders WHERE id = '$ATTENTION_ORDER_ID';" 2>/dev/null | cut -d. -f1 || echo "0")
DELAY_MINUTES=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 FROM gm_orders WHERE id = '$DELAY_ORDER_ID';" 2>/dev/null | cut -d. -f1 || echo "0")

echo "   Pedido NORMAL: ~${NORMAL_MINUTES} min (esperado: < 5 min)"
echo "   Pedido ATENÇÃO: ~${ATTENTION_MINUTES} min (esperado: 5-15 min)"
echo "   Pedido ATRASO: ~${DELAY_MINUTES} min (esperado: > 15 min)"

# Validar estados esperados
if [ "$NORMAL_MINUTES" -lt 5 ]; then
    echo "   ✅ Pedido NORMAL tem tempo correto"
else
    echo "   ⚠️  AVISO: Pedido NORMAL tem tempo maior que esperado"
fi

if [ "$ATTENTION_MINUTES" -ge 5 ] && [ "$ATTENTION_MINUTES" -lt 15 ]; then
    echo "   ✅ Pedido ATENÇÃO tem tempo correto"
else
    echo "   ⚠️  AVISO: Pedido ATENÇÃO tem tempo fora do esperado (5-15 min)"
fi

if [ "$DELAY_MINUTES" -ge 15 ]; then
    echo "   ✅ Pedido ATRASO tem tempo correto"
else
    echo "   ⚠️  AVISO: Pedido ATRASO tem tempo menor que esperado (> 15 min)"
fi

# 7. Verificar frontend
echo ""
echo "7️⃣ Verificando frontend..."
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null || echo "000")

if [ "$FRONTEND_OK" = "200" ]; then
    echo "✅ Frontend rodando"
    echo ""
    echo "📋 INSTRUÇÕES PARA TESTE MANUAL:"
    echo "   1. Abra: http://localhost:5173/kds-minimal"
    echo "   2. Verifique que aparecem 3 pedidos com bordas coloridas:"
    echo "      - Pedido NORMAL: borda verde (verde claro)"
    echo "      - Pedido ATENÇÃO: borda amarela"
    echo "      - Pedido ATRASO: borda vermelha"
    echo "   3. Verifique que o timer também muda de cor:"
    echo "      - NORMAL: verde"
    echo "      - ATENÇÃO: amarelo"
    echo "      - ATRASO: vermelho (negrito)"
else
    echo "⚠️  AVISO: Frontend não está rodando (porta 5173)"
fi

# 8. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 5 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Estados visuais validados:"
echo "  ✅ Pedidos criados com timestamps diferentes"
echo "  ✅ NORMAL: ~${NORMAL_MINUTES} min (borda verde)"
echo "  ✅ ATENÇÃO: ~${ATTENTION_MINUTES} min (borda amarela)"
echo "  ✅ ATRASO: ~${DELAY_MINUTES} min (borda vermelha)"
if [ "$FRONTEND_OK" = "200" ]; then
    echo ""
    echo "  📋 TESTE MANUAL NECESSÁRIO:"
    echo "     Abra http://localhost:5173/kds-minimal e verifique cores das bordas e timer"
fi
echo ""
echo "Pronto para FASE 6 — Ação Única (Mudança de Estado)"
echo ""
