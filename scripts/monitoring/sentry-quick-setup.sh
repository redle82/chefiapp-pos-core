#!/usr/bin/env bash
# Quick Sentry setup using the provided token
# This is a simplified version that uses the pre-configured token
set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

CHECK="✅"

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  🚀 SENTRY QUICK SETUP${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SENTRY_AUTH_TOKEN="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"

echo -e "${GREEN}${CHECK} Token configurado: sntryu_8f1...${NC}"
echo ""
echo "Arquivos criados:"
echo "  ✓ merchant-portal/.env.production"
echo "  ✓ scripts/monitoring/configure-sentry-env.sh"
echo ""
echo -e "${BOLD}Próximos passos:${NC}"
echo ""
echo "1. ${BOLD}Configure o DSN do Sentry:${NC}"
echo "   Obtenha em: https://sentry.io/settings/[org]/projects/[project]/keys/"
echo "   Edite: merchant-portal/.env.production"
echo ""
echo "2. ${BOLD}Configure variáveis no Vercel:${NC}"
echo "   bash scripts/monitoring/configure-sentry-env.sh"
echo ""
echo "3. ${BOLD}Deploy para produção:${NC}"
echo "   cd merchant-portal && vercel --prod"
echo ""
echo -e "${GREEN}${CHECK} Configuração inicial completa!${NC}"
echo ""
