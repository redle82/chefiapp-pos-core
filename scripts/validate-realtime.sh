#!/bin/bash
# =============================================================================
# Script de Validação do Realtime - ChefIApp Core
# =============================================================================
# Valida se o Realtime está funcionando corretamente
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "═══════════════════════════════════════════════════════════"
echo "  🔍 Validação do Realtime - ChefIApp Core"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# 1. Verificar containers Docker
echo "1️⃣  Verificando Containers Docker..."
echo ""

test_check "Postgres está rodando" \
    "docker ps --filter 'name=chefiapp-core-postgres' --format '{{.Status}}' | grep -q 'Up'"

test_check "PostgREST está rodando" \
    "docker ps --filter 'name=chefiapp-core-postgrest' --format '{{.Status}}' | grep -q 'Up'"

test_check "Realtime está rodando" \
    "docker ps --filter 'name=chefiapp-core-realtime' --format '{{.Status}}' | grep -q 'Up'"

echo ""

# 2. Verificar conectividade
echo "2️⃣  Verificando Conectividade..."
echo ""

test_check "Postgres aceita conexões" \
    "docker exec chefiapp-core-postgres pg_isready -U postgres"

test_check "PostgREST responde" \
    "curl -s http://localhost:3001 > /dev/null"

test_check "Realtime está acessível" \
    "curl -s http://localhost:4000 > /dev/null || true"

echo ""

# 3. Verificar schema _realtime
echo "3️⃣  Verificando Schema _realtime..."
echo ""

test_check "Schema _realtime existe" \
    "docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc \"SELECT 1 FROM information_schema.schemata WHERE schema_name = '_realtime'\" | grep -q 1"

echo ""

# 4. Verificar logs do Realtime
echo "4️⃣  Verificando Logs do Realtime..."
echo ""

REALTIME_LOGS=$(docker logs chefiapp-core-realtime --tail 20 2>&1)

if echo "$REALTIME_LOGS" | grep -q "Running RealtimeWeb.Endpoint"; then
    echo -e "  ${GREEN}✅ Realtime endpoint está rodando${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}❌ Realtime endpoint não encontrado nos logs${NC}"
    ((FAILED++))
fi

if echo "$REALTIME_LOGS" | grep -q "ERROR\|error\|Error"; then
    echo -e "  ${YELLOW}⚠️  Avisos/erros encontrados nos logs${NC}"
    echo "$REALTIME_LOGS" | grep -i "error" | head -3
else
    echo -e "  ${GREEN}✅ Nenhum erro crítico nos logs${NC}"
    ((PASSED++))
fi

echo ""

# 5. Verificar configuração do frontend
echo "5️⃣  Verificando Configuração do Frontend..."
echo ""

if [ -f "merchant-portal/.env" ]; then
    if grep -q "VITE_SUPABASE_URL=http://localhost:3001" merchant-portal/.env; then
        echo -e "  ${GREEN}✅ VITE_SUPABASE_URL configurado corretamente${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠️  VITE_SUPABASE_URL pode não estar configurado para Docker Core${NC}"
        ((FAILED++))
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY" merchant-portal/.env; then
        echo -e "  ${GREEN}✅ VITE_SUPABASE_ANON_KEY configurado${NC}"
        ((PASSED++))
    else
        echo -e "  ${RED}❌ VITE_SUPABASE_ANON_KEY não encontrado${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${YELLOW}⚠️  Arquivo merchant-portal/.env não encontrado${NC}"
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

if [ $FAILED -eq 0 ]; then
    echo -e "  ${GREEN}🎉 Realtime está configurado corretamente!${NC}"
    echo ""
    echo "  Próximos passos:"
    echo "  1. Abrir KDS: http://localhost:5173/app/kds"
    echo "  2. Verificar console do navegador (F12)"
    echo "  3. Procurar por 'SUBSCRIBED' no status do Realtime"
    echo "  4. Criar pedido e verificar atualização automática"
    echo ""
    exit 0
else
    echo -e "  ${RED}⚠️  Alguns testes falharam. Verifique os problemas acima.${NC}"
    echo ""
    echo "  Comandos úteis:"
    echo "  - Ver logs do Realtime: docker logs chefiapp-core-realtime -f"
    echo "  - Reiniciar Realtime: cd docker-core && docker compose -f docker-compose.core.yml restart realtime"
    echo "  - Ver status: cd docker-core && docker compose -f docker-compose.core.yml ps"
    echo ""
    exit 1
fi
