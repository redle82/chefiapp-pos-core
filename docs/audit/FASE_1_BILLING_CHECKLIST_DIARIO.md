# FASE 1 — BILLING — CHECKLIST DIÁRIO EXECUTÁVEL

**Data de Início:** 2026-01-18  
**Status:** 🟡 **90% COMPLETO** (Código pronto, pendente deploy e testes)  
**Duração Estimada:** 2-3 dias (deploy + testes)

---

## 🎯 OBJETIVO FINAL

**ChefIApp pode ser vendido (self-service) sem intervenção manual.**

**Critério de Pronto:**
- ✅ Usuário não pode acessar TPV sem subscription (TRIAL ou ACTIVE)
- ✅ Onboarding inclui escolha de plano obrigatória
- ✅ Trial é ativado automaticamente após escolher plano
- ✅ Checkout funciona (Stripe Elements integrado)
- ✅ Cancelamento e upgrade funcionam
- ✅ Estados PAST_DUE e SUSPENDED bloqueiam operação corretamente

---

## ✅ O QUE JÁ ESTÁ PRONTO (90%)

### Backend Core
- ✅ `billing-core/StripeBillingService.ts` — Serviço completo
- ✅ `billing-core/types.ts` — Planos definidos (STARTER €29, PRO €59, ENTERPRISE €149)
- ✅ `billing-core/state-machine.ts` — Máquina de estados
- ✅ `billing-core/FeatureGateService.ts` — Controle de features por plano

### Frontend
- ✅ `BillingStep.tsx` — Escolher plano
- ✅ `CheckoutStep.tsx` — Configurar pagamento (Stripe)
- ✅ `TrialStart.tsx` — Ativar trial
- ✅ `useSubscription.ts` — Hook para gerenciar subscription
- ✅ `BillingPage.tsx` — Cancelamento e upgrade/downgrade
- ✅ `RequireActivation.tsx` — Verifica subscription status

### Edge Functions (Criadas)
- ✅ `supabase/functions/stripe-billing/index.ts` — Billing principal
- ✅ `supabase/functions/stripe-billing-webhook/index.ts` — Webhook handler

### Database
- ✅ Migration: `20260130000000_create_billing_core_tables.sql` (ou similar)
- ✅ Tabelas: `subscriptions`, `billing_events`, `billing_payments`

---

## 🔴 O QUE FALTA (10%)

### 1. Deploy das Edge Functions
### 2. Executar/Verificar Migrations
### 3. Configurar Variáveis de Ambiente
### 4. Testes Manuais Completos

---

## 📋 CHECKLIST DIÁRIO — DIA 1 (Deploy)

### Manhã (2-3 horas)

#### 1. Verificar Migrations
```bash
# Verificar se migration foi executada
cd supabase/migrations
ls -la | grep billing

# Se não existir, verificar billing-core/event-store.ts
# Copiar SQL para nova migration se necessário
```

**Checklist:**
- [ ] Migration existe em `supabase/migrations/`
- [ ] Tabelas criadas: `subscriptions`, `billing_events`, `billing_payments`
- [ ] RLS policies configuradas
- [ ] Índices criados

**Comando de verificação:**
```sql
-- Executar no Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'billing_events', 'billing_payments');
```

#### 2. Deploy Edge Functions
```bash
# Deploy stripe-billing
npx supabase functions deploy stripe-billing

# Deploy stripe-billing-webhook
npx supabase functions deploy stripe-billing-webhook
```

**Checklist:**
- [ ] `stripe-billing` deployado sem erros
- [ ] `stripe-billing-webhook` deployado sem erros
- [ ] Logs mostram sucesso

**Verificação:**
```bash
# Listar functions deployadas
npx supabase functions list
```

#### 3. Configurar Variáveis de Ambiente

**No Supabase Dashboard (Edge Functions):**
- [ ] `STRIPE_SECRET_KEY` — Sua API key do Stripe (sk_test_xxx ou sk_live_xxx)
- [ ] `STRIPE_WEBHOOK_SECRET` — Webhook secret (whsec_xxx)

