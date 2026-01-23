# 🚀 FASE 1 — Guia de Deploy e Finalização

**Data:** 2026-01-30  
**Status:** 🟡 **85% COMPLETO** - Pronto para deploy

---

## 📋 Checklist de Deploy

### 1. Executar Migration do Banco de Dados

**Arquivo:** `supabase/migrations/20260130000000_create_billing_core_tables.sql`

**Opção A: Via Supabase Dashboard**
1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Copie e cole o conteúdo do arquivo de migration
4. Execute a query

**Opção B: Via CLI**
```bash
# Se estiver usando Supabase CLI local
supabase db push

# Ou execute diretamente no banco
psql $DATABASE_URL -f supabase/migrations/20260130000000_create_billing_core_tables.sql
```

**Verificar:**
```sql
-- Verificar se tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'billing_events', 'billing_payments');

-- Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('subscriptions', 'billing_events', 'billing_payments');
```

---

### 2. Configurar Variáveis de Ambiente

#### Supabase Dashboard (Edge Functions)

1. Acesse **Project Settings** → **Edge Functions** → **Secrets**
2. Adicione as seguintes variáveis:

```
STRIPE_SECRET_KEY=sk_test_xxx (ou sk_live_xxx em produção)
```

**Nota:** As variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` já estão disponíveis automaticamente.

#### Frontend (.env)

No arquivo `.env` do `merchant-portal`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx (ou pk_live_xxx em produção)
```

---

### 3. Deploy das Edge Functions

```bash
# Navegar para o diretório do projeto
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Deploy de cada função
npx supabase functions deploy create-subscription
npx supabase functions deploy update-subscription-status
npx supabase functions deploy cancel-subscription
npx supabase functions deploy change-plan
```

**Verificar deploy:**
```bash
# Listar funções deployadas
npx supabase functions list
```

---

### 4. Testar Edge Functions

#### Teste 1: create-subscription (Trial)

```bash
curl -X POST https://<project>.supabase.co/functions/v1/create-subscription \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "<restaurant_id>",
    "plan_id": "plan_starter_v1",
    "start_trial": true
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "subscription": { ... },
  "client_secret": null,
  "next_step": "TRIAL_STARTED"
}
```

#### Teste 2: create-subscription (Pago)

```bash
curl -X POST https://<project>.supabase.co/functions/v1/create-subscription \
  -H "Authorization: Bearer <anon_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "<restaurant_id>",
    "plan_id": "plan_professional_v1",
    "start_trial": false
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "subscription": { ... },
  "client_secret": "pi_xxx_secret_xxx",
  "next_step": "CONFIGURE_PAYMENT_METHOD"
}
```

---

### 5. Testar Fluxo Completo no Frontend

#### Teste 1: Fluxo Trial
1. Criar novo usuário
2. Completar OnboardingQuick
3. Escolher plano (trial)
4. Verificar subscription criada (status = TRIAL)
5. Acessar TPV (deve funcionar)

#### Teste 2: Fluxo Pago
1. Criar novo usuário
2. Completar OnboardingQuick
3. Escolher plano (pagar agora)
4. Configurar pagamento (Stripe)
5. Verificar subscription ACTIVE
6. Acessar TPV (deve funcionar)

#### Teste 3: Bloqueio sem Plano
1. Criar subscription SUSPENDED manualmente no banco
2. Tentar acessar TPV
3. Verificar redirecionamento para `/onboarding/billing`

#### Teste 4: Cancelamento
1. Acessar `/app/settings/billing`
2. Clicar em "Cancelar ao Final do Período"
3. Verificar subscription atualizada (status = CANCELLED)

#### Teste 5: Upgrade/Downgrade
1. Acessar `/app/settings/billing`
2. Clicar em "Upgrade" ou "Downgrade" em um plano
3. Verificar subscription atualizada (plan_id mudado)

---

## 🔍 Troubleshooting

### Erro: "Table 'subscriptions' does not exist"
**Solução:** Executar migration `20260130000000_create_billing_core_tables.sql`

### Erro: "User is not the owner of this restaurant"
**Solução:** Verificar se `restaurant.owner_id` corresponde ao `user.id` autenticado

### Erro: "STRIPE_SECRET_KEY is not defined"
**Solução:** Configurar variável de ambiente no Supabase Dashboard

### Erro: "VITE_STRIPE_PUBLISHABLE_KEY is not defined"
**Solução:** Adicionar no `.env` do frontend

### Subscription não aparece no frontend
**Solução:** 
- Verificar RLS policies
- Verificar se `restaurant_id` está correto no localStorage
- Verificar console do navegador para erros

---

## ✅ Critérios de Sucesso

**FASE 1 está completa quando:**
1. ✅ Migration executada com sucesso
2. ✅ Edge Functions deployadas e funcionando
3. ✅ Variáveis de ambiente configuradas
4. ✅ Fluxo trial funciona end-to-end
5. ✅ Fluxo pago funciona end-to-end
6. ✅ Bloqueio sem plano funciona
7. ✅ Cancelamento funciona
8. ✅ Upgrade/downgrade funciona

---

## 📊 Status Atual

**85% completo**

- ✅ Código implementado (100%)
- ✅ Migration criada (100%)
- 🔴 Migration executada (0%)
- 🔴 Edge Functions deployadas (0%)
- 🔴 Variáveis configuradas (0%)
- 🔴 Testes executados (0%)

---

## 🎯 Próximos Passos Após Deploy

1. **Testar todos os fluxos** (1-2 horas)
2. **Ajustes finais** (se necessário)
3. **Marcar FASE 1 como completa** ✅
4. **Iniciar FASE 2** — Onboarding com Primeira Venda

---

**Tempo estimado para finalizar:** 1-2 horas (deploy + testes)
