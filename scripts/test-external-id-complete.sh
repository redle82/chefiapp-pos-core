#!/bin/bash

# TESTE COMPLETO DE EXTERNAL ID RETRY
# Valida os 3 piores cenários antes de aplicar em produção

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     TESTE COMPLETO DE EXTERNAL ID RETRY                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verificar se DATABASE_URL está definido
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL não definido${NC}"
    echo "   Defina: export DATABASE_URL='postgresql://...'"
    exit 1
fi

echo -e "${CYAN}📋 Passo 1: Verificar se migration foi aplicada...${NC}"
psql "$DATABASE_URL" -c "
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'gm_fiscal_queue' 
    AND column_name = 'external_id_status'
" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration não aplicada!${NC}"
    echo -e "${YELLOW}   Aplicando migration...${NC}"
    psql "$DATABASE_URL" -f supabase/migrations/20260124000001_add_external_id_status.sql
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao aplicar migration${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Migration aplicada${NC}"
else
    echo -e "${GREEN}✅ Migration já aplicada${NC}"
fi

echo ""
echo -e "${CYAN}📋 Passo 2: Verificar view v_fiscal_pending_external_ids...${NC}"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM public.v_fiscal_pending_external_ids" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ View existe e funciona${NC}"
else
    echo -e "${RED}❌ View não existe ou tem erro${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}📋 Passo 3: Rodar testes de integração...${NC}"
npm test -- tests/integration/external-id-retry-complete.test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ TODOS OS TESTES PASSARAM                                ║${NC}"
    echo -e "${GREEN}║                                                              ║${NC}"
    echo -e "${GREEN}║  Sistema pronto para produção!                               ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
else
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ TESTES FALHARAM                                          ║${NC}"
    echo -e "${RED}║                                                              ║${NC}"
    echo -e "${RED}║  Corrija os problemas antes de aplicar em produção          ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}📋 Passo 4: Verificar endpoint API...${NC}"
echo -e "${YELLOW}   (Execute manualmente após iniciar servidor)${NC}"
echo ""
echo "   curl http://localhost:4320/api/fiscal/pending-external-ids?restaurantId=<ID>"
echo ""
