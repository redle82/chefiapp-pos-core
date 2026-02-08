#!/bin/bash
# =============================================================================
# Verificar Status dos Bancos Docker
# =============================================================================
# Script para verificar o status de todos os bancos Docker relacionados ao ChefIApp
# =============================================================================

set -e

echo "🔍 Verificando Status dos Bancos Docker"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para verificar container
check_container() {
    local container_name=$1
    local description=$2
    
    if docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
        local status=$(docker ps --filter "name=${container_name}" --format "{{.Status}}")
        echo -e "${GREEN}✅${NC} ${description}"
        echo "   Container: ${container_name}"
        echo "   Status: ${status}"
        return 0
    else
        echo -e "${RED}❌${NC} ${description}"
        echo "   Container: ${container_name} (não está rodando)"
        return 1
    fi
}

# Função para verificar porta
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :${port} -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost ${port} 2>/dev/null; then
        echo -e "${GREEN}✅${NC} ${service} está acessível na porta ${port}"
        return 0
    else
        echo -e "${RED}❌${NC} ${service} NÃO está acessível na porta ${port}"
        return 1
    fi
}

echo "📦 Containers Docker:"
echo "-------------------"

# Docker Core (Principal)
check_container "chefiapp-core-postgres" "Docker Core - Postgres (Principal)"
check_container "chefiapp-core-postgrest" "Docker Core - PostgREST"
check_container "chefiapp-core-realtime" "Docker Core - Realtime"
check_container "chefiapp-core-nginx" "Docker Core - Nginx"

echo ""
echo "📊 Portas:"
echo "---------"

# Verificar portas do Docker Core
check_port "54320" "Postgres (Docker Core)"
check_port "3001" "PostgREST (Docker Core)"
check_port "4000" "Realtime (Docker Core)"

echo ""
echo "🔌 Conectividade:"
echo "----------------"

# Verificar Postgres
if docker exec chefiapp-core-postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Postgres está respondendo"
else
    echo -e "${RED}❌${NC} Postgres NÃO está respondendo"
fi

# Verificar PostgREST
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} PostgREST está respondendo"
else
    echo -e "${RED}❌${NC} PostgREST NÃO está respondendo"
fi

# Verificar Realtime
if curl -s http://localhost:4000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Realtime está respondendo"
else
    echo -e "${YELLOW}⚠️${NC} Realtime pode não estar respondendo (isso é normal se não estiver configurado)"
fi

echo ""
echo "📋 Outros Bancos (Legado):"
echo "-------------------------"

# Supabase Local (Legado)
if docker ps --format "{{.Names}}" | grep -q "supabase_db_chefiapp-pos-core"; then
    echo -e "${YELLOW}⚠️${NC} Supabase Local (Legado) está rodando na porta 54322"
    echo "   Este banco NÃO está sendo usado pelo sistema atual"
else
    echo -e "${GREEN}✅${NC} Supabase Local (Legado) não está rodando (esperado)"
fi

# Docker Tests
check_container "chefiapp-test-postgres" "Docker Tests - Postgres"

echo ""
echo "========================================"
echo "✅ Verificação completa!"
echo ""
echo "💡 Banco Principal: Docker Core (porta 54320)"
echo "💡 PostgREST: http://localhost:3001"
echo "💡 Realtime: ws://localhost:4000"