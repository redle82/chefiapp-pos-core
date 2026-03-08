# Billing — Cancel + Re-subscribe (validação manual)

**Objetivo:** Validar que, após cancelar uma assinatura Stripe e criar uma nova sessão de checkout, o estado em Core (`gm_restaurants.billing_status`, `merchant_subscriptions`) fica correto. Inclui uso de `metadata.restaurant_id` no checkout.

**Quando:** Antes de considerar a fase "Billing Freeze" fechada (Sprint 1 / Sprint 3 fluxos reais).

## Pré-requisitos

- Gateway a correr (`pnpm run dev:gateway`) com `STRIPE_SECRET_KEY` (test).
- Portal em `/app/billing` ou `/billing` com restaurante selecionado (`chefiapp_restaurant_id` em TabIsolatedStorage).
- Acesso ao Core/DB para consultar `gm_restaurants` e `merchant_subscriptions`.

## Passos

1. **Estado inicial**
   - Garantir que o restaurante de teste tem `billing_status` = `active` ou `trial` e uma linha em `merchant_subscriptions` com `stripe_subscription_id` preenchido (se já tiver assinatura).

2. **Cancelar assinatura**
   - No Stripe Dashboard (test): Customers → selecionar o customer do restaurante → Subscriptions → Cancel subscription (immediately ou at period end).
   - Ou via Stripe Customer Portal (UI): "Gerir faturação" → cancelar no Stripe.

3. **Verificar estado após cancelamento**
   - Webhook `customer.subscription.deleted` ou `customer.subscription.updated` (status=canceled) deve ser recebido.
   - No Core:
     - `SELECT id, billing_status, trial_ends_at FROM gm_restaurants WHERE id = '<restaurant_id>';` → `billing_status` deve refletir `canceled` (ou `past_due` conforme lógica).
     - `SELECT restaurant_id, status, stripe_subscription_id, canceled_at FROM merchant_subscriptions WHERE restaurant_id = '<restaurant_id>';` → `status` = `canceled`, `canceled_at` preenchido.

4. **Re-subscribe (novo checkout)**
   - Na UI: "Ativar agora" / "Mudar plano" para o mesmo ou outro plano.
   - A UI chama `createCheckoutSession(priceId, successUrl, cancelUrl, restaurantId)` com `restaurant_id` do tenant atual.
   - Concluir o checkout Stripe (cartão de teste).

5. **Verificar estado após re-subscribe**
   - Webhook `customer.subscription.created` ou `customer.subscription.updated` com `metadata.restaurant_id` = restaurante.
   - No Core:
     - `gm_restaurants.billing_status` = `active` (ou `trial` se trial).
     - `merchant_subscriptions`: nova linha ou atualização com `stripe_subscription_id` novo, `status` = `active`, `canceled_at` = NULL.

6. **Cross-currency (opcional)**
   - Se o restaurante tiver `billing_currency` = EUR e o evento Stripe vier com `currency` = USD, `sync_stripe_subscription_from_event` deve **não** atualizar estado e registar em `billing_incidents` (reason `currency_mismatch`) quando a migração 20260327 estiver aplicada. Ver `docs/BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md` §4.2.

## O que verificar no DB (resumo)

| Momento           | gm_restaurants.billing_status | merchant_subscriptions.status |
|-------------------|-------------------------------|-------------------------------|
| Após cancelamento | canceled (ou past_due)        | canceled                      |
| Após re-subscribe | active (ou trial)             | active                        |

## Referências

- `server/integration-gateway.ts`: `restaurant_id` obrigatório no body de `POST /internal/billing/create-checkout-session`.
- `docker-core/schema/migrations/20260223_stripe_sync_timestamp_guard.sql`: `sync_stripe_subscription_from_event` com currency/price guard.
- `docs/BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md` §4–5.
