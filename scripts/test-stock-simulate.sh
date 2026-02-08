#!/bin/bash
# =============================================================================
# Teste de Simulação de Estoque
# =============================================================================
# Script para testar a RPC simulate_order_stock_impact
# Cria dados seed mínimos e valida o retorno
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Teste de Simulação de Estoque${NC}"
echo "=========================================="
echo ""

# Verificar se o container está rodando
CONTAINER="chefiapp-core-postgres"
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER}$"; then
    echo -e "${RED}❌ Container ${CONTAINER} não está rodando${NC}"
    echo "Execute: cd docker-core && docker compose -f docker-compose.core.yml up -d"
    exit 1
fi

echo -e "${GREEN}✅ Container ${CONTAINER} está rodando${NC}"
echo ""

# IDs fixos para teste
RESTAURANT_ID="00000000-0000-0000-0000-000000000100"

echo -e "${YELLOW}📦 Criando dados seed mínimos...${NC}"

# Executar SQL de seed
docker exec -i ${CONTAINER} psql -U postgres -d chefiapp_core <<EOF
-- 1. Criar local (Cozinha)
INSERT INTO public.gm_locations (restaurant_id, name, kind)
VALUES ('${RESTAURANT_ID}', 'Cozinha Principal', 'KITCHEN')
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- 2. Criar ingredientes
INSERT INTO public.gm_ingredients (restaurant_id, name, unit)
VALUES 
  ('${RESTAURANT_ID}', 'Carne', 'g'),
  ('${RESTAURANT_ID}', 'Pão', 'unit'),
  ('${RESTAURANT_ID}', 'Queijo', 'g')
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- 3. Criar estoque
INSERT INTO public.gm_stock_levels (restaurant_id, location_id, ingredient_id, qty, min_qty)
SELECT 
  '${RESTAURANT_ID}',
  (SELECT id FROM public.gm_locations WHERE restaurant_id = '${RESTAURANT_ID}' AND name = 'Cozinha Principal' LIMIT 1),
  (SELECT id FROM public.gm_ingredients WHERE restaurant_id = '${RESTAURANT_ID}' AND name = ing_name LIMIT 1),
  qty_val,
  min_val
FROM (VALUES
  ('Carne', 5000, 1000),
  ('Pão', 50, 10),
  ('Queijo', 2000, 500)
) AS seed(ing_name, qty_val, min_val)
ON CONFLICT (restaurant_id, location_id, ingredient_id) DO UPDATE
SET qty = EXCLUDED.qty, min_qty = EXCLUDED.min_qty;

-- 4. Criar BOM para Hambúrguer Artesanal (se produto existir)
INSERT INTO public.gm_product_bom (restaurant_id, product_id, ingredient_id, qty_per_unit, station)
SELECT 
  '${RESTAURANT_ID}',
  (SELECT id FROM public.gm_products WHERE restaurant_id = '${RESTAURANT_ID}' AND name = 'Hambúrguer Artesanal' LIMIT 1),
  (SELECT id FROM public.gm_ingredients WHERE restaurant_id = '${RESTAURANT_ID}' AND name = ing_name LIMIT 1),
  qty_val,
  'KITCHEN'
FROM (VALUES
  ('Carne', 150),
  ('Pão', 1),
  ('Queijo', 30)
) AS bom(ing_name, qty_val)
ON CONFLICT (restaurant_id, product_id, ingredient_id) DO NOTHING;

-- Verificar dados criados
SELECT 'Locais criados:' as info, COUNT(*) as count FROM public.gm_locations WHERE restaurant_id = '${RESTAURANT_ID}';
SELECT 'Ingredientes criados:' as info, COUNT(*) as count FROM public.gm_ingredients WHERE restaurant_id = '${RESTAURANT_ID}';
SELECT 'Estoques criados:' as info, COUNT(*) as count FROM public.gm_stock_levels WHERE restaurant_id = '${RESTAURANT_ID}';
SELECT 'BOMs criados:' as info, COUNT(*) as count FROM public.gm_product_bom WHERE restaurant_id = '${RESTAURANT_ID}';
EOF

