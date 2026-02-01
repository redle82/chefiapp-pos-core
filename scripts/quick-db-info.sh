#!/bin/bash
# =============================================================================
# Informações Rápidas do Banco Docker Core
# =============================================================================
# Mostra informações úteis sobre o banco de dados
# =============================================================================

set -e

CONTAINER_NAME="chefiapp-core-postgres"
DB_NAME="chefiapp_core"
DB_USER="postgres"

# Verificar se o container está rodando
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Erro: Container ${CONTAINER_NAME} não está rodando"
    exit 1
fi

echo "📊 Informações do Banco Docker Core"
echo "===================================="
echo ""

# Contar registros
echo "📈 Contagem de Registros:"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -t -c "
SELECT 
    'Restaurantes: ' || COUNT(*) FROM gm_restaurants
UNION ALL
SELECT 
    'Mesas: ' || COUNT(*) FROM gm_tables
UNION ALL
SELECT 
    'Produtos: ' || COUNT(*) FROM gm_products
UNION ALL
SELECT 
    'Pedidos: ' || COUNT(*) FROM gm_orders
UNION ALL
SELECT 
    'Itens de Pedidos: ' || COUNT(*) FROM gm_order_items;
"

echo ""
echo "📋 Restaurantes:"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "
SELECT id, name, slug, created_at 
FROM gm_restaurants 
ORDER BY created_at DESC 
LIMIT 5;
"

echo ""
echo "🪑 Mesas Ativas:"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "
SELECT id, number, is_active, qr_code 
FROM gm_tables 
WHERE is_active = true 
ORDER BY number 
LIMIT 10;
"

echo ""
echo "📦 Pedidos Recentes:"
docker exec ${CONTAINER_NAME} psql -U ${DB_USER} -d ${DB_NAME} -c "
SELECT 
    id, 
    status, 
    table_number, 
    origin, 
    total_cents, 
    created_at 
FROM gm_orders 
ORDER BY created_at DESC 
LIMIT 5;
"

echo ""
echo "✅ Informações exibidas com sucesso!"