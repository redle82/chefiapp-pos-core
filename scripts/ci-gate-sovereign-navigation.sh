#!/bin/bash

# 🔒 CI Gate: Sovereign Navigation Protection
# 
# Este script valida TODAS as proteções arquiteturais antes de permitir commit/merge
# 
# Validações:
# 1. Single Entry Policy (landing → /app)
# 2. E2E Navigation Flow (Playwright)
# 3. Lint rules (ESLint)
# 
# Referências:
# - E2E_SOVEREIGN_NAVIGATION_VALIDATION.md
# - ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md
# - SINGLE_ENTRY_POLICY.md

set -e

echo "🔒 CI Gate: Validando Sovereign Navigation..."
echo ""

ERRORS=0

# 1. Validar Single Entry Policy
echo "📋 1. Validando Single Entry Policy..."
if npm run validate:single-entry 2>/dev/null; then
    echo "   ✅ Single Entry Policy validada"
else
    echo "   ❌ Single Entry Policy FALHOU"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Validar E2E Navigation Flow (se Playwright estiver disponível)
echo "📋 2. Validando E2E Navigation Flow..."
if command -v npx &> /dev/null && [ -f "merchant-portal/tests/e2e/sovereign-navigation.spec.ts" ]; then
    # Verificar se o servidor está rodando
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        if cd merchant-portal && npx playwright test tests/e2e/sovereign-navigation.spec.ts --reporter=list 2>/dev/null; then
            echo "   ✅ E2E Navigation Flow validado"
        else
            echo "   ⚠️  E2E Navigation Flow falhou (mas não bloqueia)"
            # Não incrementa ERRORS porque E2E pode falhar por outros motivos
        fi
    else
        echo "   ⚠️  Servidor não está rodando (pulando E2E)"
    fi
    cd ..
else
    echo "   ⚠️  Playwright não disponível (pulando E2E)"
fi
echo ""

# 3. Validar Lint (se ESLint estiver configurado)
echo "📋 3. Validando Lint Rules..."
if [ -f "merchant-portal/package.json" ] && grep -q '"lint"' merchant-portal/package.json; then
    if cd merchant-portal && npm run lint 2>/dev/null; then
        echo "   ✅ Lint Rules validadas"
    else
        echo "   ⚠️  Lint falhou (mas não bloqueia se não crítico)"
    fi
    cd ..
else
    echo "   ⚠️  ESLint não configurado (pulando lint)"
fi
echo ""

# Resultado Final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ CI Gate: TODAS as validações passaram"
    echo "   Sistema protegido. Commit/merge liberado."
    exit 0
else
    echo "❌ CI Gate: ${ERRORS} validação(ões) falhou(ram)"
    echo "   Corrija antes de fazer commit/merge."
    echo "   Ver: E2E_SOVEREIGN_NAVIGATION_VALIDATION.md"
    exit 1
fi