echo -e "${GREEN}✅ Dados seed criados${NC}"
echo ""

# Buscar ID do produto Hambúrguer Artesanal
echo -e "${YELLOW}🔍 Buscando produto 'Hambúrguer Artesanal'...${NC}"
PRODUCT_ID=$(docker exec ${CONTAINER} psql -U postgres -d chefiapp_core -t -c \
  "SELECT id FROM public.gm_products WHERE restaurant_id = '${RESTAURANT_ID}' AND name = 'Hambúrguer Artesanal' LIMIT 1" | tr -d ' ')

if [ -z "$PRODUCT_ID" ]; then
    echo -e "${RED}❌ Produto 'Hambúrguer Artesanal' não encontrado${NC}"
    echo "Criando produto de teste..."
    
    PRODUCT_ID=$(docker exec ${CONTAINER} psql -U postgres -d chefiapp_core -t -c \
      "INSERT INTO public.gm_products (restaurant_id, name, price_cents, available, station, prep_time_seconds)
       VALUES ('${RESTAURANT_ID}', 'Hambúrguer Artesanal', 1800, true, 'KITCHEN', 720)
       RETURNING id" | tr -d ' ')
    
    # Criar BOM para o produto criado
    docker exec -i ${CONTAINER} psql -U postgres -d chefiapp_core <<EOF
INSERT INTO public.gm_product_bom (restaurant_id, product_id, ingredient_id, qty_per_unit, station)
SELECT 
  '${RESTAURANT_ID}',
  '${PRODUCT_ID}',
  (SELECT id FROM public.gm_ingredients WHERE restaurant_id = '${RESTAURANT_ID}' AND name = ing_name LIMIT 1),
  qty_val,
  'KITCHEN'
FROM (VALUES
  ('Carne', 150),
  ('Pão', 1),
  ('Queijo', 30)
) AS bom(ing_name, qty_val)
ON CONFLICT (restaurant_id, product_id, ingredient_id) DO NOTHING;
EOF
    
    echo -e "${GREEN}✅ Produto criado: ${PRODUCT_ID}${NC}"
fi

echo -e "${GREEN}✅ Produto encontrado: ${PRODUCT_ID}${NC}"
echo ""

# Testar simulação com 3 hambúrgueres
echo -e "${YELLOW}🧪 Testando simulação com 3 hambúrgueres...${NC}"
echo ""

RESULT=$(docker exec ${CONTAINER} psql -U postgres -d chefiapp_core -t -A -c \
  "SELECT simulate_order_stock_impact(
    '${RESTAURANT_ID}',
    '[{\"product_id\": \"${PRODUCT_ID}\", \"quantity\": 3}]'::jsonb
  )::text")

echo -e "${BLUE}📊 Resultado da simulação:${NC}"
echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
echo ""

# Validar resultado
if echo "$RESULT" | grep -q "below_min"; then
    BELOW_MIN=$(echo "$RESULT" | jq -r '.[] | select(.below_min == true) | .ingredient_id' 2>/dev/null || echo "")
    if [ -n "$BELOW_MIN" ]; then
        echo -e "${RED}⚠️  ATENÇÃO: Algum ingrediente ficará abaixo do mínimo!${NC}"
    else
        echo -e "${GREEN}✅ Nenhum ingrediente ficará abaixo do mínimo${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Não foi possível validar 'below_min' no resultado${NC}"
fi

echo ""
echo -e "${GREEN}✅ Teste concluído!${NC}"
echo ""
echo "Para testar manualmente:"
echo "  docker exec -it ${CONTAINER} psql -U postgres -d chefiapp_core"
echo "  SELECT simulate_order_stock_impact('${RESTAURANT_ID}', '[{\"product_id\": \"${PRODUCT_ID}\", \"quantity\": 3}]'::jsonb);"
