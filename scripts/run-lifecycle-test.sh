#!/bin/bash
# =============================================================================
# TESTE B - CICLO COMPLETO DE VIDA DO PEDIDO
# =============================================================================
# Valida: abertura → fechamento → nova abertura, sem vazamento de estado
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "═══════════════════════════════════════════════════════════"
echo "  🔥 TESTE B - CICLO COMPLETO DE VIDA DO PEDIDO"
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
echo ""

# 2. Executar teste
echo "2️⃣  Executando teste de ciclo de vida..."
echo ""

npx ts-node scripts/test-order-lifecycle.ts "$@"

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
