#!/bin/bash

# Script de Validação Automatizada
# Data: 2026-01-16

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 VALIDAÇÃO AUTOMATIZADA DO SISTEMA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
SKIPPED=0

# Função para verificar se arquivo existe
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $2 (arquivo não encontrado: $1)"
        ((FAILED++))
        return 1
    fi
}

# Função para verificar se migration foi aplicada
check_migration() {
    echo -e "${YELLOW}⚠️${NC}  Verificação de migration requer acesso ao Supabase Dashboard"
    echo "   Execute: VALIDAR_DEPLOY.sql no Supabase Dashboard"
    ((SKIPPED++))
}

echo "📋 VALIDAÇÃO DE ARQUIVOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# FASE 1
echo "FASE 1 - 'NÃO QUEBRA':"
check_file "supabase/migrations/20260116000002_fiscal_event_store.sql" "Migration Fiscal"
check_file "merchant-portal/src/core/queue/db.ts" "Offline Mode - IndexedDB"
check_file "merchant-portal/src/core/queue/OfflineSync.ts" "Offline Mode - Sync"
check_file "merchant-portal/src/integrations/adapters/glovo/GlovoAdapter.ts" "Glovo Adapter"
check_file "supabase/functions/webhook-glovo/index.ts" "Glovo Webhook"
check_file "merchant-portal/src/core/fiscal/FiscalService.ts" "Fiscal Service"
check_file "merchant-portal/src/core/fiscal/FiscalPrinter.ts" "Fiscal Printer"
echo ""

# FASE 2
echo "FASE 2 - 'PENSA COMIGO':"
check_file "merchant-portal/src/pages/AppStaff/hooks/useTableAlerts.ts" "Alertas Automáticos"
check_file "merchant-portal/src/pages/Analytics/hooks/useRealAnalytics.ts" "Analytics Real"
check_file "merchant-portal/src/pages/AppStaff/hooks/useContextualSuggestions.ts" "Sugestões Contextuais"
check_file "merchant-portal/src/pages/TPV/hooks/useTPVShortcuts.ts" "Atalhos de Teclado"
echo ""

# FASE 3
echo "FASE 3 - 'ESCALA OU VENDA':"
check_file "supabase/migrations/20260115000000_create_restaurant_groups.sql" "Migration Multi-location"
check_file "supabase/migrations/20260116000003_customer_loyalty.sql" "Migration CRM/Loyalty"
check_file "merchant-portal/src/core/crm/CustomerService.ts" "CRM Service"
check_file "merchant-portal/src/core/loyalty/LoyaltyService.ts" "Loyalty Service"
check_file "merchant-portal/src/pages/CRM/CustomersPage.tsx" "UI CRM"
check_file "merchant-portal/src/pages/Loyalty/LoyaltyPage.tsx" "UI Loyalty"
check_file "merchant-portal/src/integrations/adapters/ubereats/UberEatsAdapter.ts" "Uber Eats Adapter"
check_file "merchant-portal/src/integrations/adapters/deliveroo/DeliverooAdapter.ts" "Deliveroo Adapter"
echo ""

# Documentação
echo "DOCUMENTAÇÃO:"
check_file "START_HERE_MASTER.md" "Documento Mestre"
check_file "VALIDACAO_PRODUCAO_PLANO.md" "Plano de Validação"
check_file "APLICAR_MIGRATIONS_CRM_LOYALTY.md" "Guia Migration"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Passou:${NC} $PASSED"
echo -e "${RED}❌ Falhou:${NC} $FAILED"
echo -e "${YELLOW}⚠️  Pulado:${NC} $SKIPPED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os arquivos críticos estão presentes!${NC}"
    echo ""
    echo "⚠️  PRÓXIMOS PASSOS:"
    echo "   1. Aplicar migration CRM/Loyalty (10 min)"
    echo "   2. Executar validação manual (ver VALIDACAO_AUTOMATIZADA.md)"
    echo "   3. Testar funcionalidades em produção"
    echo ""
else
    echo -e "${RED}❌ Alguns arquivos estão faltando!${NC}"
    echo "   Verifique os arquivos listados acima."
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
