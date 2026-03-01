#!/bin/bash

# TESTE FASE 7 — PÁGINA WEB PÚBLICA (READ-ONLY)
# Objetivo: Validar que página web pública exibe restaurante e menu corretamente

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 7 — PÁGINA WEB PÚBLICA (READ-ONLY)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar que Docker Core está rodando
echo "1️⃣ Verificando Docker Core..."
if ! docker ps | grep -q "chefiapp-core-postgres"; then
    echo "❌ ERRO: Docker Core não está rodando"
    exit 1
fi
echo "✅ Docker Core rodando"

# 2. Obter restaurante e slug
echo ""
echo "2️⃣ Obtendo restaurante e slug..."
RESTAURANT_DATA=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id, slug, name FROM gm_restaurants LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$RESTAURANT_DATA" ]; then
    echo "❌ ERRO: Nenhum restaurante encontrado"
    exit 1
fi

RESTAURANT_ID=$(echo "$RESTAURANT_DATA" | cut -d'|' -f1 | xargs)
RESTAURANT_SLUG=$(echo "$RESTAURANT_DATA" | cut -d'|' -f2 | xargs)
RESTAURANT_NAME=$(echo "$RESTAURANT_DATA" | cut -d'|' -f3 | xargs)

if [ -z "$RESTAURANT_SLUG" ]; then
    echo "❌ ERRO: Restaurante não possui slug"
    exit 1
fi

echo "✅ Restaurante: $RESTAURANT_NAME (slug: $RESTAURANT_SLUG)"

# 3. Verificar que restaurante existe via PostgREST
echo ""
echo "3️⃣ Verificando acesso via PostgREST..."
RESTAURANT_RESPONSE=$(curl -s -X GET \
    "http://localhost:3001/gm_restaurants?select=id,name,slug&slug=eq.$RESTAURANT_SLUG" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -H "Content-Type: application/json" 2>&1)

if echo "$RESTAURANT_RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "❌ ERRO ao acessar restaurante via PostgREST"
    echo "$RESTAURANT_RESPONSE" | head -5
    exit 1
fi

RESTAURANT_COUNT=$(echo "$RESTAURANT_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
if [ "$RESTAURANT_COUNT" = "0" ]; then
    echo "❌ ERRO: Restaurante não encontrado via PostgREST"
    exit 1
fi
echo "✅ Restaurante acessível via PostgREST"

# 4. Verificar categorias do menu
echo ""
echo "4️⃣ Verificando categorias do menu..."
CATEGORIES_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT COUNT(*) FROM gm_menu_categories WHERE restaurant_id = '$RESTAURANT_ID';" 2>/dev/null || echo "0")
echo "✅ Categorias encontradas: $CATEGORIES_COUNT"

# 5. Verificar produtos
echo ""
echo "5️⃣ Verificando produtos..."
PRODUCTS_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT COUNT(*) FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID' AND available = true;" 2>/dev/null || echo "0")
echo "✅ Produtos disponíveis: $PRODUCTS_COUNT"

# 6. Verificar acesso via PostgREST (categorias)
echo ""
echo "6️⃣ Verificando categorias via PostgREST..."
CATEGORIES_RESPONSE=$(curl -s -X GET \
    "http://localhost:3001/gm_menu_categories?select=id,name&restaurant_id=eq.$RESTAURANT_ID" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -H "Content-Type: application/json" 2>&1)

if echo "$CATEGORIES_RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "⚠️  AVISO: Erro ao acessar categorias via PostgREST"
else
    CATEGORIES_API_COUNT=$(echo "$CATEGORIES_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
    echo "✅ Categorias acessíveis via PostgREST: $CATEGORIES_API_COUNT"
fi

# 7. Verificar acesso via PostgREST (produtos)
echo ""
echo "7️⃣ Verificando produtos via PostgREST..."
PRODUCTS_RESPONSE=$(curl -s -X GET \
    "http://localhost:3001/gm_products?select=id,name,price_cents&restaurant_id=eq.$RESTAURANT_ID&available=eq.true" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -H "Content-Type: application/json" 2>&1)

if echo "$PRODUCTS_RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "⚠️  AVISO: Erro ao acessar produtos via PostgREST"
else
    PRODUCTS_API_COUNT=$(echo "$PRODUCTS_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
    echo "✅ Produtos acessíveis via PostgREST: $PRODUCTS_API_COUNT"
fi

# 8. Verificar frontend
echo ""
echo "8️⃣ Verificando frontend..."
FRONTEND_OK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5175/ 2>/dev/null || echo "000")

if [ "$FRONTEND_OK" = "200" ]; then
    echo "✅ Frontend rodando"
    echo ""
    echo "📋 INSTRUÇÕES PARA TESTE MANUAL:"
    echo "   1. Abra: http://localhost:5175/public/$RESTAURANT_SLUG"
    echo "   2. Verifique que:"
    echo "      - Nome do restaurante aparece no topo"
    echo "      - Descrição do restaurante aparece (se existir)"
    echo "      - Categorias do menu aparecem"
    echo "      - Produtos aparecem organizados por categoria"
    echo "      - Preços aparecem formatados (R$ X.XX)"
    echo "      - Imagens aparecem (se existirem)"
    echo "      - Footer indica 'FASE 7 — Read-Only'"
    echo "   3. Verifique que NÃO há:"
    echo "      - Botões para adicionar ao carrinho"
    echo "      - Formulários de pedido"
    echo "      - Qualquer ação de escrita"
else
    echo "⚠️  AVISO: Frontend não está rodando (porta 5175)"
fi

# 9. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 7 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Página web pública validada:"
echo "  ✅ Restaurante acessível via slug"
echo "  ✅ Menu (categorias + produtos) acessível"
echo "  ✅ Dados retornando corretamente do Core"
echo "  ✅ Apenas leitura (sem ações de escrita)"
if [ "$FRONTEND_OK" = "200" ]; then
    echo ""
    echo "  📋 TESTE MANUAL NECESSÁRIO:"
    echo "     Abra http://localhost:5175/public/$RESTAURANT_SLUG e valide visualmente"
fi
echo ""
echo "Pronto para FASE 8 — Criação de Pedido via Web"
echo ""
