#!/bin/bash
# Visual Validation Orchestrator - ChefIApp
# 
# Sobe todos os pontos de visualização do sistema para validação completa
# 
# Usage: ./scripts/visual-validation-orchestrator.sh [--skip-mobile]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ChefIApp - Visual Validation Orchestrator                ║${NC}"
echo -e "${BLUE}║  Sistema Completo: TPV + KDS + Dashboard + Mobile       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# 1. Verificar Ambiente
# =============================================================================

echo -e "${YELLOW}1️⃣ Verificando ambiente...${NC}"

# Check Supabase
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI não encontrado${NC}"
    exit 1
fi

# Check if Supabase is running
if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase local não está rodando. Iniciando...${NC}"
    cd "$PROJECT_ROOT"
    supabase start
else
    echo -e "${GREEN}✅ Supabase local está rodando${NC}"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    exit 1
fi

# Check if restaurant exists
echo -e "${YELLOW}   Verificando restaurante piloto...${NC}"
cd "$PROJECT_ROOT"
RESTAURANT_EXISTS=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);
supabase.from('gm_restaurants').select('id').limit(1).then(({ data }) => {
  console.log(data && data.length > 0 ? 'YES' : 'NO');
  process.exit(0);
}).catch(() => {
  console.log('NO');
  process.exit(0);
});
" 2>/dev/null | tail -1)

if [ "$RESTAURANT_EXISTS" != "YES" ]; then
    echo -e "${YELLOW}⚠️  Restaurante piloto não encontrado. Criando...${NC}"
    npx ts-node scripts/setup-pilot-restaurant.ts
else
    echo -e "${GREEN}✅ Restaurante piloto existe${NC}"
fi

echo ""

# =============================================================================
# 2. Obter Restaurant ID
# =============================================================================

echo -e "${YELLOW}2️⃣ Obtendo Restaurant ID...${NC}"
RESTAURANT_ID=$(npx ts-node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  { auth: { persistSession: false } }
);
supabase.from('gm_restaurants').select('id').limit(1).single().then(({ data }) => {
  if (data) console.log(data.id);
  process.exit(0);
}).catch(() => {
  process.exit(1);
});
" 2>/dev/null | tail -1)

if [ -z "$RESTAURANT_ID" ]; then
    echo -e "${RED}❌ Não foi possível obter Restaurant ID${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Restaurant ID: ${RESTAURANT_ID}${NC}"
echo ""

# =============================================================================
# 3. URLs Esperadas
# =============================================================================

echo -e "${BLUE}3️⃣ URLs de Acesso:${NC}"
echo ""
echo -e "${GREEN}📊 Dashboard:${NC}     http://localhost:5173/app/dashboard"
echo -e "${GREEN}💰 TPV:${NC}          http://localhost:5173/app/tpv"
echo -e "${GREEN}🍳 KDS:${NC}          http://localhost:5173/app/kds/${RESTAURANT_ID}"
echo ""

# =============================================================================
# 4. Iniciar Merchant Portal
# =============================================================================

echo -e "${YELLOW}4️⃣ Iniciando Merchant Portal (Web)...${NC}"
cd "$PROJECT_ROOT/merchant-portal"

# Check if already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Merchant Portal já está rodando na porta 5173${NC}"
else
    echo -e "${GREEN}   Iniciando servidor de desenvolvimento...${NC}"
    npm run dev > /tmp/merchant-portal.log 2>&1 &
    MERCHANT_PORTAL_PID=$!
    echo $MERCHANT_PORTAL_PID > /tmp/merchant-portal.pid
    
    # Wait for server to start
    echo -e "${YELLOW}   Aguardando servidor iniciar...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Merchant Portal rodando (PID: $MERCHANT_PORTAL_PID)${NC}"
            break
        fi
        sleep 1
    done
fi

echo ""

# =============================================================================
# 5. Iniciar Mobile Apps (Opcional)
# =============================================================================

SKIP_MOBILE=false
if [[ "$*" == *"--skip-mobile"* ]]; then
    SKIP_MOBILE=true
fi

if [ "$SKIP_MOBILE" = false ]; then
    echo -e "${YELLOW}5️⃣ Iniciando Mobile Apps...${NC}"
    cd "$PROJECT_ROOT/mobile-app"
    
    # Check if Expo is installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  Instalando dependências do mobile app...${NC}"
        npm install
    fi
    
    echo -e "${GREEN}   Para iniciar iOS:${NC}"
    echo -e "   ${BLUE}cd mobile-app && npx expo run:ios${NC}"
    echo ""
    echo -e "${GREEN}   Para iniciar Android:${NC}"
    echo -e "   ${BLUE}cd mobile-app && npx expo run:android${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Mobile apps devem ser iniciados manualmente${NC}"
else
    echo -e "${YELLOW}5️⃣ Pulando Mobile Apps (--skip-mobile)${NC}"
fi

echo ""

# =============================================================================
# 6. Resumo Final
# =============================================================================

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ✅ Sistema Pronto para Visualização                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Dashboard:${NC}     http://localhost:5173/app/dashboard"
echo -e "${GREEN}💰 TPV:${NC}          http://localhost:5173/app/tpv"
echo -e "${GREEN}🍳 KDS:${NC}          http://localhost:5173/app/kds/${RESTAURANT_ID}"
echo ""
echo -e "${YELLOW}📝 Restaurant ID: ${RESTAURANT_ID}${NC}"
echo ""
echo -e "${BLUE}🧪 Próximo Passo:${NC}"
echo -e "   Execute o script de teste visual:"
echo -e "   ${BLUE}./scripts/visual-validation-test.sh${NC}"
echo ""
echo -e "${YELLOW}⚠️  Para parar o Merchant Portal:${NC}"
echo -e "   ${BLUE}kill \$(cat /tmp/merchant-portal.pid)${NC}"
echo ""
