#!/bin/bash

# Single Entry Policy Validator
# 
# PROTEÇÃO ARQUITETURAL: Landing Page NUNCA pode linkar para /login ou /onboarding
# 
# Este script valida que TODOS os links na landing page apontam para /app
# FlowGate é a única autoridade que decide rotas.

set -e

echo "🔍 Validando Single Entry Policy..."
echo ""

ERRORS=0

# Diretórios da landing page
LANDING_DIRS=(
  "landing-page/src/components"
  "merchant-portal/src/pages/Landing/components"
)

# Padrões proibidos
FORBIDDEN_PATTERNS=(
  'to="/login"'
  'to="/onboarding"'
  'href="/login"'
  'href="/onboarding"'
  "to={'/login'}"
  "to={'/onboarding'}"
  "href={'/login'}"
  "href={'/onboarding'}"
  'getMerchantPortalUrl\(["\']/login'
  'getMerchantPortalUrl\(["\']/onboarding'
)

for dir in "${LANDING_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    continue
  fi

  echo "📁 Verificando: $dir"
  
  for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    # Busca por padrões proibidos, ignorando comentários de proteção
    matches=$(grep -r "$pattern" "$dir" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | grep -v "ALERTA ARQUITETURAL" | grep -v "NUNCA" | grep -v "PROTEÇÃO" || true)
    
    if [ -n "$matches" ]; then
      echo ""
      echo "❌ VIOLAÇÃO ARQUITETURAL encontrada:"
      echo "$matches"
      echo ""
      echo "🚨 Landing Page NUNCA pode linkar para /login ou /onboarding."
      echo "   Use /app. FlowGate decide o resto."
      echo "   Ver: ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md"
      echo ""
      ERRORS=$((ERRORS + 1))
    fi
  done
done

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ Single Entry Policy validada com sucesso!"
  echo "   Todos os links na landing page apontam para /app"
  echo "   FlowGate e a unica autoridade de navegacao."
  exit 0
else
  echo "❌ ${ERRORS} violacao arquitetural encontrada"
  echo "   Corrija antes de fazer commit."
  exit 1
fi
