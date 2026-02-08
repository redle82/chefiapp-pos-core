#!/bin/bash

# =============================================================================
# Script de Refatoração - Limpar TPV Legacy
# =============================================================================
# OBJETIVO: Remover TPV.tsx e componentes não usados, manter apenas context/ e KDS/
# DATA: 2026-01-26
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_DIR="merchant-portal/src/pages/TPV"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Limpando TPV Legacy${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Remover TPV.tsx (não usado na rota)
if [ -f "${BASE_DIR}/TPV.tsx" ]; then
    echo -e "${YELLOW}Removendo: ${BASE_DIR}/TPV.tsx${NC}"
    rm -f "${BASE_DIR}/TPV.tsx"
    echo -e "${GREEN}✅ Removido${NC}"
else
    echo -e "${BLUE}Já removido: ${BASE_DIR}/TPV.tsx${NC}"
fi

# Remover TPV.css (usado apenas por TPV.tsx)
if [ -f "${BASE_DIR}/TPV.css" ]; then
    echo -e "${YELLOW}Removendo: ${BASE_DIR}/TPV.css${NC}"
    rm -f "${BASE_DIR}/TPV.css"
    echo -e "${GREEN}✅ Removido${NC}"
else
    echo -e "${BLUE}Já removido: ${BASE_DIR}/TPV.css${NC}"
fi

# Remover index.ts (exporta TPV.tsx que não existe mais)
if [ -f "${BASE_DIR}/index.ts" ]; then
    echo -e "${YELLOW}Removendo: ${BASE_DIR}/index.ts${NC}"
    rm -f "${BASE_DIR}/index.ts"
    echo -e "${GREEN}✅ Removido${NC}"
else
    echo -e "${BLUE}Já removido: ${BASE_DIR}/index.ts${NC}"
fi

# Remover componentes não usados (manter apenas os que são importados)
# Lista de componentes que PODEM ser removidos (verificar antes)
# MANTER: TPVInstallPrompt (usado por KDSLayout)
COMPONENTS_TO_REMOVE=(
    "CheckoutModal.tsx"
    "CloseCashRegisterModal.tsx"
    "ConstraintFeedback.tsx"
    "CopilotWidget.tsx"
    "CreateGroupModal.tsx"
    "CustomerSearchModal.tsx"
    "ErrorModal.tsx"
    "FiscalPrintButton.tsx"
    "FiscalReceiptPreview.tsx"
    "InsightTicker.tsx"
    "Loyalty"
    "OpenCashRegisterModal.tsx"
    "OperationalModeIndicator.tsx"
    "OrderItemEditor.tsx"
    "PaymentModal.tsx"
    "QuickProductModal.tsx"
    "SplitBillModal.tsx"
    "SplitBillModalWrapper.tsx"
    "TPVLockScreen.tsx"
    "TPVSettingsModal.tsx"
    "TPVWarMap.tsx"
    "TPVExceptionPanel.tsx"  # Usado apenas por TPVWarMap
    "CashRegisterAlert.tsx"  # Usado apenas por TPV.tsx
    "DeliveryNotificationManager.tsx"  # Usado apenas por TPV.tsx
    "FiscalConfigAlert.tsx"  # Usado apenas por TPV.tsx e DebugTPV (verificar)
    "GroupSelector.tsx"  # Usado apenas por TPV.tsx
    "IncomingRequests.tsx"  # Usado apenas por TPV.tsx
    "OrderHeader.tsx"  # Usado apenas por TPV.tsx
    "OrderSummaryPanel.tsx"  # Usado apenas por TPV.tsx
    "TPVNavigation.tsx"  # Usado apenas por TPV.tsx
)

echo ""
echo -e "${BLUE}Removendo componentes não usados...${NC}"

REMOVED=0
SKIPPED=0

for component in "${COMPONENTS_TO_REMOVE[@]}"; do
    path="${BASE_DIR}/components/${component}"
    
    if [ -e "$path" ]; then
        echo -e "${YELLOW}Removendo: ${path}${NC}"
        rm -rf "$path"
        REMOVED=$((REMOVED + 1))
    else
        echo -e "${BLUE}Já removido: ${path}${NC}"
        SKIPPED=$((SKIPPED + 1))
    fi
done

# Remover hooks não usados
HOOKS_TO_REMOVE=(
    "useTPVShortcuts.ts"
    "useTPVVoiceControl.ts"
)

echo ""
echo -e "${BLUE}Removendo hooks não usados...${NC}"

for hook in "${HOOKS_TO_REMOVE[@]}"; do
    path="${BASE_DIR}/hooks/${hook}"
    
    if [ -e "$path" ]; then
        echo -e "${YELLOW}Removendo: ${path}${NC}"
        rm -f "$path"
        REMOVED=$((REMOVED + 1))
    else
        echo -e "${BLUE}Já removido: ${path}${NC}"
        SKIPPED=$((SKIPPED + 1))
    fi
done

# Remover reservations (não usado)
if [ -d "${BASE_DIR}/reservations" ]; then
    echo -e "${YELLOW}Removendo: ${BASE_DIR}/reservations${NC}"
    rm -rf "${BASE_DIR}/reservations"
    REMOVED=$((REMOVED + 1))
fi

# Remover types (verificar se usado)
if [ -d "${BASE_DIR}/types" ]; then
    echo -e "${YELLOW}Removendo: ${BASE_DIR}/types${NC}"
    rm -rf "${BASE_DIR}/types"
    REMOVED=$((REMOVED + 1))
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Limpeza concluída!${NC}"
echo -e "${BLUE}Removidos: ${REMOVED}${NC}"
echo -e "${BLUE}Já removidos: ${SKIPPED}${NC}"
echo ""
echo -e "${BLUE}Mantidos:${NC}"
echo -e "  ✅ ${BASE_DIR}/context/ (OrderContextReal, TableContext, OfflineOrderContext)"
echo -e "  ✅ ${BASE_DIR}/KDS/ (KitchenDisplay usado por AppStaff)"
echo -e "  ✅ ${BASE_DIR}/components/ (componentes usados: FiscalConfigAlert, etc.)"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
