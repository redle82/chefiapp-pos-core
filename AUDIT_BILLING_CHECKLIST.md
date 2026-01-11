# AUDITORIA DE PRONTIDÃO DE COBRANÇA
## ChefIApp POS — Billing & Payments Readiness

**Data:** _______________  
**Auditor:** _______________  
**Versão:** 1.0

---

## 🔴 BLOCO 1 — Arquitetura Financeira

### 1.1 Separação de Responsabilidades

| # | Verificação | Status | Evidência |
|---|-------------|--------|-----------|
| 1.1.1 | `StripeBillingService` NÃO importa `StripeGatewayAdapter` | ⬜ | grep |
| 1.1.2 | `StripeGatewayAdapterV2` NÃO importa `StripeBillingService` | ⬜ | grep |
| 1.1.3 | Webhooks em endpoints separados | ⬜ | `/billing` ≠ `/payments/:id` |
| 1.1.4 | API keys são variáveis diferentes | ⬜ | `YOUR_STRIPE_KEY` ≠ `MERCHANT_STRIPE_KEY` |
| 1.1.5 | `merchant_id` presente em TODOS os metadados de billing | ⬜ | código |

### 1.2 Fluxos de Dinheiro

| # | Fluxo | Quem Cobra | Quem Paga | Destino do € |
|---|-------|------------|-----------|--------------|
| 1.2.1 | Assinatura TPV | ChefIApp | Merchant | Conta ChefIApp |
| 1.2.2 | Add-on Reservas | ChefIApp | Merchant | Conta ChefIApp |
| 1.2.3 | Pagamento Mesa | Merchant | Cliente Final | Conta Merchant |
| 1.2.4 | Pagamento Web | Merchant | Cliente Final | Conta Merchant |
| 1.2.5 | Pagamento Terminal | Merchant | Cliente Final | Conta Merchant |

**REGRA DE OURO:** ChefIApp NUNCA toca no dinheiro do cliente final.

---

## 🟠 BLOCO 2 — Sandbox Dry-Run

### 2.1 Billing (SEU Stripe)

```bash
# Pré-requisitos
export STRIPE_SECRET_KEY=sk_test_xxx  # SUA chave
export STRIPE_WEBHOOK_SECRET=whsec_xxx
```

| # | Teste | Comando/Ação | Esperado | Status |
|---|-------|--------------|----------|--------|
| 2.1.1 | Criar Customer | `stripe customers create` | `cus_xxx` | ⬜ |
| 2.1.2 | Criar Subscription (trial) | `stripe subscriptions create --trial-period-days=14` | `sub_xxx` trialing | ⬜ |
| 2.1.3 | Webhook `subscription.created` | `stripe listen` | Recebido + processado | ⬜ |
| 2.1.4 | Trial → Active | Aguardar ou `stripe subscriptions update` | Status ACTIVE | ⬜ |
| 2.1.5 | Falha de pagamento | `stripe invoices pay --source=pm_card_declined` | Status PAST_DUE | ⬜ |
| 2.1.6 | Webhook duplicado | Reenviar mesmo evento | `already_processed: true` | ⬜ |
| 2.1.7 | Cancelar subscription | `stripe subscriptions cancel` | Status CANCELLED | ⬜ |
| 2.1.8 | Reativar subscription | `stripe subscriptions update --cancel-at-period-end=false` | Status ACTIVE | ⬜ |

### 2.2 Payments (Stripe DO MERCHANT)

```bash
# Pré-requisitos
export MERCHANT_STRIPE_KEY=sk_test_merchant_xxx  # Chave do MERCHANT
export MERCHANT_WEBHOOK_SECRET=whsec_merchant_xxx
```

