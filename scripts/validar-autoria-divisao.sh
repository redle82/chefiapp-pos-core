#!/bin/bash

# =============================================================================
# Validar Autoria e Divisão de Conta
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Validação de Autoria e Divisão de Conta${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar se há pedidos de teste
ORDER_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "SELECT COUNT(*) FROM gm_orders WHERE sync_metadata->>'test' = 'true';" | xargs)

if [ "$ORDER_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Nenhum pedido de teste encontrado${NC}"
    echo "Execute primeiro: ./scripts/criar-pedidos-todas-origens.sh"
    exit 0
fi

echo -e "${GREEN}✅ Encontrados $ORDER_COUNT pedido(s) de teste${NC}"
echo ""

# 1. Verificar autoria nos itens
echo -e "${BLUE}1. Verificando autoria nos itens...${NC}"
echo ""

AUTHORSHIP_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "
SELECT COUNT(*) 
FROM gm_order_items oi 
JOIN gm_orders o ON oi.order_id = o.id 
WHERE o.sync_metadata->>'test' = 'true' 
  AND oi.created_by_role IS NOT NULL;
" | xargs)

TOTAL_ITEMS=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "
SELECT COUNT(*) 
FROM gm_order_items oi 
JOIN gm_orders o ON oi.order_id = o.id 
WHERE o.sync_metadata->>'test' = 'true';
" | xargs)

if [ "$AUTHORSHIP_COUNT" -eq "$TOTAL_ITEMS" ] && [ "$TOTAL_ITEMS" -gt 0 ]; then
    echo -e "${GREEN}✅ Todos os $TOTAL_ITEMS itens têm autoria (created_by_role)${NC}"
else
    echo -e "${RED}❌ Apenas $AUTHORSHIP_COUNT de $TOTAL_ITEMS itens têm autoria${NC}"
fi

echo ""

# 2. Mostrar divisão por autoria
echo -e "${BLUE}2. Divisão de conta por autoria:${NC}"
echo ""

docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    oi.created_by_role,
    oi.created_by_user_id,
    oi.device_id,
    COUNT(*) as item_count,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal_cents) / 100.0 as total_reais,
    o.origin as order_origin
FROM gm_order_items oi
JOIN gm_orders o ON oi.order_id = o.id
WHERE o.sync_metadata->>'test' = 'true'
GROUP BY oi.created_by_role, oi.created_by_user_id, oi.device_id, o.origin
ORDER BY total_reais DESC;
"

echo ""

# 3. Verificar origens corretas
echo -e "${BLUE}3. Verificando origens dos pedidos:${NC}"
echo ""

docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    o.origin,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(oi.id) as item_count
FROM gm_orders o
LEFT JOIN gm_order_items oi ON oi.order_id = o.id
WHERE o.sync_metadata->>'test' = 'true'
GROUP BY o.origin
ORDER BY o.origin;
"

echo ""

# 4. Validar constraint (1 pedido por mesa)
echo -e "${BLUE}4. Validando constraint (1 pedido aberto por mesa):${NC}"
echo ""

DUPLICATE_TABLES=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -t -c "
SELECT table_number, COUNT(*) 
FROM gm_orders 
WHERE sync_metadata->>'test' = 'true' 
  AND status = 'OPEN' 
  AND table_number IS NOT NULL
GROUP BY table_number 
HAVING COUNT(*) > 1;
" | xargs)

if [ -z "$DUPLICATE_TABLES" ]; then
    echo -e "${GREEN}✅ Constraint respeitada: Nenhuma mesa com múltiplos pedidos abertos${NC}"
else
    echo -e "${RED}❌ Violação de constraint encontrada: Mesas com múltiplos pedidos abertos${NC}"
    echo "  Mesas: $DUPLICATE_TABLES"
fi

echo ""

# 5. Resumo final
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Resumo da Validação${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "✅ Autoria nos itens: $AUTHORSHIP_COUNT / $TOTAL_ITEMS"
echo "✅ Constraint: $(if [ -z "$DUPLICATE_TABLES" ]; then echo "Respeitada"; else echo "Violada"; fi)"
echo ""

echo "📊 Query para divisão de conta:"
echo ""
echo "SELECT"
echo "    oi.created_by_role,"
echo "    oi.created_by_user_id,"
echo "    SUM(oi.subtotal_cents) / 100.0 as total_reais"
echo "FROM gm_order_items oi"
echo "JOIN gm_orders o ON oi.order_id = o.id"
echo "WHERE o.id = '<ORDER_ID>'"
echo "GROUP BY oi.created_by_role, oi.created_by_user_id;"
echo ""
