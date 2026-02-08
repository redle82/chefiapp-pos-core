#!/bin/bash
# Setup UI v2 - ChefIApp
#
# Instala dependências e configura ambiente para UI v2
#
# Usage: ./scripts/setup-ui-v2.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
UI_V2_DIR="$PROJECT_ROOT/merchant-portal-v2"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ChefIApp UI v2 - Setup                                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se diretório existe
if [ ! -d "$UI_V2_DIR" ]; then
    echo -e "${RED}❌ Diretório merchant-portal-v2 não encontrado${NC}"
    exit 1
fi

cd "$UI_V2_DIR"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    exit 1
fi

echo -e "${YELLOW}1️⃣ Instalando dependências...${NC}"
npm install

echo ""
echo -e "${YELLOW}2️⃣ Configurando variáveis de ambiente...${NC}"

# Criar .env se não existir
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
else
    echo -e "${YELLOW}⚠️  Arquivo .env já existe${NC}"
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ UI v2 Configurada                                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Para iniciar a UI v2:${NC}"
echo -e "   ${BLUE}cd merchant-portal-v2 && npm run dev${NC}"
echo ""
echo -e "${GREEN}URL esperada:${NC}"
echo -e "   ${BLUE}http://localhost:5174${NC}"
echo ""
