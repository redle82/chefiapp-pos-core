#!/bin/bash

# ============================================================================
# VALIDAÇÃO AUTOMÁTICA DAS LEIS DO SISTEMA
# ============================================================================
# Este script valida se o sistema está conforme as leis imutáveis:
# - 12 Contratos (ONT, CAP, PSY, PAGE)
# - 3 Leis da Verdade (SYSTEM_TRUTH_CODEX)
# - FlowGate (Arquitetura Locked)
# - Garantias do Sistema (SYSTEM_OF_RECORD_SPEC)
# ============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  VALIDAÇÃO DAS LEIS DO SISTEMA                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# ============================================================================
# PARTE 1: VALIDAÇÃO DE CONTRATOS (12 CONTRATOS)
# ============================================================================

echo "📋 PARTE 1: VALIDAÇÃO DE CONTRATOS"
echo "────────────────────────────────────────────────────────────────"

# Verificar se CoreWebContract.ts existe e valida os 4 cores
if [ -f "merchant-portal/src/core/CoreWebContract.ts" ]; then
    echo "✅ CoreWebContract.ts encontrado"

    # Verificar se validateFourCores existe
    if grep -q "validateFourCores" merchant-portal/src/core/CoreWebContract.ts; then
        echo "✅ Função validateFourCores encontrada"
    else
        echo "❌ Função validateFourCores NÃO encontrada"
        ERRORS=$((ERRORS + 1))
    fi

    # Verificar se detectFifthCoreAttempt existe
    if grep -q "detectFifthCoreAttempt" merchant-portal/src/core/CoreWebContract.ts; then
        echo "✅ Função detectFifthCoreAttempt encontrada"
    else
        echo "❌ Função detectFifthCoreAttempt NÃO encontrada"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ CoreWebContract.ts NÃO encontrado"
    ERRORS=$((ERRORS + 1))
fi

# Verificar se ContractSystem.ts existe e tem os 12 contratos
if [ -f "merchant-portal/src/core/ContractSystem.ts" ]; then
    echo "✅ ContractSystem.ts encontrado"

    # Contar contratos
    ONT_COUNT=$(grep -c "CONTRACT_ENTITY_EXISTS\|CONTRACT_MENU_EXISTS\|CONTRACT_PUBLISHED_EXISTS" merchant-portal/src/core/ContractSystem.ts || echo "0")
    CAP_COUNT=$(grep -c "CONTRACT_CAN_PREVIEW\|CONTRACT_CAN_PUBLISH\|CONTRACT_CAN_RECEIVE_ORDERS\|CONTRACT_CAN_USE_TPV" merchant-portal/src/core/ContractSystem.ts || echo "0")
    PSY_COUNT=$(grep -c "CONTRACT_GHOST_INTEGRITY\|CONTRACT_LIVE_INTEGRITY\|CONTRACT_URL_PROMISE" merchant-portal/src/core/ContractSystem.ts || echo "0")
    PAGE_COUNT=$(grep -c "CONTRACT_PAGE_CONTRACT\|CONTRACT_NAVIGATION_CONTRACT" merchant-portal/src/core/ContractSystem.ts || echo "0")

    TOTAL=$((ONT_COUNT + CAP_COUNT + PSY_COUNT + PAGE_COUNT))

    if [ "$TOTAL" -ge 10 ]; then
        echo "✅ Contratos encontrados: $TOTAL (esperado: 12)"
    else
        echo "⚠️  Contratos encontrados: $TOTAL (esperado: 12)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ ContractSystem.ts NÃO encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# PARTE 2: VALIDAÇÃO DO FLOWGATE
# ============================================================================

echo "📋 PARTE 2: VALIDAÇÃO DO FLOWGATE"
echo "────────────────────────────────────────────────────────────────"

if [ -f "merchant-portal/src/core/flow/FlowGate.tsx" ]; then
    echo "✅ FlowGate.tsx encontrado"

    # Verificar se FlowGate usa apenas fontes de verdade corretas
    if grep -q "auth.user\|restaurant_members\|onboarding_completed_at" merchant-portal/src/core/flow/FlowGate.tsx; then
        echo "✅ FlowGate usa fontes de verdade corretas"
    else
        echo "⚠️  FlowGate pode estar usando fontes incorretas"
        WARNINGS=$((WARNINGS + 1))
    fi

    # Verificar se FlowGate não usa dados opcionais (ignorar comentários)
    if grep -v "^[[:space:]]*//\|^[[:space:]]*\*" merchant-portal/src/core/flow/FlowGate.tsx | grep -q "profiles\|system_config"; then
        echo "⚠️  FlowGate pode estar usando dados opcionais (profiles/system_config)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ FlowGate não usa dados opcionais"
    fi
