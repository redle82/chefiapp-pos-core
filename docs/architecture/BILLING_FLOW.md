# BILLING FLOW — MAPA ÚNICO

**Status:** ✅ Fonte da Verdade
**Data:** 2026-01-18
**Schema Oficial:** `subscriptions`, `billing_events`, `billing_payments`

---

## 🎯 DECLARAÇÃO OFICIAL

**Schema de Billing:**

- ✅ **OFICIAL:** `subscriptions`, `billing_events`, `billing_payments` (migration `20260130000000`)
- ❌ **LEGADO:** `gm_billing_subscriptions`, `gm_billing_invoices` (migration `20260122170647`) — **NÃO USAR**

**Documento-Mãe:**

- ✅ **FONTE DA VERDADE:** `docs/audit/EXECUTABLE_ROADMAP.md` (FASE 1)
- 📎 **DERIVADOS:** Outros docs de billing são históricos ou derivados

**Script de Migration:**

- ✅ **OFICIAL:** `aplicar_migration.sh` (raiz)
- ❌ **DEPRECATED:** `apply-migration-cli.ts`, `apply-migrations-via-api.ts` — usar apenas se necessário

---

## 📐 FLUXO COMPLETO DE BILLING

### 1. Onboarding → Escolha de Plano

**Arquivo:** `merchant-portal/src/pages/Onboarding/BillingStep.tsx`

**O que acontece:**

1. Usuário escolhe plano (STARTER, PRO, ENTERPRISE)
2. Clica "Começar Trial" ou "Pagar Agora"
3. Frontend chama Edge Function `stripe-billing` (action: `create-subscription`)

**Edge Function:** `supabase/functions/stripe-billing/index.ts`

- Cria customer no Stripe (se não existir)
- Cria subscription no Stripe
- Salva subscription em `subscriptions` table
- Emite evento `SUBSCRIPTION_CREATED` em `billing_events`

---

### 2. Trial ou Checkout

**Se Trial:**

- **Arquivo:** `merchant-portal/src/pages/Onboarding/TrialStart.tsx`
- Subscription criada com `status = 'TRIAL'`
- `trial_ends_at = now + 14 days`
- Usuário pode acessar TPV imediatamente

**Se Pago:**

- **Arquivo:** `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx`
- Stripe Elements coleta cartão
- Frontend confirma pagamento com `client_secret`
- Edge Function `stripe-billing` atualiza subscription para `status = 'ACTIVE'`
- Emite evento `SUBSCRIPTION_ACTIVATED` em `billing_events`

---

### 3. Proteção de Rotas

**Arquivo:** `merchant-portal/src/core/activation/RequireActivation.tsx`

**O que verifica:**

- Busca subscription em `subscriptions` table
- Verifica `status`:
  - `TRIAL` ou `ACTIVE` → Permite acesso
  - `SUSPENDED` → Bloqueia tudo
  - `CANCELLED` → Redireciona para billing
  - `PAST_DUE` → Bloqueia features premium

**Rotas protegidas:**

- `/app/tpv`
- `/app/dashboard`
- `/app/menu`
- `/app/kds`

---

### 4. Webhook do Stripe

**Edge Function:** `supabase/functions/stripe-billing-webhook/index.ts`

**Eventos processados:**

- `checkout.session.completed` → Ativa subscription
- `customer.subscription.updated` → Atualiza status
- `customer.subscription.deleted` → Cancela subscription
- `invoice.paid` → Registra pagamento em `billing_payments`
- `invoice.payment_failed` → Marca como `PAST_DUE`

**O que faz:**

- Atualiza `subscriptions` table
- Emite eventos em `billing_events`
- Registra pagamentos em `billing_payments`

---

### 5. Cancelamento / Upgrade

**Arquivo:** `merchant-portal/src/pages/Settings/BillingPage.tsx`

**Cancelamento:**

- Chama Edge Function `cancel-subscription`
- Atualiza `status = 'CANCELLED'`
- Emite evento `SUBSCRIPTION_CANCELLED`

**Upgrade/Downgrade:**

- Chama Edge Function `change-plan`
- Atualiza `plan_tier` e `plan_id`
- Emite evento `PLAN_UPGRADED` ou `PLAN_DOWNGRADED`

---

## 🗂️ ARQUIVOS DO FLUXO

### Frontend

- `merchant-portal/src/pages/Onboarding/BillingStep.tsx` — Escolher plano
- `merchant-portal/src/pages/Onboarding/CheckoutStep.tsx` — Pagamento
- `merchant-portal/src/pages/Onboarding/TrialStart.tsx` — Trial
- `merchant-portal/src/pages/Billing/BillingPage.tsx` — Gestão de assinatura (rota `/app/billing`, owner-only)
- `merchant-portal/src/pages/Billing/BillingSuccessPage.tsx` — Página pós-checkout (`/billing/success`)
- `merchant-portal/src/core/billing/BillingBroker.ts` — Checkout + portal do cliente (Edge Function `stripe-billing`)
- `merchant-portal/src/hooks/useSubscription.ts` — Hook
- `merchant-portal/src/core/activation/RequireActivation.tsx` — Gate

