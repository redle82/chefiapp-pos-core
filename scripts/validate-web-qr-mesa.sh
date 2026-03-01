#!/bin/bash
# =============================================================================
# Script de Validação do Fluxo Web/QR Mesa - ChefIApp
# =============================================================================
# Valida o fluxo completo: QR Code → Pedido → KDS mostra origem QR_MESA
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "═══════════════════════════════════════════════════════════"
echo "  🔍 Validação do Fluxo Web/QR Mesa - ChefIApp"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Função para testar
test_check() {
    local name="$1"
    local command="$2"

    echo -n "  Testando: $name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSOU${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        ((FAILED++))
        return 1
    fi
}

# 1. Verificar serviços Docker Core
echo "1️⃣  Verificando Serviços Docker Core..."
echo ""

test_check "Postgres está rodando" \
    "docker ps --filter 'name=chefiapp-core-postgres' --format '{{.Status}}' | grep -q 'Up'"

test_check "PostgREST está rodando" \
    "docker ps --filter 'name=chefiapp-core-postgrest' --format '{{.Status}}' | grep -q 'Up'"

test_check "Realtime está rodando" \
    "docker ps --filter 'name=chefiapp-core-realtime' --format '{{.Status}}' | grep -q 'Up'"

echo ""

# 2. Verificar dados necessários
echo "2️⃣  Verificando Dados no Banco..."
echo ""

RESTAURANT_ID=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT id FROM gm_restaurants LIMIT 1" 2>/dev/null || echo "")

if [ -n "$RESTAURANT_ID" ]; then
    echo -e "  ${GREEN}✅ Restaurante encontrado: ${RESTAURANT_ID:0:8}...${NC}"
    ((PASSED++))

    # Verificar slug
    SLUG=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT slug FROM gm_restaurants WHERE id = '$RESTAURANT_ID'" 2>/dev/null || echo "")
    if [ -n "$SLUG" ]; then
        echo -e "  ${GREEN}✅ Slug do restaurante: $SLUG${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠️  Slug não encontrado${NC}"
        ((FAILED++))
    fi

    # Verificar mesas ativas
    TABLE_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT COUNT(*) FROM gm_tables WHERE restaurant_id = '$RESTAURANT_ID'" 2>/dev/null || echo "0")
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo -e "  ${GREEN}✅ Mesas encontradas: $TABLE_COUNT${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠️  Nenhuma mesa encontrada${NC}"
        ((FAILED++))
    fi

    # Verificar produtos
    PRODUCT_COUNT=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT COUNT(*) FROM gm_products WHERE restaurant_id = '$RESTAURANT_ID'" 2>/dev/null || echo "0")
    if [ "$PRODUCT_COUNT" -gt 0 ]; then
        echo -e "  ${GREEN}✅ Produtos encontrados: $PRODUCT_COUNT${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠️  Nenhum produto encontrado${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${RED}❌ Nenhum restaurante encontrado${NC}"
    ((FAILED++))
fi

echo ""

# 3. Verificar RPC create_order_atomic
echo "3️⃣  Verificando RPC create_order_atomic..."
echo ""

test_check "RPC existe" \
    "docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c '\df create_order_atomic' | grep -q 'create_order_atomic'"

echo ""

# 4. Verificar constraint one_open_order_per_table
echo "4️⃣  Verificando Constraint one_open_order_per_table..."
echo ""

test_check "Constraint existe" \
    "docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c '\d+ idx_one_open_order_per_table' | grep -q 'idx_one_open_order_per_table'"

echo ""

# 5. Verificar frontend
echo "5️⃣  Verificando Frontend..."
echo ""

if lsof -ti:5175 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Frontend rodando na porta 5175${NC}"
    ((PASSED++))

    # Verificar se página pública está acessível
    if curl -s http://localhost:5175 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Frontend responde${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠️  Frontend não responde${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${YELLOW}⚠️  Frontend não está rodando${NC}"
    echo -e "  ${BLUE}💡 Execute: cd merchant-portal && npm run dev${NC}"
    ((FAILED++))
fi

echo ""

# 6. Verificar componentes
echo "6️⃣  Verificando Componentes..."
echo ""

if [ -f "merchant-portal/src/pages/Public/TablePage.tsx" ]; then
    echo -e "  ${GREEN}✅ TablePage.tsx existe${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}❌ TablePage.tsx não encontrado${NC}"
    ((FAILED++))
