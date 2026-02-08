# ChefIApp — Pagamentos como integração plugável (SPEC)

**Data:** 2026-01-29  
**Referência:** [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md)  
**Objetivo:** Definir Pagamentos como **integração** (tipo payment), não como dependência hardcoded do Core. Stripe é o primeiro adapter; o sistema trata “quem processa pagamentos?” via Registry, não via import direto.

---

## 1. Distinção

### ❌ Não é

- O Core importar Stripe (ou outro provedor) diretamente em vários sítios.
- Lógica de checkout/portal espalhada por features.
- Impossível trocar de provedor sem refatorar o produto.

### ✅ É

- **Uma (ou mais) integrações** tipo `payment`, registadas no Integration Hub.
- O Core (ou um facade) pergunta ao Registry: “qual adapter está ativo para pagamentos?” e delega.
- Stripe como primeiro adapter; futuros (Paddle, outro gateway) como adapters adicionais, sem contaminar o Core.

---

## 2. Modelo no Integration Hub

| Campo | Valor (Stripe) |
|-------|-----------------|
| **id** | `stripe` |
| **type** | `payment` |
| **name** | Stripe |
| **description** | Assinaturas SaaS (checkout, portal do cliente) e opcionalmente pagamentos em loja. |
| **status** | disabled \| configured \| active \| error |
| **capabilities** | `payments.process` |

Config (por restaurante ou por tenant): chaves da API (ou uso de Edge Function central), priceId de assinatura, URLs de sucesso/cancelamento. Tudo na secção Integrações → Pagamentos.

---

## 3. Capacidade: payments.process

Já existe em `IntegrationContract` como `IntegrationCapability`.

- **Significado:** Pode processar pagamentos (checkout, portal, confirmação).
- **Uso Stripe (hoje):** Checkout de assinatura (SaaS), Portal do cliente (gerir assinatura). Opcional no futuro: pagamentos no TPV (cartão, etc.).
- **Contrato:** O adapter expõe operações que o sistema chama (ex.: “iniciar checkout”, “abrir portal”). Quem chama não sabe se é Stripe ou outro; só sabe que é o adapter de pagamentos ativo.

---

## 4. Estado atual (Stripe + BillingBroker)

Hoje:

- **BillingBroker** (`core/billing/BillingBroker.ts`) chama a Edge Function `stripe-billing` (Supabase) com ações `create-checkout-session` e `create-portal-session`.
- O produto usa BillingBroker diretamente (ex.: botão “Assinar”, “Gerir assinatura”). Não há adapter registado; o Core “conhece” Stripe através desta abstração, mas a abstração é ainda Stripe-específica.

Objetivo da spec: **isolar** Stripe atrás do modelo de integração, para que:

1. O Hub mostre “Stripe” como integração (status, config, ativar/desativar).
2. A lógica de “quem faz checkout/portal?” passe por um **facade** que usa o adapter registado (ex.: `PaymentIntegrationService.getAdapter()` → chama adapter.stripe ou adapter.startCheckout() conforme contrato).
3. BillingBroker possa ficar **dentro** do adapter Stripe (ou o facade chama BillingBroker quando o adapter ativo for Stripe), sem o resto do app importar BillingBroker diretamente para “iniciar checkout”.

---

## 5. Contrato do adapter de pagamentos (extensão)

Para integrações tipo payment, além de `IntegrationAdapter` podemos definir uma interface opcional (ou convenção) para operações de billing:

- **startCheckout(priceId: string, successUrl: string, cancelUrl: string): Promise<{ url: string; sessionId?: string }>**
- **openCustomerPortal(returnUrl: string): Promise<{ url: string }>**

O adapter Stripe implementa estas funções chamando BillingBroker (ou a Edge Function). Outro provedor implementaria com a sua API. O **facade** (ex.: `PaymentIntegrationService`) obtém o adapter ativo do Registry, faz cast ou verifica capacidade, e chama o método. Assim, a UI continua a chamar “iniciar checkout” sem saber se é Stripe ou outro.