### Backend

- `billing-core/StripeBillingService.ts` — Serviço principal
- `billing-core/onboarding.ts` — Onboarding service
- `billing-core/types.ts` — Tipos e planos
- `billing-core/state-machine.ts` — Máquina de estados
- `supabase/functions/stripe-billing/index.ts` — Edge Function
- `supabase/functions/stripe-billing-webhook/index.ts` — Webhook

### Database

- `supabase/migrations/20260130000000_create_billing_core_tables.sql` — Schema oficial

---

## 📊 ESTADOS DE SUBSCRIPTION

**Definidos em:** `billing-core/types.ts` e migration `20260130000000`

```typescript
type SubscriptionStatus =
  | "TRIAL" // Trial ativo
  | "ACTIVE" // Pago e ativo
  | "PAST_DUE" // Pagamento falhou
  | "SUSPENDED" // Suspenso (bloqueado)
  | "CANCELLED"; // Cancelado
```

**Transições:**

- `TRIAL` → `ACTIVE` (após pagamento)
- `ACTIVE` → `PAST_DUE` (pagamento falhou)
- `PAST_DUE` → `SUSPENDED` (após grace period)
- `ACTIVE` → `CANCELLED` (cancelamento)

---

## 🔗 DEPENDÊNCIAS

**Stripe:**

- Customer criado automaticamente
- Subscription criada no Stripe
- Webhook configurado no Stripe Dashboard

**Supabase:**

- Edge Functions deployadas
- **Secrets (Dashboard → Project Settings → Edge Functions → Secrets):**
  - `STRIPE_SECRET_KEY` — chave secreta do Stripe (obrigatória para checkout/portal)
  - `STRIPE_WEBHOOK_SECRET` — assinatura do webhook (para `stripe-billing-webhook`)
- Tabelas: `subscriptions`, `billing_events`, `billing_payments`

**Frontend (merchant-portal/.env ou .env.local):**

- `VITE_STRIPE_PUBLISHABLE_KEY` — chave pública do Stripe (ou `VITE_STRIPE_PUBLIC_KEY`)
- `VITE_STRIPE_PRICE_ID` — ID do preço do plano (ex: `price_xxx`) para checkout de assinatura na página `/app/billing`
- `@stripe/stripe-js` e `@stripe/react-stripe-js` instalados (quando usar Elements)

---

## 🚨 TROUBLESHOOTING

### Subscription não é criada

1. Verificar Edge Function `stripe-billing` deployada
2. Verificar `STRIPE_SECRET_KEY` configurada
3. Verificar tabela `subscriptions` existe
4. Verificar logs da Edge Function

### Webhook não recebe eventos

1. Verificar URL do webhook no Stripe Dashboard
2. Verificar `STRIPE_WEBHOOK_SECRET` configurada
3. Verificar logs da Edge Function `stripe-billing-webhook`

### Bloqueio não funciona

1. Verificar `RequireActivation.tsx` busca subscription correta
2. Verificar subscription status no banco
3. Verificar RLS policies permitem leitura

---

## 📝 NOTAS IMPORTANTES

**Schema Legado:**

- `gm_billing_subscriptions` e `gm_billing_invoices` (migration `20260122170647`) são **LEGADO**
- **NÃO USAR** para novo código
- Migration antiga mantida apenas para histórico

**Documentação:**

- Este documento (`BILLING_FLOW.md`) é a **fonte da verdade** para o fluxo
- `EXECUTABLE_ROADMAP.md` é a **fonte da verdade** para status e progresso
- Outros docs são derivados ou históricos

---

---

## ✅ Checklist FASE 1 (readiness)

| Item | Onde | Status |
|------|------|--------|
| Rota `/app/billing` | App.tsx, RoleGate owner-only | ✅ |
| BillingPage (checkout + portal) | BillingPage.tsx, BillingBroker | ✅ |
| Rota `/billing/success` | App.tsx, BillingSuccessPage | ✅ |
| PaymentGuard Safe Harbor | PaymentGuard.tsx: path.startsWith("/app/billing") | ✅ |
| Env frontend | VITE_STRIPE_PUBLIC_KEY ou VITE_STRIPE_PUBLISHABLE_KEY, VITE_STRIPE_PRICE_ID (config.ts) | Validar em .env |
| Edge Function | supabase.functions.invoke("stripe-billing", create-checkout-session \| create-portal-session) | Validar deploy + STRIPE_SECRET_KEY |
| Webhook | stripe-billing-webhook, STRIPE_WEBHOOK_SECRET | Validar no Stripe Dashboard |

**Próximo:** Validar Stripe Checkout e Portal em ambiente real (env vars + Edge Function deployados).

---

**ÚLTIMA ATUALIZAÇÃO:** 2026-01-18
**PRÓXIMA REVISÃO:** Após deploy completo de FASE 1
