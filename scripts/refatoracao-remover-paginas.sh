#!/bin/bash

# =============================================================================
# Script de Refatoração - Remover Páginas Não Usadas
# =============================================================================
# OBJETIVO: Remover páginas que não são usadas nos testes massivos
# DATA: 2026-01-26
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_DIR="merchant-portal/src/pages"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Removendo Páginas Não Usadas${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Lista de páginas para REMOVER (não usadas nos testes)
PAGES_TO_REMOVE=(
    "Activation"
    "Admin"
    "Analytics"
    "Audit"
    "Calendar"
    "ComingSoonPage.tsx"
    "CRM"
    "Dashboard"
    "Evolve"
    "Finance"
    "Fiscal"
    "Govern"
    "GovernManage"
    "HealthCheckPage.tsx"
    "Home"
    "Inventory"
    "Landing"
    "LeakDashboard"
    "LocalBoss"
    "Loyalty"
    "Menu"
    "MultiLocation"
    "Operation"
    "OperationalHub"
    "Onboarding"
    "Organization"
    "Performance"
    "Portioning"
    "PreviewPage.tsx"
    "Public"  # Usar PublicWeb ao invés
    "Purchasing"
    "Read"
    "Reports"
    "ReputationHub"
    "Reservations"
    "Safety"
    "Settings"
    "steps"
    "Store"
    "Team"
    "Tenant"
    "Web"  # Usar PublicWeb ao invés
)

# Contador
REMOVED=0
SKIPPED=0

for page in "${PAGES_TO_REMOVE[@]}"; do
    path="${BASE_DIR}/${page}"
    
    if [ -e "$path" ]; then
        echo -e "${YELLOW}Removendo: ${path}${NC}"
        rm -rf "$path"
        REMOVED=$((REMOVED + 1))
    else
        echo -e "${BLUE}Já removido: ${path}${NC}"
        SKIPPED=$((SKIPPED + 1))
    fi
done

# Remover AuthPage.tsx se não usado
if [ -f "${BASE_DIR}/AuthPage.tsx" ]; then
    echo -e "${YELLOW}Removendo: ${BASE_DIR}/AuthPage.tsx${NC}"
    rm -f "${BASE_DIR}/AuthPage.tsx"
    REMOVED=$((REMOVED + 1))
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Remoção concluída!${NC}"
echo -e "${BLUE}Removidos: ${REMOVED}${NC}"
echo -e "${BLUE}Já removidos: ${SKIPPED}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