**No Frontend (.env):**
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` — Publishable key (pk_test_xxx ou pk_live_xxx)

**Checklist:**
- [ ] Variáveis configuradas no Supabase Dashboard
- [ ] Variáveis configuradas no `.env` do frontend
- [ ] Testar se variáveis são lidas corretamente

**Comando de verificação:**
```bash
# No Supabase Dashboard → Edge Functions → Settings
# Verificar se variáveis aparecem na lista
```

### Tarde (2-3 horas)

#### 4. Configurar Webhook no Stripe Dashboard

**Checklist:**
- [ ] Acessar Stripe Dashboard → Developers → Webhooks
- [ ] Criar novo endpoint webhook
- [ ] URL: `https://[seu-projeto].supabase.co/functions/v1/stripe-billing-webhook`
- [ ] Eventos a escutar:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- [ ] Copiar webhook secret (`whsec_xxx`)
- [ ] Adicionar `STRIPE_WEBHOOK_SECRET` no Supabase Dashboard

#### 5. Teste Básico de Deploy

**Checklist:**
- [ ] Testar Edge Function `stripe-billing` manualmente
- [ ] Testar Edge Function `stripe-billing-webhook` com evento de teste
- [ ] Verificar logs no Supabase Dashboard

**Comando de teste:**
```bash
# Testar create-checkout-session
curl -X POST https://[seu-projeto].supabase.co/functions/v1/stripe-billing \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"action": "create-checkout-session", "plan": "STARTER"}'
```

---

## 📋 CHECKLIST DIÁRIO — DIA 2 (Testes)

### Manhã (3-4 horas)

#### 1. Teste: Fluxo Completo (Trial)

**Checklist:**
- [ ] Criar novo usuário (email não usado antes)
- [ ] Completar OnboardingQuick
- [ ] Escolher plano (STARTER, PRO ou ENTERPRISE)
- [ ] Verificar se trial é ativado automaticamente
- [ ] Verificar se subscription aparece em `subscriptions` table
- [ ] Acessar TPV (deve funcionar)
- [ ] Verificar se `RequireActivation` permite acesso

**Passos:**
1. Abrir `http://localhost:5173` (ou URL de produção)
2. Criar conta nova
3. Completar onboarding
4. Escolher plano
5. Verificar no Supabase Dashboard → Table Editor → `subscriptions`
6. Tentar acessar `/app/tpv`

#### 2. Teste: Fluxo Completo (Pago)

**Checklist:**
- [ ] Criar novo usuário
- [ ] Completar OnboardingQuick
- [ ] Escolher plano (pagar agora)
- [ ] Configurar pagamento (Stripe Elements)
- [ ] Processar pagamento
- [ ] Verificar se subscription fica ACTIVE
- [ ] Acessar TPV (deve funcionar)

**Passos:**
1. Usar cartão de teste do Stripe: `4242 4242 4242 4242`
2. Data: qualquer data futura
3. CVC: qualquer 3 dígitos
4. Verificar no Stripe Dashboard → Customers → Subscriptions

#### 3. Teste: Bloqueio sem Plano

**Checklist:**
- [ ] Criar subscription com status `SUSPENDED` (manualmente no banco)
- [ ] Tentar acessar TPV (deve bloquear)
- [ ] Verificar mensagem de bloqueio
- [ ] Verificar redirecionamento para billing

**Comando SQL:**
```sql
-- Criar subscription SUSPENDED para teste
UPDATE subscriptions 
SET status = 'SUSPENDED' 
WHERE restaurant_id = '[id-do-restaurante-teste]';
```

### Tarde (2-3 horas)

#### 4. Teste: Cancelamento

**Checklist:**
- [ ] Acessar `/app/settings/billing`
- [ ] Clicar em "Cancelar Assinatura"
- [ ] Verificar se subscription fica `CANCELLED`
- [ ] Verificar se acesso ao TPV é bloqueado
- [ ] Verificar redirecionamento para billing

#### 5. Teste: Upgrade/Downgrade

