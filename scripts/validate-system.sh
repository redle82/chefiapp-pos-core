#!/bin/bash

# Script de Validação Rápida - Sistema Nervoso Operacional
# Executa validações básicas do sistema

echo "🔍 Validando Sistema Nervoso Operacional..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de erros
ERRORS=0

# Função para verificar arquivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
    else
        echo -e "${RED}❌${NC} $2 (não encontrado: $1)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Função para verificar diretório
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
    else
        echo -e "${RED}❌${NC} $2 (não encontrado: $1)"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📁 Verificando Estrutura de Arquivos..."
echo ""

# Componentes principais
check_file "mobile-app/components/FastPayButton.tsx" "FastPayButton"
check_file "mobile-app/components/WaitlistBoard.tsx" "WaitlistBoard"
check_file "mobile-app/components/KitchenPressureIndicator.tsx" "KitchenPressureIndicator"
check_file "mobile-app/hooks/useKitchenPressure.ts" "useKitchenPressure hook"

echo ""
echo "📱 Verificando Telas Modificadas..."
echo ""

check_file "mobile-app/app/(tabs)/tables.tsx" "Tela de Mesas (Mapa Vivo)"
check_file "mobile-app/app/(tabs)/orders.tsx" "Tela de Pedidos (Fast Pay)"
check_file "mobile-app/app/(tabs)/index.tsx" "Tela de Menu (KDS Inteligente)"

echo ""
echo "💾 Verificando Serviços..."
echo ""

check_file "mobile-app/services/persistence.ts" "PersistenceService (com waitlist)"

echo ""
echo "📚 Verificando Documentação..."
echo ""

check_file "docs/EXECUCAO_30_DIAS.md" "Documentação Técnica"
check_file "docs/VALIDACAO_RAPIDA.md" "Checklist de Validação"
check_file "docs/GUIA_RAPIDO_GARCOM.md" "Guia do Garçom"
check_file "docs/MANIFESTO_COMERCIAL.md" "Manifesto Comercial"
check_file "docs/PLANO_ROLLOUT.md" "Plano de Rollout"
check_file "docs/TROUBLESHOOTING.md" "Troubleshooting"
check_file "docs/ARQUITETURA_VISUAL.md" "Arquitetura Visual"
check_file "CHANGELOG.md" "Changelog"

echo ""
echo "🔍 Verificando Imports e Dependências..."
echo ""

# Verificar se componentes importam corretamente
if grep -q "FastPayButton" "mobile-app/app/(tabs)/tables.tsx"; then
    echo -e "${GREEN}✅${NC} FastPayButton importado em tables.tsx"
else
    echo -e "${RED}❌${NC} FastPayButton não importado em tables.tsx"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "useKitchenPressure" "mobile-app/app/(tabs)/index.tsx"; then
    echo -e "${GREEN}✅${NC} useKitchenPressure usado em index.tsx"
else
    echo -e "${RED}❌${NC} useKitchenPressure não usado em index.tsx"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "WaitlistBoard" "mobile-app/app/(tabs)/tables.tsx"; then
    echo -e "${GREEN}✅${NC} WaitlistBoard importado em tables.tsx"
else
    echo -e "${RED}❌${NC} WaitlistBoard não importado em tables.tsx"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "📊 Resumo da Validação..."
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Validação completa! Todos os arquivos estão presentes.${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Executar testes manuais (docs/VALIDACAO_RAPIDA.md)"
    echo "2. Validar em ambiente de desenvolvimento"
    echo "3. Preparar para beta fechado"
    exit 0
else
    echo -e "${RED}❌ Validação falhou! ${ERRORS} erro(s) encontrado(s).${NC}"
    echo ""
    echo "Corrija os erros acima antes de prosseguir."
    exit 1
fi
