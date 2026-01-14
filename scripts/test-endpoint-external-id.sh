#!/bin/bash

# TESTE DO ENDPOINT /api/fiscal/pending-external-ids
# Exemplo de chamada com autenticação

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     TESTE DO ENDPOINT /api/fiscal/pending-external-ids      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar variáveis
if [ -z "$RESTAURANT_ID" ]; then
    echo -e "${YELLOW}⚠️  RESTAURANT_ID não definido${NC}"
    echo "   Defina: export RESTAURANT_ID='<uuid>'"
    echo ""
    echo -e "${CYAN}Ou use como parâmetro:${NC}"
    echo "   ./scripts/test-endpoint-external-id.sh <restaurant-id>"
    exit 1
fi

RESTAURANT_ID=${1:-$RESTAURANT_ID}
API_URL=${API_URL:-"http://localhost:4320"}

echo -e "${CYAN}📡 Testando endpoint...${NC}"
echo -e "   URL: ${API_URL}/api/fiscal/pending-external-ids"
echo -e "   Restaurant ID: ${RESTAURANT_ID}"
echo ""

# Fazer requisição
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "${API_URL}/api/fiscal/pending-external-ids?restaurantId=${RESTAURANT_ID}" \
  -H "x-restaurant-id: ${RESTAURANT_ID}" \
  -H "Content-Type: application/json")

# Separar body e status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo -e "${CYAN}📊 Resposta:${NC}"
echo "   Status: ${HTTP_CODE}"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Endpoint funcionando${NC}"
    echo ""
    echo -e "${CYAN}📋 Dados retornados:${NC}"
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
    
    # Extrair contagens
    PENDING=$(echo "$HTTP_BODY" | jq -r '.pending | length' 2>/dev/null || echo "0")
    FAILED=$(echo "$HTTP_BODY" | jq -r '.failed | length' 2>/dev/null || echo "0")
    TOTAL=$(echo "$HTTP_BODY" | jq -r '.total' 2>/dev/null || echo "0")
    
    echo ""
    echo -e "${CYAN}📊 Resumo:${NC}"
    echo "   Pending: ${PENDING}"
    echo "   Failed: ${FAILED}"
    echo "   Total: ${TOTAL}"
    
    if [ "$TOTAL" -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  Há ${TOTAL} pedido(s) aguardando External ID${NC}"
    else
        echo ""
        echo -e "${GREEN}✅ Nenhum pedido pendente${NC}"
    fi
else
    echo -e "${RED}❌ Endpoint retornou erro${NC}"
    echo "$HTTP_BODY"
    exit 1
fi
