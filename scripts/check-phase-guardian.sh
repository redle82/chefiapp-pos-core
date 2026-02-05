#!/bin/bash
# 🛡️ Verificador de Guardião de Fases
# 
# Verifica se uma fase pode ser iniciada baseado nas regras do guardião
#
# Uso: ./scripts/check-phase-guardian.sh <FASE_NUMERO>
# Exemplo: ./scripts/check-phase-guardian.sh 7

set -e

if [ -z "$1" ]; then
    echo "Uso: ./scripts/check-phase-guardian.sh <FASE_NUMERO>"
    echo "Exemplo: ./scripts/check-phase-guardian.sh 7"
    exit 1
fi

PHASE=$1

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🛡️  Verificando Guardião para FASE $PHASE..."
echo ""

# Verificar FASE 0 (sempre obrigatória)
check_phase_0() {
    if [ -f "docs/audit/PHASE_0_COMPLETION.md" ]; then
        echo -e "${GREEN}✓ FASE 0 completa${NC}"
        return 0
    else
        echo -e "${RED}✗ FASE 0 não encontrada${NC}"
        return 1
    fi
}

# Verificar FASE 1
check_phase_1() {
    # Verificar se código está completo
    if [ -f "merchant-portal/src/pages/Onboarding/BillingStep.tsx" ] && \
       [ -f "merchant-portal/src/pages/Onboarding/CheckoutStep.tsx" ] && \
       [ -f "legacy_supabase/functions/create-subscription/index.ts" ]; then
        echo -e "${GREEN}✓ FASE 1: Código completo${NC}"
        
        # Verificar se migration foi executada (se DATABASE_URL disponível)
        if [ -n "$DATABASE_URL" ]; then
            TABLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'subscriptions';" 2>/dev/null || echo "0")
            if [ "$TABLES" -gt "0" ]; then
                echo -e "${GREEN}✓ FASE 1: Migration executada${NC}"
            else
                echo -e "${YELLOW}⚠️  FASE 1: Migration não executada${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  FASE 1: Não foi possível verificar migration (DATABASE_URL não definida)${NC}"
        fi
        
        # Verificar Edge Functions
        FUNCTIONS_DEPLOYED=0
        for func in "create-subscription" "update-subscription-status" "cancel-subscription" "change-plan"; do
            if [ -f "legacy_supabase/functions/$func/index.ts" ]; then
                ((FUNCTIONS_DEPLOYED++))
            fi
        done
        
        if [ "$FUNCTIONS_DEPLOYED" -eq "4" ]; then
            echo -e "${GREEN}✓ FASE 1: Edge Functions criadas${NC}"
        else
            echo -e "${YELLOW}⚠️  FASE 1: Apenas $FUNCTIONS_DEPLOYED de 4 Edge Functions encontradas${NC}"
        fi
        
        return 0
    else
        echo -e "${RED}✗ FASE 1: Código incompleto${NC}"
        return 1
    fi
}

# Verificar FASE 5
check_phase_5() {
    if [ -f "merchant-portal/src/pages/TPV/TPV.tsx" ] && \
       grep -q "React.lazy" merchant-portal/src/pages/TPV/TPV.tsx 2>/dev/null; then
        echo -e "${GREEN}✓ FASE 5: Lazy loading implementado${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  FASE 5: Implementação pode estar incompleta${NC}"
        return 0  # Não bloqueia
    fi
}

# Verificar FASE 6
check_phase_6() {
    if [ -f "mobile-app/components/PrinterSettings.tsx" ]; then
        echo -e "${GREEN}✓ FASE 6: PrinterSettings criado${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  FASE 6: Implementação pode estar incompleta${NC}"
        return 0  # Não bloqueia
    fi
}

# Verificar pré-requisitos baseado na fase
case $PHASE in
    0)
        echo "FASE 0 é obrigatória e deve ser executada primeiro."
        exit 0
        ;;
    1)
        check_phase_0 || exit 1
        echo ""
        echo -e "${GREEN}✅ FASE 1 pode ser iniciada${NC}"
        ;;
    2|3|4)
        check_phase_0 || exit 1
        check_phase_1 || exit 1
        echo ""
        echo -e "${GREEN}✅ FASE $PHASE pode ser iniciada${NC}"
        ;;
    5|6)
        check_phase_0 || exit 1
        check_phase_1 || echo -e "${YELLOW}⚠️  FASE 1 não está 100%, mas FASE $PHASE pode continuar${NC}"
        echo ""
        echo -e "${GREEN}✅ FASE $PHASE pode ser iniciada${NC}"
        ;;
    7)
        check_phase_0 || exit 1
        check_phase_1 || echo -e "${YELLOW}⚠️  FASE 1 não está 100%${NC}"
        check_phase_5 || echo -e "${YELLOW}⚠️  FASE 5 não está 100%${NC}"
        check_phase_6 || echo -e "${YELLOW}⚠️  FASE 6 não está 100%${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  FASE 7 está adiada. Verifique se realmente deseja iniciar.${NC}"
        read -p "Continuar mesmo assim? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            echo "Cancelado."
            exit 1
        fi
        ;;
    8)
        check_phase_0 || exit 1
        check_phase_1 || echo -e "${YELLOW}⚠️  FASE 1 não está 100%${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  FASE 8 não é prioritária. Verifique se realmente deseja iniciar.${NC}"
        read -p "Continuar mesmo assim? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            echo "Cancelado."
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}✗ Fase inválida: $PHASE${NC}"
        echo "Fases válidas: 0, 1, 2, 3, 4, 5, 6, 7, 8"
        exit 1
        ;;
esac

echo ""
echo "✅ Verificação concluída. FASE $PHASE pode ser iniciada."
