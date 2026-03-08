# Auditoria de risco por endpoint

Documento de apoio à priorização de testes (Fase B — server coverage 60%+). Inventário dos endpoints do integration-gateway e das Edge Functions, com classificação de risco.

**Referência:** [server/integration-gateway.ts](../../server/integration-gateway.ts), [supabase/functions/](../../supabase/functions/).

---

## 1. Inventário de endpoints

### 1.1 Integration-gateway (server)

| Path | Método | Bloco (linhas aprox.) | Notas |
|------|--------|------------------------|--------|
| `OPTIONS` (qualquer path) | OPTIONS | 1128–1132 | CORS preflight |
| `/` ou `` | GET | 1135–1145 | Raiz: JSON service info |
| `/favicon.ico` | GET | 1147–1151 | 204 |
| `/health` | GET | 1153–1157 | Health check |
| `/internal/events` | POST | 1159–1177 | Token interno; delega a `handleInternalEvents` |
| `/internal/product-images` | POST | 1180–1199 | Token interno; delega a `handleProductImageUpload` |
| `/internal/billing/create-checkout-session` | POST | 1202–1326 | Token interno; mock vs Stripe real |
| `/api/v1/webhook/sumup` | POST | 1329–1340 | Assinatura X-SumUp-Signature; delega a `handleSumUpWebhook` |
| `/api/v1/payment/pix/checkout` | POST | 1343–1426 | Token interno; SumUp PIX |
| `/api/v1/payment/sumup/checkout/:id` | GET | 1429–1478 | Token interno; SumUp checkout status |
| `/api/v1/sumup/checkout` | POST | 1481–1574 | Token interno; SumUp checkout create |
| `/api/v1/sumup/checkout/:id` | GET | 1576–1627 | Token interno; SumUp checkout status |
| `path.startsWith("/api/v1/")` (fallback) | * | 1630–1700+ | API key (X-API-Key / Bearer); delega a `handleApiV1` |

**handleApiV1** (chamado apenas após auth por API key) trata:

| Path (interno) | Método | Linhas aprox. |
|----------------|--------|----------------|
| `/api/v1/orders` | POST | 781–874 |
| `/api/v1/orders/:orderId` | PATCH | 878–940 |
| `/api/v1/orders/:orderId/payment` | POST | 942–965 |
| `/api/v1/integrations/whatsapp/incoming` | POST | 968–1026 |
| `/api/v1/tasks` | POST | 1029–1123 |
| Qualquer outro `/api/v1/*` | * | 404 (não match em handleApiV1) |

### 1.2 Edge Functions (Supabase)

| Função | Path (invocação) | Método | Ficheiro |
|--------|------------------|--------|----------|
| webhook-stripe | `/webhook-stripe` (Edge URL) | POST | [supabase/functions/webhook-stripe/index.ts](../../supabase/functions/webhook-stripe/index.ts) |
| webhook-sumup | `/webhook-sumup` (Edge URL) | POST | [supabase/functions/webhook-sumup/index.ts](../../supabase/functions/webhook-sumup/index.ts) |

A lógica de negócio (verificação de assinatura, RPC `process_webhook_event`, billing sync) está na Edge. O server ainda expõe `/api/v1/webhook/sumup` (handleSumUpWebhook) para compatibilidade/local.

---

## 2. Classificação de risco por endpoint

### Crítico (impacto financeiro / compliance)

- **POST /internal/billing/create-checkout-session** — checkout Stripe; origem permitida; preço; mock vs real.
- **POST /api/v1/webhook/sumup** (server) — webhook SumUp; assinatura; RPC process_webhook_event.
- **Edge: webhook-stripe** — assinatura Stripe; RPC; billing sync (customer.subscription.*).
- **Edge: webhook-sumup** — assinatura SumUp; RPC; idempotência.
- **POST /api/v1/payment/pix/checkout**, **POST /api/v1/sumup/checkout**, **GET .../checkout/:id** — criação e estado de checkouts de pagamento.

### Alto (operação e dados)

- **POST /internal/events** — eventos internos; Core webhook configs; entrega a webhooks externos.
- **POST /internal/product-images** — upload e processamento de imagens; Core PATCH gm_products.
- **handleApiV1:** POST /api/v1/orders, PATCH orders/:id, POST orders/:id/payment, POST integrations/whatsapp/incoming, POST /api/v1/tasks — API pública com API key; Core RPC.

### Médio (observabilidade)

