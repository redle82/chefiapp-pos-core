# 📊 FASE 1 — Status de Implementação (Billing)

**Data:** 2026-01-30  
**Status:** 🟡 **EM PROGRESSO**  
**Progresso:** 70% completo (2026-01-30 - Edge Functions criadas)

---

## ✅ Componentes Criados

### 1. Hook useSubscription ✅
- **Arquivo:** `merchant-portal/src/hooks/useSubscription.ts`
- **Status:** Criado
- **Funcionalidades:**
  - Buscar subscription atual
  - Verificar status (isActive, isBlocked)
  - Estrutura para criar subscription (precisa Edge Function)

### 2. BillingStep.tsx ✅
- **Arquivo:** `merchant-portal/src/pages/Onboarding/BillingStep.tsx`
- **Status:** Criado
- **Funcionalidades:**
  - Lista 3 planos (STARTER, PRO, ENTERPRISE)
  - Mostra features por plano
  - Botão "Começar Trial" / "Pagar Agora"
  - ⚠️ **Pendente:** Edge Function `create-subscription`

### 3. CheckoutStep.tsx ✅
- **Arquivo:** `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx`
- **Status:** Criado
- **Funcionalidades:**
  - Integração Stripe Elements
  - Formulário de cartão
  - Confirmação de pagamento
  - ⚠️ **Pendente:** Edge Function `update-subscription-status`

### 4. TrialStart.tsx ✅
- **Arquivo:** `merchant-portal/src/pages/Onboarding/TrialStart.tsx`
- **Status:** Criado
- **Funcionalidades:**
  - Mostra data de término do trial
  - Botão "Continuar para Dashboard"
  - Botão opcional "Configurar Método de Pagamento"

---

## ✅ Atualizações Realizadas

### 1. OnboardingQuick.tsx ✅
- **Mudança:** Redireciona para `/onboarding/billing` após completar
- **Status:** Atualizado

### 2. App.tsx ✅
- **Mudança:** Adicionadas rotas `/onboarding/billing`, `/onboarding/checkout`, `/onboarding/trial-start`
- **Status:** Atualizado

### 3. RequireActivation.tsx ✅
- **Mudança:** Verifica subscription status (TRIAL, ACTIVE, SUSPENDED, CANCELLED)
- **Status:** Atualizado
- **Funcionalidades:**
  - Bloqueia acesso se SUSPENDED ou CANCELLED
  - Permite acesso se TRIAL ou ACTIVE
  - Redireciona para billing se bloqueado

---

## 🔴 Pendências Críticas

### 1. Edge Functions Necessárias

#### create-subscription
- **Arquivo:** `supabase/functions/create-subscription/index.ts` (NOVO)
- **Funcionalidade:** Chama `RestaurantOnboardingService.createSubscription()`
- **Status:** 🔴 NÃO CRIADO

#### update-subscription-status
- **Arquivo:** `supabase/functions/update-subscription-status/index.ts` (NOVO)
- **Funcionalidade:** Atualiza subscription após pagamento confirmado
- **Status:** 🔴 NÃO CRIADO

### 2. Verificação de Tabela

- [ ] Verificar se tabela `subscriptions` existe no banco
- [ ] Se não existir, executar migration `billing-core/event-store.ts` (BILLING_SCHEMA_SQL)
- [ ] Verificar RLS policies na tabela `subscriptions`

### 3. Variáveis de Ambiente

- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` configurada
- [ ] `STRIPE_SECRET_KEY` configurada no Edge Function
- [ ] `STRIPE_WEBHOOK_SECRET` configurada

### 4. Proteção de Rotas Críticas

- [ ] Verificar se rotas `/app/tpv`, `/app/dashboard`, `/app/menu`, `/app/kds` estão protegidas
- [ ] Testar bloqueio com subscription SUSPENDED

### 5. BillingPage.tsx

- [ ] Adicionar cancelamento
- [ ] Adicionar upgrade/downgrade
- [ ] Integrar com Stripe Customer Portal

---

## 📋 Próximos Passos

### Imediato (Hoje)
1. Criar Edge Function `create-subscription`
2. Criar Edge Function `update-subscription-status`
3. Verificar/criar tabela `subscriptions` no banco
4. Configurar variáveis de ambiente Stripe

### Curto Prazo (Esta Semana)
5. Testar fluxo completo: Login → Onboarding → Billing → Dashboard
6. Testar trial automático
7. Testar checkout Stripe
8. Testar bloqueio sem plano ativo
9. Atualizar BillingPage.tsx (cancelamento/upgrade)

---

## 🧪 Testes Necessários

### Teste 1: Fluxo Completo (Trial)
- [ ] Criar novo usuário
- [ ] Completar OnboardingQuick
- [ ] Escolher plano (trial)
- [ ] Verificar trial ativado
- [ ] Acessar TPV (deve funcionar)

### Teste 2: Fluxo Completo (Pago)
- [ ] Criar novo usuário
- [ ] Completar OnboardingQuick
- [ ] Escolher plano (pagar agora)
- [ ] Configurar pagamento
- [ ] Verificar subscription ACTIVE
- [ ] Acessar TPV (deve funcionar)

### Teste 3: Bloqueio sem Plano
- [ ] Criar subscription SUSPENDED
- [ ] Tentar acessar TPV
- [ ] Verificar bloqueio e redirecionamento para billing

---

## 📊 Progresso Atual

**70% completo**

- ✅ Componentes frontend criados (BillingStep, CheckoutStep, TrialStart)
- ✅ Hook useSubscription criado
- ✅ Rotas adicionadas no App.tsx
- ✅ RequireActivation atualizado
- ✅ OnboardingQuick atualizado
- ✅ Edge Functions criadas (create-subscription, update-subscription-status)
- 🔴 Edge Functions não deployadas
- 🔴 Tabela subscriptions não verificada
- 🔴 BillingPage.tsx não atualizado
- 🔴 Testes não executados

---

**Próximo passo:** 
1. Deploy das Edge Functions
2. Verificar/criar tabela `subscriptions`
3. Configurar variáveis de ambiente Stripe
4. Testar fluxo completo