fi

if [ -f "merchant-portal/src/pages/Public/PublicRouter.tsx" ]; then
    echo -e "  ${GREEN}✅ PublicRouter.tsx existe${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}❌ PublicRouter.tsx não encontrado${NC}"
    ((FAILED++))
fi

if [ -f "merchant-portal/src/components/QRCodeGenerator.tsx" ]; then
    echo -e "  ${GREEN}✅ QRCodeGenerator.tsx existe${NC}"
    ((PASSED++))
else
    echo -e "  ${YELLOW}⚠️  QRCodeGenerator.tsx não encontrado${NC}"
    ((FAILED++))
fi

if [ -f "merchant-portal/src/pages/Web/QRCodeManager.tsx" ]; then
    echo -e "  ${GREEN}✅ QRCodeManager.tsx existe${NC}"
    ((PASSED++))
else
    echo -e "  ${YELLOW}⚠️  QRCodeManager.tsx não encontrado${NC}"
    ((FAILED++))
fi

# Verificar se OriginBadge suporta QR_MESA
if grep -q "QR_MESA" merchant-portal/src/pages/TPV/KDS/components/OriginBadge.tsx 2>/dev/null; then
    echo -e "  ${GREEN}✅ OriginBadge suporta QR_MESA${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}❌ OriginBadge não suporta QR_MESA${NC}"
    ((FAILED++))
fi

echo ""

# 7. Verificar WebOrderingService
echo "7️⃣  Verificando WebOrderingService..."
echo ""

if [ -f "merchant-portal/src/core/services/WebOrderingService.ts" ]; then
    echo -e "  ${GREEN}✅ WebOrderingService.ts existe${NC}"
    ((PASSED++))

    # Verificar se suporta QR_MESA
    if grep -q "QR_MESA" merchant-portal/src/core/services/WebOrderingService.ts 2>/dev/null; then
        echo -e "  ${GREEN}✅ WebOrderingService suporta QR_MESA${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠️  WebOrderingService pode não suportar QR_MESA${NC}"
        ((FAILED++))
    fi

    # Verificar se usa RPC create_order_atomic
    if grep -q "create_order_atomic" merchant-portal/src/core/services/WebOrderingService.ts 2>/dev/null; then
        echo -e "  ${GREEN}✅ WebOrderingService usa RPC create_order_atomic${NC}"
        ((PASSED++))
    else
        echo -e "  ${RED}❌ WebOrderingService não usa RPC create_order_atomic${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${RED}❌ WebOrderingService.ts não encontrado${NC}"
    ((FAILED++))
fi

echo ""

# Resumo
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Resumo"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}✅ Testes Passaram: $PASSED${NC}"
echo -e "  ${RED}❌ Testes Falharam: $FAILED${NC}"
echo ""

if [ -n "$SLUG" ] && [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "  ${BLUE}💡 URLs para Teste Manual:${NC}"
    echo ""
    echo -e "  ${BLUE}1. Página Pública:${NC}"
    echo -e "     http://localhost:5175/public/$SLUG"
    echo ""
    echo -e "  ${BLUE}2. Página da Mesa (exemplo mesa 1):${NC}"
    echo -e "     http://localhost:5175/public/$SLUG/mesa/1"
    echo ""
    echo -e "  ${BLUE}3. KDS (para verificar origem QR_MESA):${NC}"
    echo -e "     http://localhost:5175/app/kds"
    echo ""
fi

if [ $FAILED -eq 0 ]; then
    echo -e "  ${GREEN}🎉 Fluxo Web/QR Mesa está configurado corretamente!${NC}"
    echo ""
    echo "  Próximos passos para validação manual:"
    echo "  1. Abrir página da mesa: http://localhost:5175/public/$SLUG/mesa/1"
    echo "  2. Adicionar produtos ao carrinho"
    echo "  3. Criar pedido"
    echo "  4. Verificar no KDS que origem aparece como QR_MESA"
    echo "  5. Testar constraint: tentar criar segundo pedido na mesma mesa (deve bloquear)"
    echo ""
    exit 0
else
    echo -e "  ${RED}⚠️  Alguns testes falharam. Verifique os problemas acima.${NC}"
    echo ""
    exit 1
fi
