#!/bin/bash
# =============================================================================
# Script para Abrir URLs de Teste - ChefIApp
# =============================================================================
# Abre todas as URLs importantes para testes manuais
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "═══════════════════════════════════════════════════════════"
echo "  🚀 Abrindo URLs de Teste - ChefIApp"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar se frontend está rodando
if ! lsof -ti:5175 > /dev/null 2>&1; then
    echo "❌ Frontend não está rodando na porta 5175"
    echo "💡 Execute: cd merchant-portal && npm run dev"
    exit 1
fi

# Obter slug do restaurante
SLUG=$(docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -tAc "SELECT slug FROM gm_restaurants LIMIT 1" 2>/dev/null || echo "restaurante-piloto")

if [ -z "$SLUG" ]; then
    SLUG="restaurante-piloto"
fi

echo "📋 URLs que serão abertas:"
echo ""
echo "  1. KDS (Kitchen Display System)"
echo "  2. TPV (Terminal de Vendas)"
echo "  3. Página Pública"
echo "  4. Página da Mesa (Mesa 1)"
echo ""

# Função para abrir URL
open_url() {
    local url="$1"
    local name="$2"

    echo "  Abrindo: $name"
    if command -v open > /dev/null 2>&1; then
        # macOS
        open "$url" 2>/dev/null || true
    elif command -v xdg-open > /dev/null 2>&1; then
        # Linux
        xdg-open "$url" 2>/dev/null || true
    else
        echo "    URL: $url"
    fi
}

# Aguardar um pouco entre aberturas
sleep 1
open_url "http://localhost:5175/app/kds" "KDS"

sleep 1
open_url "http://localhost:5175/app/tpv" "TPV"

sleep 1
open_url "http://localhost:5175/public/$SLUG" "Página Pública"

sleep 1
open_url "http://localhost:5175/public/$SLUG/mesa/1" "Página da Mesa 1"

echo ""
echo "✅ URLs abertas!"
echo ""
echo "💡 Dica: Use o guia de teste manual:"
echo "   docs/testing/MANUAL_TEST_GUIDE.md"
echo ""
