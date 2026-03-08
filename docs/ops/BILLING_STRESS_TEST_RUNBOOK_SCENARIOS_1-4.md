# Runbook: Cenários 1–4 — Billing Stress Test

**Objetivo:** Executar cenários 1–4 do [BILLING_STRESS_TEST_CHECKLIST.md](BILLING_STRESS_TEST_CHECKLIST.md) e registar Pass/Fail.  
**Pré-requisitos:** Cutover feito (webhooks Stripe → Edge); conta Stripe teste; Core com `gm_restaurants` e `merchant_subscriptions` (ou equivalente).

---

## Antes de começar

1. **Validação automática** (gateway em 4320):
   ```bash
   ./scripts/run-billing-pix-sumup-validation.sh
   ```
   Deve passar todos os checks (ou PIX/SumUp "Endpoint reachable" se SumUp não configurado).

2. **Portal a correr:** `pnpm -w merchant-portal run dev` (porta 5175).
3. **Stripe Dashboard:** Abrir [Stripe Test Webhooks](https://dashboard.stripe.com/test/webhooks) e [Customers/Subscriptions](https://dashboard.stripe.com/test/subscriptions) para enviar eventos e ver estado.

---

## Cenário 1: Trial → Active

**Objetivo:** `billing_status` = active; PaymentGuard deixa passar.

| Passo | Ação | Verificação |
|-------|------|-------------|
| 1.1 | No Stripe (teste): criar ou ter subscription com status **Active** ligada ao `restaurant_id` de teste (customer metadata ou `merchant_subscriptions.stripe_subscription_id`). | Subscription aparece como Active no Dashboard. |
| 1.2 | Garantir que o webhook Stripe já recebeu `customer.subscription.updated` ou `invoice.paid` para essa subscription. | Evento em Webhooks → Logs. |
| 1.3 | No Core/DB: `gm_restaurants.billing_status` = `active` para o restaurante (sync via RPC ou migração). | `SELECT id, billing_status FROM gm_restaurants WHERE id = '<restaurant_id>';` |
| 1.4 | No browser: abrir portal (ex.: `http://localhost:5175/app/billing` ou app) com sessão desse restaurante. | PaymentGuard não bloqueia; sem banner dunning. |
| 1.5 | Navegar para TPV ou operação. | Acesso permitido. |

**Pass / Fail:** _____ | **Data:** _____ | **Notas:** _____

---

## Cenário 2: Active → Past_due

**Objetivo:** `billing_status` = past_due; UI mostra dunning (banner + CTA billing); TPV/operação com aviso ou bloqueio.

| Passo | Ação | Verificação |
|-------|------|-------------|
| 2.1 | No Stripe: enviar evento de teste **invoice.payment_failed** para a subscription do restaurante (ou simular falha de pagamento). | Webhook enviado; Core recebe e processa. |
| 2.2 | No Core: confirmar que `gm_restaurants.billing_status` foi atualizado para `past_due` (via webhook handler / `sync_stripe_subscription_from_event`). | `SELECT billing_status FROM gm_restaurants WHERE id = '<restaurant_id>';` → `past_due` |
| 2.3 | No browser: recarregar portal (ou reabrir app) com o mesmo restaurante. | Aparece banner de aviso (ex.: "Pagamento pendente") e CTA para /app/billing. |
| 2.4 | Verificar TPV/operação (RequireOperational ou PaymentGuard). | Conforme contrato: aviso ou bloqueio (ex.: BlockingScreen com redirect para /app/billing). |

**Pass / Fail:** _____ | **Data:** _____ | **Notas:** _____

---

## Cenário 3: Past_due → Active

**Objetivo:** `billing_status` = active; bloqueio/dunning desaparece.

| Passo | Ação | Verificação |
|-------|------|-------------|
| 3.1 | No Stripe: enviar evento **invoice.paid** (ou resolver a falha de pagamento no Dashboard e deixar o webhook disparar). | Webhook recebido pelo Core. |
| 3.2 | No Core: `gm_restaurants.billing_status` = `active`. | Query DB confirma. |
| 3.3 | No browser: recarregar portal. | Banner dunning desaparece; PaymentGuard deixa passar. |
| 3.4 | Aceder TPV/operação. | Sem bloqueio. |

**Pass / Fail:** _____ | **Data:** _____ | **Notas:** _____

---

## Cenário 4: Cancelado

**Objetivo:** `billing_status` = canceled; PaymentGuard mostra GlobalBlockedView exceto /app/billing, /app/console, /app/setup.

| Passo | Ação | Verificação |
|-------|------|-------------|
| 4.1 | No Stripe: cancelar a subscription (ou enviar evento de teste **customer.subscription.deleted**). | Subscription status = canceled. |
| 4.2 | Core: `gm_restaurants.billing_status` = `canceled`. | Query DB confirma. |
| 4.3 | No browser: abrir uma rota operacional (ex.: /app/staff/home ou TPV). | GlobalBlockedView com mensagem tipo "Assinatura necessária" e CTA para /app/billing. |
| 4.4 | Navegar para /app/billing. | Página de billing abre (Safe Harbor). |
| 4.5 | Navegar para /app/console e /app/setup. | Acesso permitido (Safe Harbor). |

**Pass / Fail:** _____ | **Data:** _____ | **Notas:** _____

---

## Verificação de consistência DB (após cada cenário)

- [ ] `gm_restaurants.billing_status` = valor esperado.
- [ ] `merchant_subscriptions.status` consistente com `gm_restaurants.billing_status`.
- [ ] `gm_restaurants.trial_ends_at` coerente (não NULL em trial, não alterado indevidamente).
- [ ] `gm_restaurants.last_billing_event_at` avança (nunca recua).

---

## Registo consolidado

Preencher a tabela do [BILLING_STRESS_TEST_CHECKLIST.md](BILLING_STRESS_TEST_CHECKLIST.md) com as datas e Pass/Fail destes quatro cenários. O registo detalhado fica em [CONSOLIDATION_LOG_BLOCK1.md](CONSOLIDATION_LOG_BLOCK1.md) secção 1.2 (se aplicável).
