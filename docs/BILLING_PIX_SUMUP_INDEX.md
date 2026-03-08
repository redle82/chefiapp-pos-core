# Billing, PIX e SumUp — Índice e próximos passos

**Última atualização:** 2026-02-22  
**Contrato superior:** [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md)

Este documento é o ponto de entrada para trabalhar em **billing SaaS**, **PIX** e **SumUp** (cartão EUR/BRL). Agrupa docs, código e scripts relevantes e sugere próximos passos.

---

## 1. Billing (SaaS — ChefIApp → Stripe)

**O que é:** Cobrança do restaurante à ChefIApp (assinatura). Gateway: Stripe. Core nunca processa cartão.

### Docs

| Doc | Conteúdo |
|-----|----------|
| [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md) | Lei: Core vs gateway, tipos de billing, API Core |
| [BILLING_FLOW.md](architecture/BILLING_FLOW.md) | Fluxo onboarding → trial/checkout → proteção de rotas |
| [BILLING_STRESS_TEST_CHECKLIST.md](ops/BILLING_STRESS_TEST_CHECKLIST.md) | Cenários Trial→Active, Past_due, Cancelado, hardening (eventos duplicados, fora de ordem) |
| [BILLING_AND_PLAN_CONTRACT.md](contracts/BILLING_AND_PLAN_CONTRACT.md) | Contrato de planos e estados |
| [boot/BOOTSTRAP_3_BILLING_GATE.md](boot/BOOTSTRAP_3_BILLING_GATE.md) | Gate de billing no bootstrap |

### Código principal

| Onde | O quê |
|------|--------|
| `server/integration-gateway.ts` | `POST /internal/billing/create-checkout-session` (Stripe checkout session; mock se sem `STRIPE_SECRET_KEY`) |
| `merchant-portal/src/core/billing/BillingBroker.ts` | `startSubscription`, `openCustomerPortal` — chama Core/gateway |
| `merchant-portal/src/core/billing/coreBillingApi.ts` | `createCheckoutSession`, `createSaasPortalSession`, `getBillingStatusWithTrial` |
| `merchant-portal/src/pages/Billing/BillingPage.tsx` | UI página de billing / cambiar plan |
| `supabase/functions/webhook-stripe/index.ts` | Webhook Stripe → sync subscription (timestamp guard) |
| `scripts/start-gateway-billing.sh` | Sobe gateway para billing local (porta 4320) |

### Local (AGENTS.md)

- Gateway: `pnpm run dev:gateway` (raiz); com Stripe: `STRIPE_SECRET_KEY=sk_test_... pnpm run dev:gateway`
- Frontend: `VITE_API_BASE=http://localhost:4320`, `VITE_INTERNAL_API_TOKEN=chefiapp-internal-token-dev` em `.env.local`

### Scripts

| Script | Uso |
|--------|-----|
| [run-billing-pix-sumup-validation.sh](../scripts/run-billing-pix-sumup-validation.sh) | Validação unificada: health gateway, create-checkout-session, PIX checkout, SumUp checkout, portal opcional. |
| [start-gateway-billing.sh](../scripts/start-gateway-billing.sh) | Sobe o gateway para billing local (porta 4320). |

### Runbook cenários 1–4

[BILLING_STRESS_TEST_RUNBOOK_SCENARIOS_1-4.md](ops/BILLING_STRESS_TEST_RUNBOOK_SCENARIOS_1-4.md) — passos concretos para Trial→Active, Active→Past_due, Past_due→Active e Cancelado, com verificações DB e UI.

### Próximos passos (billing)

1. **Stress test:** Executar [BILLING_STRESS_TEST_CHECKLIST.md](ops/BILLING_STRESS_TEST_CHECKLIST.md) (cenários 1–5 e 6–8) e preencher Pass/Fail. Usar o [runbook cenários 1–4](ops/BILLING_STRESS_TEST_RUNBOOK_SCENARIOS_1-4.md). Antes: `./scripts/run-billing-pix-sumup-validation.sh`.
2. **Cutover:** Ver [PRODUCTION_CUTOVER_RUNBOOK.md](ops/PRODUCTION_CUTOVER_RUNBOOK.md) e [CONSOLIDATION_LOG_BLOCK1.md](ops/CONSOLIDATION_LOG_BLOCK1.md) para evidência de billing real.
3. **PaymentGuard:** Validar bloqueio/dunning em `merchant-portal` (past_due, canceled) conforme contrato.

---

## 2. PIX (pagamentos ao cliente final — SumUp PIX)

**O que é:** Pagamento PIX no TPV. Usa SumUp como provider (BRL). Fluxo: TPV → PaymentBroker → integration-gateway → SumUp API → webhook.

### Docs

| Doc | Conteúdo |
|-----|----------|
| [PIX_E2E_TESTING_GUIDE.md](PIX_E2E_TESTING_GUIDE.md) | Configuração, quick start, curl de checkout, cenários E2E |
| [PIX_IMPLEMENTATION_SUMMARY.md](PIX_IMPLEMENTATION_SUMMARY.md) | Resumo da implementação |
| [PIX_UI_INTEGRATION_COMPLETE.md](PIX_UI_INTEGRATION_COMPLETE.md) | Integração UI concluída |
| [PIX_ACTIVATION_PLAN.md](PIX_ACTIVATION_PLAN.md) | Plano de ativação |

