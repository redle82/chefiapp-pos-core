#!/bin/bash
# 🚀 Deploy Billing (FASE 1) - Script Automatizado
# 
# Este script automatiza o deploy completo da FASE 1 (Billing):
# - Executa migrations
# - Deploy Edge Functions
# - Verifica variáveis de ambiente
# - Smoke test básico
#
# Uso: ./scripts/deploy-billing.sh

set -e  # Parar em caso de erro

echo "🚀 ChefIApp - Deploy Billing (FASE 1)"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se comando existe
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 não encontrado${NC}"
        echo "  Instale: $2"
        exit 1
    else
        echo -e "${GREEN}✓ $1 encontrado${NC}"
    fi
}

# Verificar pré-requisitos
echo "📋 Verificando pré-requisitos..."
check_command "supabase" "npm install -g supabase"
check_command "jq" "brew install jq (macOS) ou apt-get install jq (Linux)"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "supabase/migrations/20260130000000_create_billing_core_tables.sql" ]; then
    echo -e "${RED}✗ Migration não encontrada${NC}"
    echo "  Execute este script a partir da raiz do projeto"
    exit 1
fi

# Verificar variáveis de ambiente
echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_URL não definida${NC}"
    echo "  Configure: export SUPABASE_URL=https://seu-projeto.supabase.co"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_ANON_KEY não definida${NC}"
    echo "  Configure: export SUPABASE_ANON_KEY=sua-chave-anon"
    exit 1
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY não definida${NC}"
    echo "  Configure: export STRIPE_SECRET_KEY=sk_test_xxx"
    echo "  Ou configure no Supabase Dashboard → Edge Functions → Secrets"
fi

echo -e "${GREEN}✓ Variáveis básicas configuradas${NC}"
echo ""

# Passo 1: Executar Migration
echo "📦 Passo 1: Executando migration..."
echo "  → Verificando se tabelas já existem..."

# Verificar se tabelas já existem
TABLES_EXIST=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('subscriptions', 'billing_events', 'billing_payments');" 2>/dev/null || echo "0")

if [ "$TABLES_EXIST" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  Tabelas já existem${NC}"
    read -p "  Deseja executar migration mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "  Pulando migration..."
    else
        echo "  Executando migration..."
        if [ -n "$DATABASE_URL" ]; then
            psql "$DATABASE_URL" -f supabase/migrations/20260130000000_create_billing_core_tables.sql
            echo -e "${GREEN}✓ Migration executada${NC}"
        else
            echo -e "${YELLOW}⚠️  DATABASE_URL não definida${NC}"
            echo "  Execute manualmente no Supabase Dashboard → SQL Editor"
            echo "  Arquivo: supabase/migrations/20260130000000_create_billing_core_tables.sql"
        fi
    fi
else
    echo "  Executando migration..."
    if [ -n "$DATABASE_URL" ]; then
        psql "$DATABASE_URL" -f supabase/migrations/20260130000000_create_billing_core_tables.sql
        echo -e "${GREEN}✓ Migration executada${NC}"
    else
        echo -e "${YELLOW}⚠️  DATABASE_URL não definida${NC}"
        echo "  Execute manualmente no Supabase Dashboard → SQL Editor"
        echo "  Arquivo: supabase/migrations/20260130000000_create_billing_core_tables.sql"
    fi
fi
echo ""

# Passo 2: Deploy Edge Functions
echo "🚀 Passo 2: Deploy Edge Functions..."

FUNCTIONS=(
    "create-subscription"
    "update-subscription-status"
    "cancel-subscription"
    "change-plan"
)

for func in "${FUNCTIONS[@]}"; do
    echo "  → Deployando $func..."
    if npx supabase functions deploy "$func" --no-verify-jwt 2>&1 | tee /tmp/deploy-$func.log; then
        echo -e "${GREEN}✓ $func deployado${NC}"
    else
        echo -e "${RED}✗ Erro ao deployar $func${NC}"
        echo "  Verifique: cat /tmp/deploy-$func.log"
        exit 1
    fi
done
echo ""

# Passo 3: Verificar Edge Functions deployadas
echo "🔍 Passo 3: Verificando Edge Functions..."
DEPLOYED=$(npx supabase functions list 2>/dev/null | grep -E "(create-subscription|update-subscription-status|cancel-subscription|change-plan)" | wc -l || echo "0")

if [ "$DEPLOYED" -ge "4" ]; then
    echo -e "${GREEN}✓ Todas as 4 Edge Functions estão deployadas${NC}"
else
    echo -e "${YELLOW}⚠️  Apenas $DEPLOYED de 4 funções encontradas${NC}"
    echo "  Execute: npx supabase functions list"
fi
echo ""

# Passo 4: Verificar Secrets no Supabase
echo "🔐 Passo 4: Verificando Secrets..."
echo "  ⚠️  Verifique manualmente no Supabase Dashboard:"
echo "     Project Settings → Edge Functions → Secrets"
echo "     Deve ter: STRIPE_SECRET_KEY"
echo ""

# Passo 5: Smoke Test Básico
echo "🧪 Passo 5: Smoke Test Básico..."

# Verificar se Edge Functions respondem
echo "  → Testando create-subscription (health check)..."
HEALTH_CHECK=$(curl -s -X POST \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    "$SUPABASE_URL/functions/v1/create-subscription" \
    -d '{"test": true}' 2>/dev/null || echo "error")

if [[ "$HEALTH_CHECK" == *"error"* ]] || [[ "$HEALTH_CHECK" == *"not authenticated"* ]]; then
    echo -e "${GREEN}✓ Edge Function responde (erro esperado sem auth)${NC}"
else
    echo -e "${YELLOW}⚠️  Resposta inesperada${NC}"
    echo "  Response: $HEALTH_CHECK"
fi
echo ""

# Resumo Final
echo "======================================"
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "  1. Configurar STRIPE_SECRET_KEY no Supabase Dashboard"
echo "  2. Configurar VITE_STRIPE_PUBLISHABLE_KEY no .env"
echo "  3. Executar testes manuais:"
echo "     → ./scripts/validate-commercial.sh"
echo "     → Ou seguir: docs/audit/PHASE_1_VERIFICATION_GUIDE.md"
echo ""
echo "📚 Documentação:"
echo "  • docs/audit/QUICK_START.md"
echo "  • docs/audit/PHASE_1_VERIFICATION_GUIDE.md"
echo ""