- **GET /health**, **GET /** — saúde e identificação do serviço.

### Baixo

- **GET /favicon.ico**, **OPTIONS** — sem impacto funcional.

---

## 3. Por endpoint crítico/alto — auth, branches, cobertura

### POST /internal/billing/create-checkout-session

- **Auth:** `X-Internal-Token` ou `Authorization: Bearer` = INTERNAL_API_TOKEN.
- **Body obrigatório:** `price_id`, `success_url`, `cancel_url`, `restaurant_id` (UUID). `restaurant_id` é usado em `subscription_data.metadata` e `metadata` na sessão Stripe para o webhook resolver o tenant.
- **Branches:** 401 (sem/ token inválido), 400 (JSON inválido), 400 (price_id/success_url/cancel_url/restaurant_id em falta), 400 (restaurant_id inválido/não-UUID), 403 (origem não permitida), 400 (no_such_price), 200 mock (IS_BILLING_MOCK), 200 Stripe (session.url), 500 (Stripe throw).
- **Cobertura atual:** 401, 400 poison, 400 campos em falta, 400 restaurant_id em falta, 400 restaurant_id inválido, 403, 200 mock, 400 no_such_price, 500 Stripe (mock throw), 200 com Stripe (mock resolve) em [tests/unit/server/integration-gateway.test.ts](../../tests/unit/server/integration-gateway.test.ts).

### POST /api/v1/webhook/sumup (handleSumUpWebhook)

- **Auth:** Assinatura opcional (X-SumUp-Signature); se SUMUP_WEBHOOK_SECRET set, valida HMAC.
- **Branches:** 400 (JSON inválido), 401 (assinatura inválida quando secret set), eventId sintético (paymentId/event_id/id em falta), eventType (status vs event_type), 202 (CORE_SERVICE_KEY em falta), res.ok vs !res.ok (RPC), 500 (fetch/RPC throw).
- **Cobertura atual:** 400, 401 (wrong sig), 202 (no core key), 202 (success com core key) unit; 202 (event logged only) contract. Falta: eventId sintético, eventType derivado de status, 500 (RPC/fetch throw), assinatura válida com secret.

### POST /internal/events (handleInternalEvents)

- **Auth:** Token interno (X-Internal-Token ou Bearer).
- **Branches:** 400 (JSON inválido), 400 (event/restaurant_id em falta), fetchWebhookConfigs (CORE_SERVICE_KEY vazio → []), filter por events, 202 com endpoints count; exceção não tratada (fetch throw) → 500 no server catch.
- **Cobertura atual:** 401 (sem token), 500 (chaos fetch), 202 (body válido, endpoints 0). Falta: 400 bad_request campos, fetchWebhookConfigs com key (lista não vazia opcional).

### POST /internal/product-images (handleProductImageUpload)

- **Auth:** Token interno.
- **Branches:** 400 (JSON inválido), 400 (restaurant_id/product_id/data_base64 em falta), 400 (base64 inválido), 200 (processProductImage + uploadProductImage), CORE_SERVICE_KEY → PATCH gm_products ou skip, 500 (process ou upload throw).
- **Cobertura atual:** 400 vários, 200 com mock, 500 (process throw), 500 (upload throw). Falta: branch com CORE_SERVICE_KEY (PATCH chamado).

### POST /api/v1/payment/pix/checkout, POST /api/v1/sumup/checkout, GET .../checkout/:id

- **Auth:** Token interno (verifyPaymentInternalToken).
- **Branches:** 401, 503 (SUMUP_ACCESS_TOKEN em falta), 400 (body inválido/campos em falta), 201/200 (createSumUpCheckoutApi / getSumUpCheckoutApi), 500 (API throw).
- **Cobertura atual:** Contract HTTP para 401 (sem token) e 503 (SUMUP_ACCESS_TOKEN em falta) em [tests/unit/server/integration-gateway.test.ts](../../tests/unit/server/integration-gateway.test.ts). **Adiado:** 400, 201/200 e 500 — o gateway lê `SUMUP_ACCESS_TOKEN` em top-level; exercitar esses branches em unit/contract exigiria re-import do módulo com env set ou injecção de config. Ficam para teste de integração ou quando houver ponto de injecção.

### Fallback path.startsWith("/api/v1/")

- **Auth:** X-API-Key ou Authorization: Bearer → lookupApiKey (CORE_SERVICE_KEY necessário).
- **Branches:** 401 (sem key), 401 (key inválida), 429 (rate limit), depois handleApiV1 → 200/201/400/404/500 conforme rota; 404 para path não tratado em handleApiV1.
- **Cobertura atual:** 401 (sem key), 401 invalid key (lookup vazio com CORE_SERVICE_KEY), 404 (path desconhecido em handleApiV1), 201/400/500 POST /api/v1/orders (contract handleApiV1), PATCH /api/v1/orders/:id (200, 404, 500, 400 invalid JSON/status), POST /api/v1/orders/:id/payment (200, 400 invalid JSON). **429 rate limit:** adiado — exercitar o branch exigiria 101 pedidos com a mesma API key no mesmo minuto; em suite partilhada o estado do rateLimitMap afecta testes seguintes e não é resetável sem refactor (injecção do limitador). Fica para teste de integração ou refactor.

### Edge: webhook-stripe

- **Auth:** Stripe-Signature + STRIPE_WEBHOOK_SECRET; stripe.webhooks.constructEvent.
- **Branches:** 405 (non-POST), 401 (signature ou secret em falta), 400 (constructEvent falha), 200 (sem SUPABASE_URL/KEY — received only), 500 (process_webhook_event erro), 200 (sucesso); billing event types disparam sync.
- **Cobertura atual:** Módulo Node [server/stripeWebhookVerify.ts](../../server/stripeWebhookVerify.ts) + [tests/unit/server/stripeWebhookVerify.test.ts](../../tests/unit/server/stripeWebhookVerify.test.ts) cobrem assinatura em falta, secret em falta, assinatura inválida e payload válido (generateTestHeaderString). Edge em Deno mantém implementação própria.

### Edge: webhook-sumup

- **Auth:** X-SumUp-Signature; HMAC-SHA256 quando SUMUP_WEBHOOK_SECRET set.
- **Branches:** 405, 400 (JSON inválido), 401 (signature inválida quando secret set), RPC process_webhook_event, 500 (RPC falha), 200 (sucesso).
- **Cobertura atual:** Sem testes automatizados no monorepo (Deno).

---

## 4. Resumo para Fase B

- **B.1:** Aumentar branches em handleSumUpWebhook (eventId sintético, eventType, 500, assinatura válida), handleInternalEvents (400 bad_request), handleProductImageUpload (CORE_SERVICE_KEY PATCH se necessário).
- **B.2:** Contract tests HTTP para billing (403 já existe; completar no_such_price, 500), PIX/SumUp (401, 503, 400, 201/200, 500), fallback API key (401, 401 invalid, 429, 404).
- **B.3:** Testes Edge (extração de lógica testável em Node ou E2E).
- **B.4:** Gate SERVER_COVERAGE_BRANCHES_TARGET=60 e CI.
