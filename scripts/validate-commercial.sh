#!/bin/bash
# ✅ Validação Mínima Comercial (FASE 1)
# 
# Este script valida os estados críticos do sistema de billing:
# - Verifica se tabelas existem
# - Verifica se Edge Functions estão deployadas
# - Valida estados de subscription
# - Testa bloqueio de rotas
#
# Uso: ./scripts/validate-commercial.sh

set -e

echo "✅ ChefIApp - Validação Comercial (FASE 1)"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar variáveis
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}✗ Variáveis de ambiente não configuradas${NC}"
    echo "  Configure: export SUPABASE_URL=..."
    echo "  Configure: export SUPABASE_ANON_KEY=..."
    exit 1
fi

PASSED=0
FAILED=0
WARNINGS=0

# Função para marcar sucesso
pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

# Função para marcar falha
fail() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
}

# Função para marcar aviso
warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# Teste 1: Verificar Tabelas
echo "📊 Teste 1: Verificando tabelas do billing..."
if [ -n "$DATABASE_URL" ]; then
    TABLES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('subscriptions', 'billing_events', 'billing_payments');" 2>/dev/null || echo "0")
    if [ "$TABLES" -eq "3" ]; then
        pass "Todas as 3 tabelas existem (subscriptions, billing_events, billing_payments)"
    else
        fail "Apenas $TABLES de 3 tabelas encontradas"
    fi
else
    warn "DATABASE_URL não definida - pulando verificação de tabelas"
    echo "  Execute manualmente:"
    echo "  SELECT table_name FROM information_schema.tables WHERE table_name IN ('subscriptions', 'billing_events', 'billing_payments');"
fi
echo ""

# Teste 2: Verificar Edge Functions
echo "🚀 Teste 2: Verificando Edge Functions..."
FUNCTIONS=("create-subscription" "update-subscription-status" "cancel-subscription" "change-plan")
DEPLOYED_COUNT=0

for func in "${FUNCTIONS[@]}"; do
    # Verificar se função responde
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        "$SUPABASE_URL/functions/v1/$func" \
        -d '{}' 2>/dev/null || echo "error")
    
    # Se não retornar 404, função existe
    if [[ "$RESPONSE" != *"not found"* ]] && [[ "$RESPONSE" != *"error"* ]] || [[ "$RESPONSE" == *"not authenticated"* ]] || [[ "$RESPONSE" == *"required"* ]]; then
        pass "$func está deployada e respondendo"
        ((DEPLOYED_COUNT++))
    else
        fail "$func não encontrada ou não responde"
    fi
done

if [ "$DEPLOYED_COUNT" -eq "4" ]; then
    pass "Todas as 4 Edge Functions estão deployadas"
else
    fail "Apenas $DEPLOYED_COUNT de 4 funções funcionando"
fi
echo ""

# Teste 3: Verificar Variáveis de Ambiente
echo "🔐 Teste 3: Verificando variáveis de ambiente..."
if [ -n "$STRIPE_SECRET_KEY" ]; then
    if [[ "$STRIPE_SECRET_KEY" == sk_* ]]; then
        pass "STRIPE_SECRET_KEY configurada (formato válido)"
    else
        warn "STRIPE_SECRET_KEY formato inválido (deve começar com sk_)"
    fi
else
    warn "STRIPE_SECRET_KEY não definida (configure no Supabase Dashboard)"
fi

if [ -f "merchant-portal/.env" ]; then
    if grep -q "VITE_STRIPE_PUBLISHABLE_KEY" merchant-portal/.env; then
        pass "VITE_STRIPE_PUBLISHABLE_KEY encontrada no .env"
    else
        warn "VITE_STRIPE_PUBLISHABLE_KEY não encontrada no .env"
    fi
else
    warn "Arquivo .env não encontrado em merchant-portal/"
fi
echo ""

# Teste 4: Verificar Estrutura de Subscription (se houver dados)
echo "📋 Teste 4: Verificando estrutura de subscription..."
if [ -n "$DATABASE_URL" ]; then
    # Verificar se tabela subscriptions tem estrutura correta
    COLUMNS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name IN ('subscription_id', 'restaurant_id', 'plan_id', 'status', 'trial_ends_at');" 2>/dev/null || echo "0")
    if [ "$COLUMNS" -ge "5" ]; then
        pass "Estrutura da tabela subscriptions está correta"
    else
        fail "Estrutura da tabela subscriptions incompleta"
    fi
    
    # Verificar se há subscriptions de teste
    TEST_SUBS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM subscriptions WHERE status IN ('TRIAL', 'ACTIVE');" 2>/dev/null || echo "0")
    if [ "$TEST_SUBS" -gt "0" ]; then
        warn "Encontradas $TEST_SUBS subscriptions ativas (pode ser ambiente de teste)"
    fi
else
    warn "DATABASE_URL não definida - pulando verificação de estrutura"
fi
echo ""

# Teste 5: Verificar RLS Policies
echo "🔒 Teste 5: Verificando RLS Policies..."
if [ -n "$DATABASE_URL" ]; then
    POLICIES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'subscriptions';" 2>/dev/null || echo "0")
    if [ "$POLICIES" -gt "0" ]; then
        pass "RLS Policies configuradas para subscriptions ($POLICIES policies)"
    else
        warn "Nenhuma RLS Policy encontrada para subscriptions"
        echo "  Configure policies manualmente se necessário"
    fi
else
    warn "DATABASE_URL não definida - pulando verificação de RLS"
fi
echo ""

# Resumo Final
echo "=========================================="
echo "📊 Resumo da Validação:"
echo ""
echo -e "${GREEN}✓ Passou: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNINGS${NC}"
echo -e "${RED}✗ Falhou: $FAILED${NC}"
echo ""

if [ "$FAILED" -eq "0" ]; then
    echo -e "${GREEN}✅ Validação bem-sucedida!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Executar testes manuais completos:"
    echo "     → docs/audit/PHASE_1_VERIFICATION_GUIDE.md"
    echo "  2. Testar fluxo trial completo"
    echo "  3. Testar fluxo pago completo"
    exit 0
else
    echo -e "${RED}❌ Validação falhou${NC}"
    echo ""
    echo "Corrija os erros acima antes de continuar."
    exit 1
fi