### Código principal

| Onde | O quê |
|------|--------|
| `server/integration-gateway.ts` | `POST /api/v1/payment/pix/checkout`, `GET /api/v1/payment/sumup/checkout/:id` (token interno) |
| `merchant-portal/src/core/payment/PaymentBroker.ts` | `createPixCheckout`, `getPixCheckoutStatus` — chamam gateway |
| `merchant-portal/src/infra/payments/providers/pix.ts` | Provider PIX (SumUp) no frontend |
| `merchant-portal/src/pages/TPV/components/PaymentModal.tsx` | Modal de pagamento (PIX/cartão) no TPV |

### Scripts

| Script | Uso |
|--------|-----|
| [pix-e2e-curl.sh](../scripts/pix-e2e-curl.sh) | PIX E2E por curl: checkout + GET status. Requer gateway e `INTERNAL_API_TOKEN`. |

### Variáveis (gateway)

- `SUMUP_ACCESS_TOKEN`, `SUMUP_API_BASE_URL`, `SUMUP_PIX_DEFAULT_COUNTRY=BR`, `SUMUP_PIX_DEFAULT_CURRENCY=BRL`

### Próximos passos (PIX)

1. **E2E:** Seguir [PIX_E2E_TESTING_GUIDE.md](PIX_E2E_TESTING_GUIDE.md) com gateway + portal + Core (e SumUp sandbox se disponível).
2. **Reconciliação:** Garantir que `gm_payments` (ou tabela equivalente no Core) é atualizada via webhook SumUp e que o TPV reflete estado pago.

---

## 3. SumUp (cartão EUR/BRL — pagamentos ao cliente final)

**O que é:** Pagamento com cartão (SumUp). EUR para Europa; BRL já usado também para PIX. Mesmo gateway e webhook SumUp.

### Docs

| Doc | Conteúdo |
|-----|----------|
| [SUMUP_EUR_INTEGRATION_GUIDE.md](SUMUP_EUR_INTEGRATION_GUIDE.md) | Arquitetura EUR, schema `gm_payments`, fluxo checkout + webhook |
| [PAYMENT_LAYER.md](architecture/PAYMENT_LAYER.md) | Camada de pagamento unificada (Stripe, SumUp, PIX, Manual, CashKeeper) |

### Código principal

| Onde | O quê |
|------|--------|
| `server/integration-gateway.ts` | `POST /api/v1/sumup/checkout`, `GET /api/v1/sumup/checkout/:id`, `POST /api/v1/webhook/sumup` |
| `server/sumupWebhookVerify.ts` | Verificação de assinatura do webhook SumUp |
| `merchant-portal/src/core/payment/PaymentBroker.ts` | `createSumUpCheckout`, `getSumUpCheckoutStatus` |
| `merchant-portal/src/infra/payments/providers/sumup.ts` | Provider SumUp no frontend |
| `docker-core/schema/migrations/20260221_sumup_payment_integration.sql` | Colunas `payment_provider`, `external_checkout_id`, etc. em `gm_payments` |

### Scripts

| Script | Uso |
|--------|-----|
| [deploy-sumup-production.sh](../scripts/deploy-sumup-production.sh) | Deploy SumUp em produção |
| [test-sumup-e2e.sh](../scripts/test-sumup-e2e.sh) | Infra E2E SumUp: gateway + portal + DB (gm_payments, colunas SumUp) |

### Próximos passos (SumUp)

1. **EUR em produção:** Seguir [SUMUP_EUR_INTEGRATION_GUIDE.md](SUMUP_EUR_INTEGRATION_GUIDE.md); confirmar conta merchant (ex. MNAAKKUV) e webhook apontando para o gateway.
2. **Webhook:** Garantir que `POST /api/v1/webhook/sumup` está acessível (Edge/gateway) e que `SUMUP_WEBHOOK_SECRET` está configurado; validar idempotência e timestamp se aplicável.
3. **UI:** Concluir integração UI para checkout cartão EUR (guide marca "UI Integration Pending" onde aplicável).

---

## 4. Visão unificada (Payment Layer)

- **Contrato:** [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md) — Core não é gateway; valida e reconcilia.
- **Diagrama e interface:** [PAYMENT_LAYER.md](architecture/PAYMENT_LAYER.md) — TPV → PaymentBroker → Gateway (Payment Layer) → Stripe/SumUp/PIX.
- **Segurança:** [PAYMENT_CREDENTIALS_AND_WEBHOOKS.md](security/PAYMENT_CREDENTIALS_AND_WEBHOOKS.md) para credenciais e webhooks.

---

## 5. Ordem sugerida para “próximo passo”

1. **Billing:** Correr stress test (checklist) e registar resultado; validar PaymentGuard em past_due/canceled.
2. **PIX:** Executar E2E com guia PIX (gateway + portal + Core); conferir webhook → estado no Core/TPV.
3. **SumUp:** Completar configuração EUR em produção (webhook, env, conta) e testar checkout cartão de ponta a ponta.

Se quiseres focar numa área em concreto (só billing, só PIX ou só SumUp), diz qual e preparo os passos concretos (comandos e ficheiros) para essa área.