else
    echo "❌ FlowGate.tsx NÃO encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================================================
# PARTE 3: VALIDAÇÃO DE LEIS DA VERDADE
# ============================================================================

echo "📋 PARTE 3: VALIDAÇÃO DE LEIS DA VERDADE"
echo "────────────────────────────────────────────────────────────────"

# Verificar se SYSTEM_TRUTH_CODEX.md existe
if [ -f "SYSTEM_TRUTH_CODEX.md" ]; then
    echo "✅ SYSTEM_TRUTH_CODEX.md encontrado"
else
    echo "⚠️  SYSTEM_TRUTH_CODEX.md NÃO encontrado"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar se useCoreHealth existe (Lei 3: Truth Zero)
if find merchant-portal/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "useCoreHealth\|fetchHealth" > /dev/null 2>&1; then
    echo "✅ useCoreHealth/fetchHealth encontrado (Lei 3: Truth Zero)"
else
    echo "⚠️  useCoreHealth/fetchHealth NÃO encontrado (Lei 3 pode estar violada)"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar se fila offline existe (Lei 2: Fast Offline)
if find merchant-portal/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "useOfflineQueue\|useOfflineReconciler" > /dev/null 2>&1; then
    echo "✅ Fila offline encontrada (Lei 2: Fast Offline)"
else
    echo "⚠️  Fila offline NÃO encontrada (Lei 2 pode estar violada)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# PARTE 4: VALIDAÇÃO DE GARANTIAS DO SISTEMA
# ============================================================================

echo "📋 PARTE 4: VALIDAÇÃO DE GARANTIAS DO SISTEMA"
echo "────────────────────────────────────────────────────────────────"

# Verificar se SYSTEM_OF_RECORD_SPEC.md existe
if [ -f "SYSTEM_OF_RECORD_SPEC.md" ]; then
    echo "✅ SYSTEM_OF_RECORD_SPEC.md encontrado"
else
    echo "⚠️  SYSTEM_OF_RECORD_SPEC.md NÃO encontrado"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar se há implementação de atomicidade (Garantia de Atomicidade)
# Busca em merchant-portal e docker-core (evita find em todo o repo)
ATOMIC_FOUND=0
for dir in merchant-portal docker-core; do
    if [ -d "$dir" ] && find "$dir" \( -name "*.ts" -o -name "*.sql" \) -print 2>/dev/null | xargs grep -lE "CoreTransactionManager|BEGIN.*COMMIT|atomic.*transaction|transaction.*atomic" > /dev/null 2>&1; then
        ATOMIC_FOUND=1
        break
    fi
done
if [ "$ATOMIC_FOUND" -eq 1 ]; then
    echo "✅ Implementação de atomicidade encontrada (Garantia de Atomicidade)"
else
    echo "⚠️  Implementação de atomicidade NÃO encontrada (pode estar em outro módulo)"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar se há triggers de imutabilidade (Garantia de Imutabilidade)
# Aceita supabase/migrations ou docker-core/schema/migrations
TRIGGERS_FOUND=0
if [ -d "supabase/migrations" ]; then
    if find supabase/migrations -name "*.sql" 2>/dev/null | xargs grep -l "BEFORE UPDATE\|BEFORE DELETE" > /dev/null 2>&1; then
        TRIGGERS_FOUND=1
    fi
fi
if [ "$TRIGGERS_FOUND" -eq 0 ] && [ -d "docker-core/schema/migrations" ]; then
    if find docker-core/schema/migrations -name "*.sql" 2>/dev/null | xargs grep -l "BEFORE UPDATE\|BEFORE DELETE" > /dev/null 2>&1; then
        TRIGGERS_FOUND=1
    fi
fi
if [ "$TRIGGERS_FOUND" -eq 1 ]; then
    echo "✅ Triggers de imutabilidade encontrados (Garantia de Imutabilidade)"
else
    echo "⚠️  Triggers de imutabilidade NÃO encontrados"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# PARTE 5: VALIDAÇÃO DE PROTEÇÃO CONTRA 5º CORE
# ============================================================================

echo "📋 PARTE 5: PROTEÇÃO CONTRA 5º CORE"
echo "────────────────────────────────────────────────────────────────"

# Verificar se detectFifthCoreAttempt está sendo usado
if grep -r "detectFifthCoreAttempt" merchant-portal/src > /dev/null 2>&1; then
    echo "✅ detectFifthCoreAttempt está sendo usado"
else
    echo "⚠️  detectFifthCoreAttempt NÃO está sendo usado"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar se há localStorage.getItem direto (anti-pattern)
