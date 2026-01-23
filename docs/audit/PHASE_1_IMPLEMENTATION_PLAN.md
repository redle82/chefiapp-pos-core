# 🎯 FASE 1 — Implementação Detalhada (Billing)

**Data:** 2026-01-30  
**Status:** 🔴 **EM EXECUÇÃO**  
**Duração:** 2-3 semanas

---

## Objetivo

**Usuário NÃO pode operar TPV sem plano ativo (exceto trial).**

---

## Arquitetura da Solução

### Fluxo Completo

```
Login → Bootstrap → OnboardingQuick → BillingStep → 
  ├─→ TrialStart (se trial)
  └─→ CheckoutStep (se pago) → Dashboard
```

### Componentes a Criar

1. **BillingStep.tsx** — Escolher plano
2. **CheckoutStep.tsx** — Configurar pagamento (Stripe)
3. **TrialStart.tsx** — Ativar trial
4. **Hooks:**
   - `useSubscription.ts` — Gerenciar subscription
   - `useBilling.ts` — Integração com billing-core

### Componentes a Atualizar

1. **OnboardingQuick.tsx** — Redirecionar para billing
2. **FlowGate.tsx** — Adicionar rota `/onboarding/billing`
3. **RequireActivation.tsx** — Verificar subscription status
4. **App.tsx** — Proteger rotas críticas
5. **BillingPage.tsx** — Cancelamento/upgrade

---

## Dependências Backend

### Já Existem ✅
- `billing-core/StripeBillingService.ts`
- `billing-core/RestaurantOnboardingService.ts`
- `billing-core/FeatureGateService.ts`
- `billing-core/types.ts` (DEFAULT_PLANS)
- Edge Functions: `stripe-billing`, `stripe-billing-webhook`

### Verificar
- [ ] Webhooks do Stripe configurados no Stripe Dashboard
- [ ] Variáveis de ambiente (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [ ] Edge Functions deployadas

---

## Dependências Frontend

### Instalar
- [ ] `@stripe/stripe-js`
- [ ] `@stripe/react-stripe-js`

### Verificar
- [ ] `supabase` client configurado
- [ ] Rotas configuradas no `App.tsx`

---

## Implementação Passo a Passo

### Passo 1: Instalar Dependências Stripe

```bash
cd merchant-portal
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

### Passo 2: Criar Hook useSubscription

**Arquivo:** `merchant-portal/src/hooks/useSubscription.ts`

**Funcionalidades:**
- Buscar subscription atual
- Criar subscription (trial ou pago)
- Atualizar subscription
- Cancelar subscription

---

### Passo 3: Criar BillingStep.tsx

**Arquivo:** `merchant-portal/src/pages/Onboarding/BillingStep.tsx`

**Funcionalidades:**
- Listar 3 planos (STARTER, PROFESSIONAL, ENTERPRISE)
- Mostrar features por plano
- Botão "Começar Trial" / "Pagar Agora"
- Integração com `RestaurantOnboardingService`

---

### Passo 4: Criar CheckoutStep.tsx

**Arquivo:** `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx`

**Funcionalidades:**
- Integração Stripe Elements
- Formulário de cartão
- Confirmação de pagamento
- Feedback visual

---

### Passo 5: Criar TrialStart.tsx

**Arquivo:** `merchant-portal/src/pages/Onboarding/TrialStart.tsx`

**Funcionalidades:**
- Mostrar data de término do trial
- Botão opcional "Configurar Método de Pagamento"
- Botão "Continuar para Dashboard"

---

### Passo 6: Atualizar OnboardingQuick.tsx

**Mudança:** Redirecionar para `/onboarding/billing` após completar

---

### Passo 7: Atualizar FlowGate.tsx

**Mudança:** Adicionar verificação de subscription e rota `/onboarding/billing`

---

### Passo 8: Atualizar RequireActivation.tsx

**Mudança:** Verificar subscription status (TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELLED)

---

### Passo 9: Atualizar App.tsx

**Mudança:** Proteger rotas críticas com `RequireActivation`

---

### Passo 10: Atualizar BillingPage.tsx

**Mudança:** Adicionar cancelamento e upgrade/downgrade

---

## Ordem de Execução Recomendada

1. **Dia 1-2:** Instalar dependências + criar hooks
2. **Dia 3-5:** Criar BillingStep.tsx
3. **Dia 6-8:** Criar CheckoutStep.tsx
4. **Dia 9-10:** Criar TrialStart.tsx
5. **Dia 11-12:** Atualizar OnboardingQuick + FlowGate
6. **Dia 13-14:** Atualizar RequireActivation + App.tsx
7. **Dia 15:** Atualizar BillingPage.tsx
8. **Dia 16-17:** Testes integrados
9. **Dia 18-21:** Ajustes e polimento

---

## Testes Necessários

### Teste 1: Fluxo Completo (Trial)
1. Criar novo usuário
2. Completar OnboardingQuick
3. Escolher plano (trial)
4. Verificar trial ativado
5. Acessar TPV (deve funcionar)

### Teste 2: Fluxo Completo (Pago)
1. Criar novo usuário
2. Completar OnboardingQuick
3. Escolher plano (pagar agora)
4. Configurar pagamento
5. Verificar subscription ACTIVE
6. Acessar TPV (deve funcionar)

### Teste 3: Bloqueio sem Plano
1. Criar subscription SUSPENDED
2. Tentar acessar TPV
3. Verificar bloqueio

### Teste 4: Cancelamento
1. Cancelar subscription
2. Verificar redirecionamento para billing

### Teste 5: Upgrade/Downgrade
1. Fazer upgrade de plano
2. Verificar features atualizadas
3. Fazer downgrade de plano
4. Verificar features atualizadas

---

## Critérios de Sucesso

**FASE 1 está completa quando:**
1. ✅ Usuário não pode acessar TPV sem subscription (TRIAL ou ACTIVE)
2. ✅ Onboarding inclui escolha de plano obrigatória
3. ✅ Trial é ativado automaticamente após escolher plano
4. ✅ Checkout funciona (Stripe Elements integrado)
5. ✅ Cancelamento e upgrade funcionam
6. ✅ Estados PAST_DUE e SUSPENDED bloqueiam operação corretamente

---

**Próximo passo:** Começar implementação (Passo 1)
