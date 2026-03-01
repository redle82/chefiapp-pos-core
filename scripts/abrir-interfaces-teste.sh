#!/bin/bash

# =============================================================================
# Abrir Todas as Interfaces para Teste Massivo
# =============================================================================

set -e

BASE_URL="http://localhost:5175"

echo "🚀 Abrindo todas as interfaces para teste massivo..."
echo ""

# Função para abrir URL
open_url() {
    local url=$1
    local name=$2
    echo "  📱 Abrindo: $name"
    if command -v open > /dev/null; then
        open "$url" 2>/dev/null || true
    elif command -v xdg-open > /dev/null; then
        xdg-open "$url" 2>/dev/null || true
    else
        echo "    ⚠️  Não foi possível abrir automaticamente. Acesse: $url"
    fi
    sleep 1
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. INTERFACES PÚBLICAS (Cliente)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

open_url "$BASE_URL/public" "Página Web Pública"
open_url "$BASE_URL/public/table/1" "Página de Mesa via QR (exemplo)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. TPV E APLICAÇÕES OPERACIONAIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

open_url "$BASE_URL/tpv" "TPV Caixa"
open_url "$BASE_URL/app/staff" "AppStaff (Login - depois selecionar waiter)"
open_url "$BASE_URL/app/staff" "AppStaff (Login - depois selecionar manager)"
open_url "$BASE_URL/app/staff" "AppStaff (Login - depois selecionar owner)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. KDS (Kitchen Display System)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

open_url "$BASE_URL/kds" "KDS Completo"
open_url "$BASE_URL/kds-minimal" "Mini KDS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Todas as interfaces foram abertas!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Preencha o checklist manualmente"
echo "   2. Teste criação de pedidos em cada interface"
echo "   3. Valide visualmente todas as UIs"
echo "   4. Verifique origens e badges"
echo "   5. Valide autoria e divisão de conta"
echo ""
echo "⚠️  NOTA: Algumas interfaces podem precisar de login/configuração"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