| # | Teste | Comando/Ação | Esperado | Status |
|---|-------|--------------|----------|--------|
| 2.2.1 | Criar PaymentIntent | `stripe payment_intents create --amount=1000` | `pi_xxx` | ⬜ |
| 2.2.2 | Confirmar pagamento | `stripe payment_intents confirm` | Status succeeded | ⬜ |
| 2.2.3 | Webhook `payment_intent.succeeded` | `stripe listen --forward-to /webhooks/payments/:restaurantId` | Recebido | ⬜ |
| 2.2.4 | Idempotência webhook | Reenviar mesmo evento | Ignorado (duplicate) | ⬜ |
| 2.2.5 | Falha de pagamento | `pm_card_declined` | Status failed + webhook | ⬜ |
| 2.2.6 | Refund parcial | `stripe refunds create --amount=500` | Refund succeeded | ⬜ |
| 2.2.7 | 3D Secure | `pm_card_authenticationRequired` | `action_required` | ⬜ |

### 2.3 Isolamento (CRÍTICO)

| # | Teste | Verificação | Status |
|---|-------|-------------|--------|
| 2.3.1 | Billing webhook não processa payment events | Enviar `payment_intent.succeeded` para `/webhooks/billing` | Ignorado | ⬜ |
| 2.3.2 | Payment webhook não processa billing events | Enviar `subscription.created` para `/webhooks/payments/:id` | Ignorado | ⬜ |
| 2.3.3 | API key billing não funciona em gateway | Usar `YOUR_STRIPE_KEY` para criar PaymentIntent | ERRO | ⬜ |

---

## 🟡 BLOCO 3 — Modelo de Cobrança

### 3.1 O que ChefIApp Cobra

| Item | Preço | Frequência | Stripe Product |
|------|-------|------------|----------------|
| Plano Starter | €29/mês | Mensal | `prod_starter` |
| Plano Professional | €59/mês | Mensal | `prod_professional` |
| Plano Enterprise | €149/mês | Mensal | `prod_enterprise` |
| Add-on Reservas | €19/mês | Mensal | `prod_addon_reservations` |
| Add-on Web Page | €9/mês | Mensal | `prod_addon_webpage` |
| Add-on Terminal Extra | €15/mês | Por unidade | `prod_addon_terminal` |

### 3.2 O que ChefIApp NÃO Cobra

| Item | Responsável | Motivo |
|------|-------------|--------|
| Taxa por transação | Stripe/SumUp | Merchant paga direto ao gateway |
| MDR (Merchant Discount Rate) | Stripe/SumUp | Não somos PSP |
| Chargebacks | Merchant | Responsabilidade do titular da conta |

---

## 🔒 BLOCO 4 — Riscos Legais

### 4.1 Checklist Legal

| # | Risco | Mitigação | Status |
|---|-------|-----------|--------|
| 4.1.1 | Mistura de fundos | Contas Stripe 100% separadas | ⬜ |
| 4.1.2 | Responsabilidade por chargebacks | ToS claro: merchant é responsável | ⬜ |
| 4.1.3 | PCI Compliance | Stripe.js (nunca tocamos em cartão) | ⬜ |
| 4.1.4 | GDPR | Dados mínimos, consentimento explícito | ⬜ |
| 4.1.5 | Facturação portuguesa | SAF-T / AT compliance (Gate 5) | ⬜ |

### 4.2 Documentos Necessários

| Documento | Status | Localização |
|-----------|--------|-------------|
| Termos de Serviço (ToS) | ⬜ | `/legal/tos.md` |
| Política de Privacidade | ⬜ | `/legal/privacy.md` |
| Acordo de Processamento de Dados (DPA) | ⬜ | `/legal/dpa.md` |
| Separação de Responsabilidades Financeiras | ⬜ | Ver FINANCIAL_SEPARATION.md |

---

## ✅ RESULTADO DA AUDITORIA

### Critérios de Aprovação

- **BLOCO 1:** 100% verde (arquitetura)
- **BLOCO 2:** 100% verde (sandbox)
- **BLOCO 3:** Documentado e validado
- **BLOCO 4:** Riscos mitigados ou aceites

### Decisão

| Status | Significado |
|--------|-------------|
| ✅ APROVADO | Pode ir para produção |
| ⚠️ CONDICIONAL | Pode ir com ressalvas documentadas |
| ❌ REPROVADO | Bloqueio até correção |

**Resultado:** _______________

**Assinatura:** _______________

**Data:** _______________
