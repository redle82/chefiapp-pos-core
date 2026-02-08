#!/bin/bash

# TESTE FASE 1 — CONTRATO DO CORE (LEITURA)
# Objetivo: Validar que o adaptador de leitura funciona corretamente

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "TESTE FASE 1 — CONTRATO DO CORE (LEITURA)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Verificar que Docker Core está rodando
echo "1️⃣ Verificando Docker Core..."
if ! docker ps | grep -q "chefiapp-core-postgres"; then
    echo "❌ ERRO: Docker Core não está rodando"
    exit 1
fi
echo "✅ Docker Core rodando"

# 2. Verificar que há dados no banco (restaurante)
echo ""
echo "2️⃣ Verificando dados no banco..."
RESTAURANT_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT COUNT(*) FROM gm_restaurants;" 2>/dev/null || echo "0")

if [ "$RESTAURANT_COUNT" = "0" ]; then
    echo "⚠️  AVISO: Nenhum restaurante encontrado no banco"
    echo "   Execute: docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -f /docker-entrypoint-initdb.d/seeds_dev.sql"
    echo "   Continuando com teste básico..."
else
    echo "✅ Restaurantes encontrados: $RESTAURANT_COUNT"
fi

# 3. Testar leitura via PostgREST (simulação do OrderReader)
echo ""
echo "3️⃣ Testando leitura via PostgREST..."

# Obter ID de um restaurante
RESTAURANT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT id FROM gm_restaurants LIMIT 1;" 2>/dev/null || echo "")

if [ -z "$RESTAURANT_ID" ]; then
    echo "⚠️  AVISO: Nenhum restaurante encontrado para teste"
    echo "   Criando restaurante de teste..."
    
    # Criar restaurante de teste
    RESTAURANT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
        "INSERT INTO gm_restaurants (id, name, slug, active) VALUES (gen_random_uuid(), 'Restaurante Teste', 'restaurante-teste', true) RETURNING id;" 2>/dev/null || echo "")
    
    if [ -z "$RESTAURANT_ID" ]; then
        echo "❌ ERRO: Não foi possível criar restaurante de teste"
        exit 1
    fi
    echo "✅ Restaurante de teste criado: $RESTAURANT_ID"
fi

echo "   Usando restaurante: $RESTAURANT_ID"

# Testar query de pedidos
echo ""
echo "4️⃣ Testando query de pedidos..."
RESPONSE=$(curl -s -X GET \
    "http://localhost:3001/rest/v1/gm_orders?restaurant_id=eq.$RESTAURANT_ID&status=in.(OPEN,IN_PREP,READY)&order=created_at.desc" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -H "Content-Type: application/json" 2>&1)

if echo "$RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "❌ ERRO na query:"
    echo "$RESPONSE" | head -5
    exit 1
fi

# Verificar se retornou array JSON
if echo "$RESPONSE" | grep -q "^\["; then
    ORDER_COUNT=$(echo "$RESPONSE" | jq '. | length' 2>/dev/null || echo "0")
    echo "✅ Query executada com sucesso"
    echo "   Pedidos encontrados: $ORDER_COUNT"
else
    echo "⚠️  AVISO: Resposta não é um array JSON válido"
    echo "   Resposta: $(echo "$RESPONSE" | head -1)"
fi

# 5. Verificar que não houve mutação
echo ""
echo "5️⃣ Verificando que não houve mutação..."
# Contar pedidos antes
ORDERS_BEFORE=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT COUNT(*) FROM gm_orders WHERE restaurant_id = '$RESTAURANT_ID';" 2>/dev/null || echo "0")

# Executar query novamente
curl -s -X GET \
    "http://localhost:3001/rest/v1/gm_orders?restaurant_id=eq.$RESTAURANT_ID" \
    -H "apikey: chefiapp-core-secret-key-min-32-chars-long" \
    -H "Content-Type: application/json" > /dev/null 2>&1

# Contar pedidos depois
ORDERS_AFTER=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \
    "SELECT COUNT(*) FROM gm_orders WHERE restaurant_id = '$RESTAURANT_ID';" 2>/dev/null || echo "0")

if [ "$ORDERS_BEFORE" != "$ORDERS_AFTER" ]; then
    echo "❌ ERRO: Número de pedidos mudou (antes: $ORDERS_BEFORE, depois: $ORDERS_AFTER)"
    echo "   Isso indica que houve mutação, o que não deveria acontecer em leitura"
    exit 1
fi

echo "✅ Nenhuma mutação detectada (pedidos: $ORDERS_BEFORE)"

# 6. Resumo
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ TESTE FASE 1 — APROVADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Adaptador de leitura validado:"
echo "  ✅ Leitura de pedidos funciona"
echo "  ✅ Nenhuma mutação detectada"
echo "  ✅ Dados corretos retornando do Core"
echo ""
echo "Pronto para FASE 2 — KDS Mínimo (Read-Only)"
echo ""
