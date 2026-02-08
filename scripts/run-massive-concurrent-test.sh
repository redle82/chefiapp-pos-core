#!/bin/bash
# =============================================================================
# MASSIVE CONCURRENT TEST - Runner Script
# =============================================================================
# Executa teste massivo simultâneo com validação completa
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "═══════════════════════════════════════════════════════════"
echo "  🔥 MASSIVE CONCURRENT TEST - ChefIApp Core"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Verificar Docker Core
echo "1️⃣  Verificando Docker Core..."
if ! docker compose -f docker-core/docker-compose.core.yml ps postgres | grep -q "Up"; then
    echo "   ❌ Postgres não está rodando"
    echo "   Execute: cd docker-core && docker compose -f docker-compose.core.yml up -d"
    exit 1
fi
echo "   ✅ Postgres rodando"

if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ❌ PostgREST não está respondendo"
    exit 1
fi
echo "   ✅ PostgREST respondendo"
echo ""

# 2. Verificar variáveis de ambiente
echo "2️⃣  Verificando configuração..."
if [ -z "$SUPABASE_URL" ]; then
    export SUPABASE_URL="http://localhost:3001"
    echo "   ⚠️  SUPABASE_URL não definido, usando: $SUPABASE_URL"
else
    echo "   ✅ SUPABASE_URL: $SUPABASE_URL"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    export SUPABASE_ANON_KEY="chefiapp-core-secret-key-min-32-chars-long"
    echo "   ⚠️  SUPABASE_ANON_KEY não definido, usando padrão"
else
    echo "   ✅ SUPABASE_ANON_KEY definido"
fi
echo ""

# 3. Executar teste
echo "3️⃣  Executando teste massivo..."
echo ""

npx ts-node scripts/massive-concurrent-test.ts "$@"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "═══════════════════════════════════════════════════════════"
    echo "  ✅ TESTE PASSOU"
    echo "═══════════════════════════════════════════════════════════"
else
    echo "═══════════════════════════════════════════════════════════"
    echo "  ❌ TESTE FALHOU"
    echo "═══════════════════════════════════════════════════════════"
fi

exit $EXIT_CODE
