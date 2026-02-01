#!/bin/bash

# =============================================================================
# Criar Snapshot Pré-Refatoração
# =============================================================================
# OBJETIVO: Criar branch/tag de snapshot isolado antes da refatoração
# DATA: 2026-01-26
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Criando Snapshot Pré-Refatoração${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar se está em um repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Não é um repositório Git${NC}"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Há mudanças não commitadas:${NC}"
    git status --short
    echo ""
    read -p "Deseja commitá-las antes de criar o snapshot? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${BLUE}Adicionando arquivos...${NC}"
        git add docs/TESTE_MASSIVO_RESULTADO.md
        git add docs/TESTE_MASSIVO_NIVEL_2.md
        git add docs/CORE_FROZEN_STATUS.md
        git add docs/SNAPSHOT_PRE_REFACTOR.md
        git add test-results/RELATORIO_FINAL_NIVEL_2.md
        git add scripts/teste-massivo-*.sh
        git add scripts/teste-massivo-cenario-completo.sh
        git add scripts/criar-pedidos-todas-origens.sh
        git add scripts/validar-autoria-divisao.sh
        git add scripts/abrir-interfaces-teste.sh
        git add docker-core/schema/migrations/20260126_add_item_authorship.sql
        git add docker-core/schema/core_schema.sql
        git add merchant-portal/src/pages/AppStaff/context/StaffContext.tsx
        git add merchant-portal/src/pages/Waiter/TablePanel.tsx
        git add merchant-portal/src/pages/TPV/context/OrderContextReal.tsx
        
        echo -e "${BLUE}Fazendo commit...${NC}"
        git commit -m "chore: snapshot pré-refatoração - estado validado e isolado

- Teste massivo integrado executado
- Teste massivo nível 2 executado
- Autoria e divisão de conta validadas
- Multi-restaurante validado
- Documentação consolidada
- Estado congelado: ESTADO_VALIDADO_PRE_REFACTOR"
        
        echo -e "${GREEN}✅ Arquivos commitados${NC}"
    else
        echo -e "${YELLOW}⚠️  Continuando sem commitar mudanças...${NC}"
    fi
fi

# Obter branch atual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}Branch atual: ${CURRENT_BRANCH}${NC}"
echo ""

# Criar branch de snapshot
SNAPSHOT_BRANCH="pre-refactor-stable"
echo -e "${BLUE}Criando branch: ${SNAPSHOT_BRANCH}${NC}"

if git show-ref --verify --quiet refs/heads/$SNAPSHOT_BRANCH; then
    echo -e "${YELLOW}⚠️  Branch ${SNAPSHOT_BRANCH} já existe${NC}"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git branch -D $SNAPSHOT_BRANCH
        git checkout -b $SNAPSHOT_BRANCH
        echo -e "${GREEN}✅ Branch criada: ${SNAPSHOT_BRANCH}${NC}"
    else
        echo -e "${YELLOW}⚠️  Mantendo branch existente${NC}"
        git checkout $SNAPSHOT_BRANCH
    fi
else
    git checkout -b $SNAPSHOT_BRANCH
    echo -e "${GREEN}✅ Branch criada: ${SNAPSHOT_BRANCH}${NC}"
fi

# Criar tag
SNAPSHOT_TAG="pre-refactor-stable-$(date +%Y%m%d)"
echo ""
echo -e "${BLUE}Criando tag: ${SNAPSHOT_TAG}${NC}"

if git rev-parse "$SNAPSHOT_TAG" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Tag ${SNAPSHOT_TAG} já existe${NC}"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        git tag -d $SNAPSHOT_TAG
        git tag -a $SNAPSHOT_TAG -m "Snapshot pré-refatoração - Estado validado e isolado

Data: $(date +'%Y-%m-%d %H:%M:%S')
Status: ESTADO_VALIDADO_PRE_REFACTOR

Validações:
- Teste massivo integrado: ✅
- Teste massivo nível 2: ✅
- Autoria: 100% preservada
- Divisão de conta: ✅
- Multi-restaurante: ✅
- Isolamento: ✅"
        echo -e "${GREEN}✅ Tag criada: ${SNAPSHOT_TAG}${NC}"
    else
        echo -e "${YELLOW}⚠️  Mantendo tag existente${NC}"
    fi
else
    git tag -a $SNAPSHOT_TAG -m "Snapshot pré-refatoração - Estado validado e isolado

Data: $(date +'%Y-%m-%d %H:%M:%S')
Status: ESTADO_VALIDADO_PRE_REFACTOR

Validações:
- Teste massivo integrado: ✅
- Teste massivo nível 2: ✅
- Autoria: 100% preservada
- Divisão de conta: ✅
- Multi-restaurante: ✅
- Isolamento: ✅"
    echo -e "${GREEN}✅ Tag criada: ${SNAPSHOT_TAG}${NC}"
fi

# Voltar para branch original
echo ""
echo -e "${BLUE}Voltando para branch original: ${CURRENT_BRANCH}${NC}"
git checkout $CURRENT_BRANCH

# Resumo
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Snapshot criado com sucesso!${NC}"
echo ""
echo -e "${BLUE}Branch:${NC} ${SNAPSHOT_BRANCH}"
echo -e "${BLUE}Tag:${NC} ${SNAPSHOT_TAG}"
echo ""
echo -e "${BLUE}Para restaurar o snapshot:${NC}"
echo "  git checkout ${SNAPSHOT_BRANCH}"
echo "  # ou"
echo "  git checkout ${SNAPSHOT_TAG}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
