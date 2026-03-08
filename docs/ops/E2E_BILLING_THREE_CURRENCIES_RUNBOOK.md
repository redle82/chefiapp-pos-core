# Runbook: E2E Billing — 3 moedas (BRL / EUR / USD)

**Objetivo:** Validar em combate controlado que checkout e webhooks funcionam para EUR, USD e BRL.  
**Ref:** [BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md](../BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md) §7.

---

## 1. Validação repetível (checkout por moeda)

Com o gateway a correr e Stripe em test mode (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_EUR`, `STRIPE_PRICE_PRO_USD`, `STRIPE_PRICE_PRO_BRL` definidos no ambiente do gateway):

```bash
./scripts/e2e-billing-three-currencies.sh
```

- **Sucesso:** script sai 0; para cada moeda (EUR, USD, BRL) o endpoint `POST /internal/billing/create-checkout-session` retorna HTTP 200 e `url` ou `session_id`. O body inclui `restaurant_id` (UUID) obrigatório para metadata na sessão Stripe.
- **Variável opcional:** `RESTAURANT_ID` (default: `00000000-0000-0000-0000-000000000100`) para o checkout; pode ser passado para alinhar com um restaurante de teste no Core.
- **Falha:** verificar que as variáveis `STRIPE_PRICE_PRO_*` estão definidas e que o gateway está a usar o env correto (ex.: `pnpm run dev:gateway` na raiz).

---

## 2. (Opcional) Tenants de teste e resolução de moeda

Para validar que a UI mostraria o price certo por tenant:

1. Criar (ou usar) três restaurantes em `gm_restaurants` com `country`/`currency` coerentes:
   - PT (ou outro país EUR) → `currency`/`billing_currency` = EUR
   - US → USD
   - BR → BRL
2. No Core: confirmar que existe linha em `billing_plan_prices` para cada `(plan_id, currency)` desejado (ex.: pro × EUR, pro × USD, pro × BRL).
3. No portal: abrir `/app/billing` com sessão de cada tenant e verificar que os preços exibidos usam a moeda correta (símbolo e valor).

---

## 3. (Opcional) Webhook + estado (caso feliz)

Validar que um evento Stripe alinhado (tenant + currency + price) não gera incidente e atualiza o estado:

1. **Stripe Dashboard (test mode):** [Send test webhook](https://dashboard.stripe.com/test/webhooks) para:
   - `customer.subscription.created`, ou
   - `invoice.paid`
2. Payload deve incluir:
   - `metadata.restaurant_id` = UUID de um restaurante de teste existente em `gm_restaurants`
   - Currency e price_id alinhados com `billing_plan_prices` e com a moeda desse restaurante
3. **Verificação no DB (Core):**
   - `gm_restaurants.billing_status` e `gm_restaurants.last_billing_event_at` atualizados para esse `restaurant_id`.
   - Nenhuma linha em `billing_incidents` para esse `event_id` (caso feliz):
     ```sql
     SELECT * FROM billing_incidents WHERE event_id = '<event_id>';
     ```
     Deve estar vazio.
4. **Logs:** Em caso feliz, não devem aparecer mensagens "Currency mismatch" ou "Price mismatch" nos logs do Core/Edge.

---

## 4. Cross-currency guard (comportamento esperado)

Quando o evento Stripe tem **moeda diferente** da moeda de billing do restaurante (`gm_restaurants.billing_currency` ou equivalente):

- `sync_stripe_subscription_from_event` **não actualiza** `gm_restaurants.billing_status` nem `merchant_subscriptions`.
- A função retorna uma linha com `message` do tipo `Currency mismatch: expected <expected>, got <event_currency>`.
- Se a migração `20260327_stripe_sync_billing_incidents.sql` estiver aplicada, é inserida uma linha em `billing_incidents` com `reason = 'currency_mismatch'` para auditoria.

**Como validar:** Enviar um test webhook (Stripe Dashboard) com `metadata.restaurant_id` de um restaurante que tem `billing_currency = 'eur'` e payload com `currency = 'usd'` (ex.: subscription ou invoice em USD). Verificar que não há alteração em `gm_restaurants.billing_status` e que existe mensagem/incidente de currency_mismatch.

---

## 5. (Opcional) UI de Billing

- Abrir `/app/billing` com sessão de um tenant com subscrição ativa (após webhook ou sync).
- Verificar: estado de subscrição (trial/active/past_due/canceled) e histórico de faturas com `currency` e valores corretos (quando invoices estiverem a ser sincronizadas).

---

## Resumo

| Passo | Obrigatório | Descrição |
|-------|-------------|-----------|
| 1. Script E2E 3 moedas | Sim | `./scripts/e2e-billing-three-currencies.sh` — checkout por moeda (com `restaurant_id`) |
| 2. Tenants + UI preços | Opcional | Validar resolução de moeda por tenant |
| 3. Webhook + estado | Opcional | Send test webhook; verificar DB e ausência de incidente |
| 4. Cross-currency guard | Opcional | Evento com moeda diferente → sem update, currency_mismatch |
| 5. UI Billing | Opcional | Estado de subscrição e faturas |

Antes de go-live oficial, o passo 1 deve passar. Os passos 2–5 reforçam a validação em combate controlado.