LOCALSTORAGE_COUNT=$(find merchant-portal/src -name "*.ts" -o -name "*.tsx" | xargs grep -c "localStorage.getItem" 2>/dev/null | awk '{s+=$1} END {print s+0}')
if [ "$LOCALSTORAGE_COUNT" -eq 0 ]; then
    echo "✅ Nenhum localStorage.getItem direto encontrado"
else
    echo "⚠️  $LOCALSTORAGE_COUNT ocorrências de localStorage.getItem direto (pode ser 5º core)"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar se há novos state managers suspeitos (excluir core canónico e intelligence/nervous-system)
SUSPICIOUS_PATTERNS=$(find merchant-portal/src \( -path 'merchant-portal/src/core' -o -path 'merchant-portal/src/intelligence' \) -prune -o \( -name "*.ts" -o -name "*.tsx" \) -print 2>/dev/null | xargs grep -E "const\s+\w*[Cc]ore\w*\s*=\s*{|createContext<\w*[Cc]ore\w*>" 2>/dev/null | wc -l | tr -d ' ')
if [ "${SUSPICIOUS_PATTERNS:-0}" -eq 0 ]; then
    echo "✅ Nenhum padrão suspeito de 5º core encontrado"
else
    echo "⚠️  $SUSPICIOUS_PATTERNS padrões suspeitos de 5º core encontrados"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# PARTE 6: VALIDAÇÃO DE INTEGRIDADE
# ============================================================================

echo "📋 PARTE 6: VALIDAÇÃO DE INTEGRIDADE"
echo "────────────────────────────────────────────────────────────────"

# Verificar se há idempotency_key em app_logs (correção de 409)
if grep -r "idempotency" merchant-portal/src/core/logger > /dev/null 2>&1; then
    echo "✅ idempotency_key implementado em app_logs"
else
    echo "⚠️  idempotency_key NÃO encontrado em app_logs (pode causar 409)"
    WARNINGS=$((WARNINGS + 1))
fi

# Verificar se External ID retry está implementado
# Nota: a implementação canónica está em migrações SQL (supabase/migrations),
# podendo também existir no backend (server/) e em scripts de validação.
EXTERNAL_ID_RETRY_FOUND=0

if [ -d "server" ] && grep -r "external_id_status\|PENDING_EXTERNAL_ID" server > /dev/null 2>&1; then
    EXTERNAL_ID_RETRY_FOUND=1
fi

if [ "$EXTERNAL_ID_RETRY_FOUND" -eq 0 ] && [ -d "supabase/migrations" ] && grep -r "external_id_status\|PENDING_EXTERNAL_ID\|v_fiscal_pending_external_ids" supabase/migrations > /dev/null 2>&1; then
    EXTERNAL_ID_RETRY_FOUND=1
fi

if [ "$EXTERNAL_ID_RETRY_FOUND" -eq 0 ] && [ -d "scripts" ] && grep -r "external_id_status\|PENDING_EXTERNAL_ID\|v_fiscal_pending_external_ids" scripts/test-external-id*.{js,sh} > /dev/null 2>&1; then
    EXTERNAL_ID_RETRY_FOUND=1
fi

if [ "$EXTERNAL_ID_RETRY_FOUND" -eq 1 ]; then
    echo "✅ External ID retry implementado"
else
    echo "⚠️  External ID retry NÃO encontrado"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ============================================================================
# PARTE 7: VALIDAÇÃO DE TYPESCRIPT
# ============================================================================

echo "📋 PARTE 7: VALIDAÇÃO DE TYPESCRIPT"
echo "────────────────────────────────────────────────────────────────"

cd merchant-portal
if npm run type-check > /dev/null 2>&1; then
    echo "✅ TypeScript compila sem erros"
else
    echo "❌ TypeScript tem erros"
    ERRORS=$((ERRORS + 1))
fi
cd ..

echo ""

# ============================================================================
# RESUMO FINAL
# ============================================================================

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  RESUMO FINAL                                                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo "✅ SISTEMA CONFORME COM AS LEIS"
    echo ""
    echo "   Todas as validações passaram."
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo "⚠️  SISTEMA COM WARNINGS"
    echo ""
    echo "   Erros: $ERRORS"
    echo "   Warnings: $WARNINGS"
    echo ""
    echo "   Sistema funcional, mas com melhorias recomendadas."
    exit 0
else
    echo "❌ SISTEMA VIOLA LEIS CRÍTICAS"
    echo ""
    echo "   Erros: $ERRORS"
    echo "   Warnings: $WARNINGS"
    echo ""
    echo "   ⚠️  DEPLOY BLOQUEADO até correções"
    exit 1
fi
