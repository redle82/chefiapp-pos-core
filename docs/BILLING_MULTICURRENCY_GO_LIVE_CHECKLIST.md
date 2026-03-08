# Billing multi‑moeda — Go‑Live Checklist (Stripe)

## 1. Escopo deste checklist

- Ativar cobrança SaaS real em **BRL / EUR / USD** via Stripe.
- Usar a camada semântica de preços já existente (`billing_plans`, `billing_plan_prices`, `STRIPE_PRICE_*`).
- Garantir segurança mínima nos webhooks (tenant + moeda + price) e rastreabilidade básica (estado de billing + invoices).

## 2. Pré‑requisitos técnicos

### 2.1 Core (Docker)

- Migrações aplicadas:
  - `20260222_merchant_subscriptions.sql` (tabelas `billing_plans`, `merchant_subscriptions`, `billing_invoices`).
  - `20260223_stripe_sync_timestamp_guard.sql` (função `sync_stripe_subscription_from_event` com:
    - guard de timestamp (`last_billing_event_at`);
    - validação de `restaurant_id` via `metadata.restaurant_id` + `merchant_subscriptions`;
    - validação de **moeda** e **price** (via `billing_plan_prices`)).
- `gm_restaurants.billing_status` reflete estados `trial | active | past_due | canceled`.

### 2.2 Edge Functions Supabase

- `supabase/functions/billing-create-checkout-session/index.ts`:
  - Usa `STRIPE_SECRET_KEY`.
  - Resolve `price_id` via `STRIPE_PRICE_*` env, mantendo camada semântica.
- `supabase/functions/webhook-stripe/index.ts`:
  - Valida assinatura com `STRIPE_WEBHOOK_SECRET`.
  - Chama `process_webhook_event` para registo bruto.
  - Só chama `sync_stripe_subscription_from_event` quando:
    - existe `metadata.restaurant_id` ou `metadata.supabase_restaurant_id` válido (UUID);
    - caso contrário **ignora sync** e faz apenas log (`console.warn` com `event_id`, `event_type`).

### 2.3 Merchant Portal

- `coreBillingApi.ts`:
  - `getRestaurantBillingCurrency` deriva moeda de billing a partir de `gm_restaurants.country/currency`.
  - `getBillingPlanPrice` resolve price por plano + currency via `billing_plan_prices`.
  - `getBillingInvoices` lê `billing_invoices` com `amount_cents`, `currency`, `status`, `invoice_date`.
- `BillingPage.tsx`:
  - Usa `billingCurrency` do tenant (nunca do locale) para escolher o price Stripe.
  - Usa `billing_plan_prices` quando existem; senão `billing_plans.price_cents` como fallback.
- `useSubscriptionPage.ts`:
  - Converte `BillingInvoiceRow` → `Invoice` como `{ amountCents, currency }`.
  - `BillingSummary` já não assume IVA fixo (campo `tax` pode ser `null`).
- `InvoicesTable.tsx`:
  - Formata `amountCents` com a `currency` da invoice via `Intl.NumberFormat`.

## 3. Configuração Stripe (prices reais)

### 3.1 Lista de preços alvo (exemplo)

- Planos:
  - `starter`, `pro`, `enterprise`.
- Moedas alvo:
  - `BRL`, `EUR`, `USD`.
- Chaves semânticas sugeridas:
  - `STARTER_BRL`, `STARTER_EUR`, `STARTER_USD`
  - `PRO_BRL`, `PRO_EUR`, `PRO_USD`
  - `ENTERPRISE_BRL`, `ENTERPRISE_EUR`, `ENTERPRISE_USD`

### 3.2 Criação de prices no Stripe

Para cada combinação plano × moeda:

1. Criar **Product** (se ainda não existir) com `metadata.chefiapp_id = <plan_id>`.
2. Criar **Price**:
   - `unit_amount` em cents (ex.: 4900 = 49.00).
   - `currency` = `brl` / `eur` / `usd`.
   - `recurring.interval = month` (ou `year` se aplicável).

### 3.3 Variáveis de ambiente

No ambiente Edge (Supabase) / Core:

- Mapear chaves semânticas → prices reais:

```env
STRIPE_PRICE_STARTER_BRL=price_xxx
STRIPE_PRICE_STARTER_EUR=price_yyy
STRIPE_PRICE_STARTER_USD=price_zzz

STRIPE_PRICE_PRO_BRL=price_...
STRIPE_PRICE_PRO_EUR=price_...
STRIPE_PRICE_PRO_USD=price_...

STRIPE_PRICE_ENTERPRISE_BRL=price_...
STRIPE_PRICE_ENTERPRISE_EUR=price_...
STRIPE_PRICE_ENTERPRISE_USD=price_...
```

- Confirmar que:
  - `STRIPE_SECRET_KEY` está definido (test/prod consoante ambiente).
  - `STRIPE_WEBHOOK_SECRET` corresponde ao endpoint de webhook do ambiente.

## 4. Hardening mínimo de webhooks (tenant + currency + price)

### 4.1 Tenant guard (Edge)

- `webhook-stripe/index.ts`:
  - Para eventos billing (`customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`):
    - Lê `event.data.object.metadata.restaurant_id` ou `metadata.supabase_restaurant_id`.
    - Valida formato UUID.
    - **Sem tenant válido** → NÃO chama `sync_stripe_subscription_from_event`:
      - Apenas regista o evento via `process_webhook_event`.
      - Faz `console.warn` com `{ event_id, event_type, created_at }`.

### 4.2 Currency + price coherence (Core)

- `sync_stripe_subscription_from_event` (Docker + Supabase mirror):
  - Para `customer.subscription.*` e `invoice.*`:
    - `event_currency`:
      - Subscrição: `subscription.currency`.
      - Invoice: `invoice.currency` ou `invoice.lines[0].price.currency`.
    - `expected_currency`:
      - `gm_restaurants.billing_currency` quando existir;
      - caso contrário `gm_restaurants.currency` (fallback).
    - `expected_price_id`:
      - `billing_plan_prices` (`plan_id` + `currency`) ligado a `merchant_subscriptions.plan_id`.
    - `event_price_id`:
      - Invoice: `invoice.lines[0].price.id` (fallback `.product`).
      - Subscrição: `subscription.items[0].price.id` (fallback `.product`).
  - Se houver:
    - `expected_currency` ≠ `event_currency` → **não aplica estado**; retorna `"Currency mismatch: expected X, got Y"`.
    - `expected_price_id` ≠ `event_price_id` → **não aplica estado**; retorna `"Price mismatch: expected A, got B"`.

## 5. Regras cross‑currency (MVP)

- **Não automatizar** migração de subscription entre moedas neste ciclo.
- Regra mínima:
  - A currency de billing do restaurante é derivada de `gm_restaurants.country/currency` (via `getRestaurantBillingCurrency`).
  - `billing_plan_prices` deve conter exatamente uma linha por plano × currency suportada.
  - Se, em produção, o restaurante mudar de país/moeda, a regra operacional é:
    - **Não alterar automaticamente** a subscription Stripe existente.
    - Tratar mudança de moeda como operação manual de suporte:
      - Cancelar subscription atual.
      - Criar nova subscription na nova moeda (novo checkout).
- Implementação atual:
  - `BillingPage` sempre resolve o `price_id` com base em:
    - currency do restaurante;
    - price configurado em `billing_plan_prices` ou `billing_plans`.
  - Ou seja, upgrades/downgrades usam sempre o price configurado para a moeda atual do tenant; não há “misto” de plano EUR para tenant BRL.

## 6. Invoice sync mínimo

- Tabela `billing_invoices`:
  - Guarda `amount_cents` e `currency` **sem conversões**.
  - UI (`SubscriptionPage` + `InvoicesTable`) já:
    - lê `billing_invoices` via `coreBillingApi.getBillingInvoices`;
    - exibe valores formatados com a `currency` da invoice.
- Estado de billing (`gm_restaurants.billing_status` + `merchant_subscriptions`) já é sincronizado a partir de webhooks Stripe com:
  - guard de tenant;
  - guard de timestamp;
  - guard de currency/price.
- Próximo passo (fora deste checklist): adicionar, no Core, inserção/`UPSERT` em `billing_invoices` a partir de `invoice.*` quando a implementação de sync de invoices estiver madura.

## 7. Validação E2E para BRL / EUR / USD (modo teste)

**Validação repetível (checkout por moeda):** antes de go-live, executar o script que valida create-checkout-session nas 3 moedas:

```bash
./scripts/e2e-billing-three-currencies.sh
```

Requer: gateway a correr (ex.: `pnpm run dev:gateway`), variáveis `STRIPE_SECRET_KEY` e `STRIPE_PRICE_PRO_EUR`, `STRIPE_PRICE_PRO_USD`, `STRIPE_PRICE_PRO_BRL` definidas no ambiente do gateway. Passos manuais (tenant + webhook + UI) estão em `docs/ops/E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md`.

Para cada moeda alvo, repetir o fluxo abaixo com um restaurante de teste:

1. **Preparar tenant de teste**:
   - Criar restaurante em Core (`gm_restaurants`) com:
     - `country` e/ou `currency` coerente (`BR`/`BRL`, `PT`/`EUR`, `US`/`USD`).
2. **Configurar preços**:
   - Verificar que existe linha correspondente em `billing_plan_prices` para:
     - `plan_id` desejado (`starter`/`pro`/`enterprise`);
     - `currency` do tenant.
3. **Fluxo de checkout (portal)**:
   - Abrir `/app/billing` no merchant‑portal.
   - Verificar que:
     - os preços apresentados usam a moeda correta (símbolo e valor).
     - ao clicar em “Ativar agora”, a UI chama `BillingBroker.startSubscription`.
   - Confirmar que o URL de checkout Stripe:
     - abre página com `currency` correta;
     - exibe o valor esperado.
4. **Webhook + estado**:
   - Usar Stripe Dashboard (test mode) para enviar `Send test webhook` dos eventos:
     - `customer.subscription.created`,
     - `invoice.paid`,
     - `invoice.payment_failed`.
   - Verificar:
     - `sync_stripe_subscription_from_event` não falha (logs do Core).
     - `gm_restaurants.billing_status` muda conforme esperado (`trial` → `active` / `past_due` / `canceled`).
     - Mensagens `"Currency mismatch"` / `"Price mismatch"` **não** aparecem para o caso feliz.
5. **UI de Billing**:
   - Abrir `/app/billing`:
     - Verificar status de subscrição (trial/active/past_due/canceled).
     - Verificar que o histórico de faturas (quando invoices estiverem a ser sincronizadas) mostra `currency` e valores corretos.

## 8. Logs e observabilidade mínima

- Webhook Edge (`webhook-stripe`):
  - `console.warn` quando:
    - não há tenant (`restaurant_id`) resolvido.
    - `sync_stripe_subscription_from_event` devolve erro (não‑fatal).
- Core:
  - `sync_stripe_subscription_from_event` retorna mensagens textuais para:
    - `No restaurant_id in metadata or merchant_subscriptions`.
    - `Stale event skipped: ...`.
    - `Currency mismatch: ...`.
    - `Price mismatch: ...`.
- Recomenda‑se:
  - Enviar estes logs para a stack de observabilidade (Sentry / logging centralizado) como próximos passos de hardening.

## 9. Go‑Live Checklist rápido

- [ ] `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` configurados (test/prod).
- [ ] `STRIPE_PRICE_*` mapeados para todos os planos × moedas suportadas.
- [ ] Migrações de Core aplicadas (`merchant_subscriptions`, `billing_invoices`, `sync_stripe_subscription_from_event`).
- [ ] Edge Functions `billing-create-checkout-session` e `webhook-stripe` deployadas.
- [ ] **Validação repetível:** `./scripts/e2e-billing-three-currencies.sh` executado com sucesso (checkout EUR/USD/BRL). Ver runbook: `docs/ops/E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md`.
- [ ] Flow de checkout verificado para:
  - [ ] Tenant BRL.
  - [ ] Tenant EUR.
  - [ ] Tenant USD.
- [ ] Webhooks Stripe testados (`Send test webhook`) para eventos críticos:
  - [ ] `customer.subscription.created`.
  - [ ] `customer.subscription.updated`.
  - [ ] `customer.subscription.deleted`.
  - [ ] `invoice.paid`.
  - [ ] `invoice.payment_failed`.
- [ ] UI `/app/billing` mostra:
  - [ ] Planos com preços e moedas corretas.
  - [ ] Estado de subscrição correto.
  - [ ] Histórico de faturas coerente com a currency (quando invoices estiverem a ser sincronizadas).

