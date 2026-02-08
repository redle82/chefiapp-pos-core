# Contrato: Billing → productMode live

**Data:** 2026-01-28
**Status:** Contrato + implementado (billing webhook → Core).
**Objetivo:** Definir a interface entre fluxo de pagamento e ativação de `productMode="live"`.

---

## Regra de ouro

A transição para **ao vivo** é rara e contratual. O modo não deve ser ativado por toggle na UI; a confirmação de pagamento (ou contrato assinado) no backend é a fonte de verdade.

---

## O que já existe

- **Core:** `gm_restaurants.product_mode` (`demo` | `pilot` | `live`). Persistido via RuntimeWriter.setProductMode.
- **UI:** Backoffice e Dashboard exibem modo e CTAs "Ativar piloto" / "Ativar ao vivo"; setProductMode persiste no Core quando o backend é Docker.
- **Contrato atual:** Qualquer chamada que atualize `gm_restaurants.product_mode` para `live` fará o próximo refresh do RestaurantRuntimeContext refletir "AO VIVO".

---

## Contrato para billing (implementado)

Para que a confirmação de pagamento ative `productMode="live"`:

1. **Fonte de verdade:** O backend (Core ou serviço de billing) deve atualizar `gm_restaurants.product_mode` para `'live'` quando:

   - o pagamento for confirmado pelo provedor (Stripe, etc.), ou
   - o contrato/assinatura for ativado.

2. **Fluxo implementado (webhook):**

   - **Webhook:** Stripe chama `POST /webhooks/billing` no servidor (`server/billing-webhook-server.ts`). O servidor valida a assinatura, processa o evento e, quando `subscription_update.status === 'ACTIVE'` e existe `merchant_id` (restaurant_id) nos metadados da subscription, chama `server/core-client.ts` → PATCH em `gm_restaurants` (product_mode = live).
   - **Variáveis de ambiente (servidor):** `DOCKER_CORE_URL` (opcional, default `http://localhost:3001`), `DOCKER_CORE_SERVICE_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` para autenticar no PostgREST.
   - **Redirect + backend:** Futuro: usuário volta do checkout; UI chama endpoint "confirmar assinatura" que valida com o provedor e atualiza o Core; em seguida refresh do runtime.

3. **UI:** Após a atualização no Core, o merchant-portal já reflete o modo no próximo carregamento do estado (refresh). Opcional: após "confirmar assinatura", chamar `refresh()` no RestaurantRuntimeContext para atualizar imediatamente.

---

## O que NÃO fazer

- Não ativar `live` por botão na UI sem confirmação no backend (pagamento/contrato).
- Não expor endpoint público que altere `product_mode` para `live` sem validação de pagamento/contrato.

---

## Referências

- [FASE_FECHADA_NEXT.md](FASE_FECHADA_NEXT.md) — Próximos passos.
- **Merchant-portal:** RuntimeWriter `setProductMode(restaurantId, productMode)` (UI → Core).
- **Server (webhook):** `server/core-client.ts` `setProductMode(restaurantId, productMode)` (billing → Core).
- Migration: `docker-core/schema/migrations/20260128_product_mode.sql`.
