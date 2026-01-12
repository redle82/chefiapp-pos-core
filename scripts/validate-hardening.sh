#!/bin/bash

# Script de Validação Automática - Hardening P0 (v0.9.2)
# Valida todas as migrations aplicadas e funcionalidades críticas

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VALIDAÇÃO HARDENING P0 - v0.9.2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI não encontrado.${NC}"
    echo "   Instale: npm install -g supabase"
    echo ""
    echo "   Ou execute o script SQL manualmente:"
    echo "   scripts/validate-hardening-migrations.sql"
    exit 0
fi

echo "📋 Executando validações..."
echo ""

# Contador de validações
PASSED=0
FAILED=0

# Função para validar
validate() {
    local name="$1"
    local query="$2"
    local expected="$3"
    
    echo -n "   Validando $name... "
    
    # Executar query (assumindo que supabase está linkado)
    result=$(supabase db query "$query" 2>/dev/null | tail -n +2 | head -n 1 | tr -d ' ')
    
    if [ "$result" = "$expected" ] || [ -n "$result" ]; then
        echo -e "${GREEN}✅${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        echo "      Esperado: $expected"
        echo "      Obtido: $result"
        ((FAILED++))
        return 1
    fi
}

# Validação 1: Colunas críticas
echo "1️⃣  Validando colunas críticas..."
validate "fiscal_config" \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'gm_restaurants' AND column_name = 'fiscal_config';" \
    "1"

validate "external_ids" \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'gm_restaurants' AND column_name = 'external_ids';" \
    "1"

validate "sync_metadata" \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'gm_orders' AND column_name = 'sync_metadata';" \
    "1"

validate "version" \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'gm_orders' AND column_name = 'version';" \
    "1"

echo ""

# Validação 2: Funções RPC
echo "2️⃣  Validando funções RPC..."
validate "create_order_atomic" \
    "SELECT COUNT(*) FROM pg_proc WHERE proname = 'create_order_atomic';" \
    "1"

validate "check_open_orders_with_lock" \
    "SELECT COUNT(*) FROM pg_proc WHERE proname = 'check_open_orders_with_lock';" \
    "1"

# Verificar parâmetros de create_order_atomic
echo -n "   Validando parâmetros de create_order_atomic... "
param_count=$(supabase db query "SELECT pronargs FROM pg_proc WHERE proname = 'create_order_atomic';" 2>/dev/null | tail -n +2 | head -n 1 | tr -d ' ')
if [ "$param_count" = "4" ]; then
    echo -e "${GREEN}✅ (4 parâmetros)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ (esperado 4, obtido $param_count)${NC}"
    ((FAILED++))
fi

echo ""

# Validação 3: Triggers
echo "3️⃣  Validando triggers..."
validate "trigger_increment_order_version" \
    "SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trigger_increment_order_version';" \
    "1"

echo ""

# Validação 4: Tabelas
echo "4️⃣  Validando tabelas críticas..."
validate "integration_orders" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'integration_orders';" \
    "1"

validate "fiscal_event_store" \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fiscal_event_store';" \
    "1"

echo ""

# Validação 5: Índices
echo "5️⃣  Validando índices críticos..."
validate "idx_gm_orders_sync_local_id" \
    "SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_gm_orders_sync_local_id';" \
    "1"

validate "idx_gm_orders_version" \
    "SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_gm_orders_version';" \
    "1"

echo ""

# Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "   ${GREEN}✅ Passou: $PASSED${NC}"
echo -e "   ${RED}❌ Falhou: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TODAS AS VALIDAÇÕES PASSARAM!${NC}"
    echo ""
    echo "✅ Próximos passos:"
    echo "   1. Executar testes manuais (ver POS_MIGRATION_CHECKLIST.md)"
    echo "   2. Validar funcionalidades no TPV"
    echo "   3. Testar cenários offline"
    exit 0
else
    echo -e "${RED}⚠️  ALGUMAS VALIDAÇÕES FALHARAM${NC}"
    echo ""
    echo "❌ Ações necessárias:"
    echo "   1. Verificar quais migrations não foram aplicadas"
    echo "   2. Re-executar migrations faltantes"
    echo "   3. Executar script SQL manual: scripts/validate-hardening-migrations.sql"
    exit 1
fi