(Se preferir não estender o contrato agora, o facade pode verificar `adapter.id === 'stripe'` e chamar BillingBroker. O importante é que **só um sítio** sabe que Stripe existe; o resto usa o facade.)

---

## 6. Eventos e webhooks

- **payment.confirmed** (ou equivalente): quando o provedor (Stripe) confirma pagamento (ex.: webhook `checkout.session.completed`), o **backend** (Edge Function ou serviço que recebe o webhook) deve emitir um evento no sistema (ex.: `payment.confirmed` com payload `{ subscriptionId, customerId, plan, ... }`). O produto (ex.: atualizar `product_mode` para live, mostrar “Assinatura ativa”) reage a esse evento.
- O **adapter** de pagamentos pode não emitir eventos ele próprio; quem emite é o handler do webhook que já fala com o Core. O adapter só precisa de healthCheck e das operações de checkout/portal. Opcionalmente, o adapter pode expor “último estado” (ex.: assinatura ativa) para o Hub mostrar status.

---

## 7. Configuração (UI — Integrações → Pagamentos)

Para Stripe (exemplo):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| enabled | boolean | Integração ativa. |
| priceId | string | ID do preço Stripe para assinatura (ex.: price_xxx). |
| successUrl | string | URL após checkout concluído (ex.: /billing/success). |
| cancelUrl | string | URL se o utilizador cancelar. |
| returnUrl | string | URL de regresso do portal do cliente. |

As chaves da API (secret key) ficam no backend (Edge Function / env); a UI não mostra secrets, só permite configurar priceId e URLs se necessário. O BillingBroker hoje usa URLs fixas no código; podem passar a ser configuráveis por integração.

---

## 8. Fluxo de implementação (resumo)

1. **Registar adapter Stripe** no IntegrationRegistry com id `stripe`, type `payment`, capability `payments.process`.
2. **Facade:** Criar `PaymentIntegrationService` (ou equivalente) que: obtém adapter ativo para payment (do Registry ou de config); se for Stripe, chama BillingBroker; se for outro, chama o outro. A UI (botões “Assinar”, “Gerir assinatura”) chama o facade, não BillingBroker diretamente.
3. **Hub:** Na secção Integrações → Pagamentos, listar integrações tipo payment (Stripe primeiro); mostrar status (healthCheck), config (priceId, URLs), ativar/desativar.
4. **Webhook:** Garantir que o handler Stripe (backend) emite `payment.confirmed` (ou evento equivalente) para o sistema atualizar estado (product_mode, etc.).
5. **Futuro:** Outro provedor (ex.: Paddle) = novo adapter, mesmo contrato; registado no Registry; o facade escolhe qual usar conforme config (ex.: “payment provider” = stripe | paddle).

---

## 9. O que NÃO muda (curto prazo)

- A Edge Function `stripe-billing` e o BillingBroker podem manter-se como estão; o adapter Stripe ou o facade chama-os. Não é obrigatório reescrever tudo; é obrigatório **encapsular** atrás do modelo de integração e do facade para o Core deixar de depender diretamente de “Stripe”.

---

## 10. Resumo

- **Pagamentos = integração** (tipo `payment`), plugável e visível no Hub.
- **Stripe = primeiro adapter** (id `stripe`, capability `payments.process`); BillingBroker fica atrás do adapter ou do facade.
- **Core/UI** não importam BillingBroker para “iniciar checkout”; chamam um **facade** que delega no adapter ativo.
- **Eventos:** webhook do provedor emite `payment.confirmed`; o sistema reage (product_mode, etc.).
- **Futuro:** outro provedor = novo adapter; mesmo contrato; sem mudar o Core.

---

## Referências

- [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md) — Camada de integrações, Pagamentos como integração
- `merchant-portal/src/core/billing/BillingBroker.ts` — Estado atual (Stripe via Edge Function)
- `merchant-portal/src/integrations/core/IntegrationContract.ts` — IntegrationAdapter, payments.process