**Checklist:**
- [ ] Acessar `/app/settings/billing`
- [ ] Clicar em "Upgrade" (STARTER → PRO)
- [ ] Verificar se subscription é atualizada
- [ ] Verificar se features são desbloqueadas
- [ ] Testar downgrade (PRO → STARTER)

#### 6. Teste: Webhook Events

**Checklist:**
- [ ] Simular `checkout.session.completed` no Stripe Dashboard
- [ ] Verificar se subscription é criada
- [ ] Simular `invoice.payment_failed`
- [ ] Verificar se subscription fica `PAST_DUE`
- [ ] Verificar se acesso é bloqueado

**Passos:**
1. Stripe Dashboard → Developers → Webhooks
2. Selecionar webhook endpoint
3. "Send test webhook"
4. Escolher evento
5. Verificar logs no Supabase Dashboard

---

## 📋 CHECKLIST DIÁRIO — DIA 3 (Validação Final)

### Manhã (2-3 horas)

#### 1. Teste de Regressão

**Checklist:**
- [ ] Testar fluxo completo novamente (trial)
- [ ] Testar fluxo completo novamente (pago)
- [ ] Verificar se nada quebrou
- [ ] Verificar performance (tempo de resposta)

#### 2. Documentação

**Checklist:**
- [ ] Atualizar `docs/audit/FASE_1_STATUS.md` com status final
- [ ] Documentar problemas encontrados e soluções
- [ ] Criar guia de troubleshooting se necessário

### Tarde (1-2 horas)

#### 3. Validação Final

**Checklist:**
- [ ] Todos os testes passaram
- [ ] Nenhum erro crítico
- [ ] Performance aceitável
- [ ] Documentação atualizada

**Critério de Pronto:**
- ✅ Usuário não pode acessar TPV sem subscription
- ✅ Onboarding inclui escolha de plano
- ✅ Trial automático funciona
- ✅ Checkout Stripe funciona
- ✅ Cancelamento funciona
- ✅ Upgrade/downgrade funciona
- ✅ Bloqueio funciona (SUSPENDED, PAST_DUE)

---

## 🚨 TROUBLESHOOTING

### Problema: Edge Function não deploya
**Solução:**
```bash
# Verificar se está logado
npx supabase login

# Verificar projeto
npx supabase projects list

# Linkar projeto
npx supabase link --project-ref [project-ref]
```

### Problema: Webhook não recebe eventos
**Solução:**
1. Verificar URL do webhook no Stripe Dashboard
2. Verificar `STRIPE_WEBHOOK_SECRET` no Supabase Dashboard
3. Verificar logs no Supabase Dashboard → Edge Functions → Logs

### Problema: Subscription não é criada
**Solução:**
1. Verificar se migration foi executada
2. Verificar se tabela `subscriptions` existe
3. Verificar logs da Edge Function
4. Verificar se `restaurant_id` está correto

### Problema: Bloqueio não funciona
**Solução:**
1. Verificar `RequireActivation.tsx`
2. Verificar se subscription status está correto
3. Verificar se RLS policies permitem leitura

---

## 📊 MÉTRICAS DE SUCESSO

### Técnicas
- ✅ Edge Functions deployadas sem erros
- ✅ Migrations executadas sem erros
- ✅ Variáveis de ambiente configuradas
- ✅ Webhook recebendo eventos

### Funcionais
- ✅ Trial automático funciona
- ✅ Checkout Stripe funciona
- ✅ Cancelamento funciona
- ✅ Upgrade/downgrade funciona
- ✅ Bloqueio funciona

### Performance
- ✅ Tempo de resposta < 2s para criar subscription
- ✅ Tempo de resposta < 1s para verificar subscription

---

## 🎯 PRÓXIMO PASSO APÓS FASE 1

**FASE 2 — Onboarding com Primeira Venda**
- Menu de exemplo
- Tutorial de primeira venda
- Modo demo no TPV

---

**CHECKLIST CRIADO:** 2026-01-18  
**PRÓXIMA REVISÃO:** Após execução do Dia 1
