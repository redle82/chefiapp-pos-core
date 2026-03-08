# Migração Render → Supabase Edge Functions

**Estado:** Guia de migração do backend em Render ([server/integration-gateway.ts](../../server/integration-gateway.ts)) para Supabase Edge Functions. Arquitetura alvo: [ARCHITECTURE_OFFICIAL_2026.md](../architecture/ARCHITECTURE_OFFICIAL_2026.md).

---

## 1. Mapa de rotas (Render → Edge)

| Rota actual (Render) | Método | Edge Function | Notas |
|----------------------|--------|----------------|-------|
| `/health` | GET | `health` | Resposta `{ status: "ok" }` |
| `/api/v1/webhook/sumup` | POST | `webhook-sumup` | HMAC-SHA256 (SUMUP_WEBHOOK_SECRET), RPC `process_webhook_event` |
| `/api/v1/webhook/stripe` | POST | `webhook-stripe` | `stripe.webhooks.constructEvent` (raw body), RPC ou lógica equivalente |
| `/internal/billing/create-checkout-session` | POST | `billing-create-checkout-session` | Bearer INTERNAL_API_TOKEN; allowlist origem; Stripe Checkout Session |
| `/internal/events` | POST | `internal-events` | Bearer INTERNAL_API_TOKEN; gravar/reencaminhar Webhooks OUT |
| `/api/v1/sumup/checkout` | POST | `sumup-create-checkout` | Bearer INTERNAL_API_TOKEN; SumUp API create checkout |
| `GET /api/v1/sumup/checkout/:id` | GET | `sumup-get-checkout` | Bearer; SumUp API get checkout |
| `/api/v1/payment/pix/checkout` | POST | `payment-pix-checkout` | Bearer; SumUp PIX checkout |
| `GET /api/v1/payment/sumup/checkout/:id` | GET | `sumup-get-checkout` | Mesma função com path param |

Rotas que podem permanecer no Core ou ser chamadas directas pelo frontend (PostgREST + RLS): `POST /api/v1/orders`, `PATCH /api/v1/orders/:id`, `POST /api/v1/tasks`, `POST /api/v1/integrations/whatsapp/incoming`. Não precisam de Edge se o frontend usar CORE_URL + anon key com RLS.

---

## 2. URL do frontend após migração

- **Antes (Render):** `VITE_API_BASE=https://chefiapp-backend.onrender.com` (ou URL do serviço).
- **Depois (Edge):** `VITE_API_BASE=https://<PROJECT_REF>.supabase.co/functions/v1`

Cada Edge Function é invocada como:

- `POST https://<PROJECT_REF>.supabase.co/functions/v1/webhook-sumup`
- `POST https://<PROJECT_REF>.supabase.co/functions/v1/billing-create-checkout-session`
- etc.

O frontend hoje usa paths como `/internal/billing/create-checkout-session` e `VITE_API_BASE` como base. Portanto é necessário **ou** (1) uma única função `gateway` que faz routing por path (e a base continua a ser a mesma, só muda o host), **ou** (2) alterar cada chamada no frontend para usar paths como `/webhook-sumup`, `/billing-create-checkout-session`. Este doc assume **opção 1** (função `gateway` que roteia) para minimizar alterações no frontend: uma única URL base `https://<PROJECT_REF>.supabase.co/functions/v1/gateway` e o frontend mantém os paths actuais (ex.: `POST .../gateway` com header ou body indicando path, ou Edge recebe todas as rotas sob `gateway` e lê path do request). Na prática, Supabase Edge não expõe um “router” por path na mesma função; cada função tem um nome. Então a solução é: **uma função chamada `gateway`** que no código lê o path (ex.: de um header `X-Forwarded-Path` ou do URL de invocação). Supabase invoca com `POST /functions/v1/gateway` — o path interno (ex. `/internal/billing/create-checkout-session`) pode ser passado no body ou num header. Alternativa mais limpa: **múltiplas funções** e no frontend alterar a base URL por feature (ex. billing usa `.../billing-create-checkout-session`). Para simplicidade, este guia assume **múltiplas Edge Functions** e **alteração mínima no frontend**: um único base URL `https://<PROJECT_REF>.supabase.co/functions/v1` e paths que mudam para o nome da função (ex. `billing-create-checkout-session` em vez de `internal/billing/create-checkout-session`). Assim não é preciso um router dentro da Edge.

**Decisão documentada:** Usar múltiplas funções. Frontend altera para:
- Billing: `POST ${VITE_API_BASE}/billing-create-checkout-session` (em vez de `/internal/billing/create-checkout-session`)
- Events: `POST ${VITE_API_BASE}/internal-events` (em vez de `/internal/events`)
- SumUp checkout: `POST ${VITE_API_BASE}/sumup-create-checkout`, `GET ${VITE_API_BASE}/sumup-get-checkout/:id`
- PIX: `POST ${VITE_API_BASE}/payment-pix-checkout`

Ou manter compatibilidade com paths antigos expondo uma **única função `gateway`** que recebe o request e, no código Deno, despacha por path (req.url). Assim o frontend não muda: `VITE_API_BASE=https://<PROJECT_REF>.supabase.co/functions/v1/gateway` e as chamadas continuam a ser `/internal/billing/create-checkout-session` etc. como path. Supabase Edge não suporta path após o nome da função por defeito (cada função é um endpoint). Para ter um único entrypoint com paths, seria necessário um proxy ou uma função que recebe o path noutro lado (ex. body). A abordagem mais realista: **uma Edge Function `gateway`** que é invocada com **body** contendo `{ _path, _method, ...body }` para o backend decidir a rota — ou usar **Query String**: `POST /functions/v1/gateway?path=/internal/billing/create-checkout-session`. Assim o frontend faz `fetch(VITE_API_BASE + '/gateway?path=' + encodeURIComponent('/internal/billing/create-checkout-session'), { method: 'POST', body: ... })`. Isso exige alteração em todos os call sites. Mais simples: **várias funções** e no frontend um único `VITE_API_BASE` e trocar os paths para os nomes das funções. Documentado em baixo.

---

## 3. Assinatura e verificação de webhooks

- **SumUp:** Header `X-SumUp-Signature` = `sha256=<hex>`. Calcular HMAC-SHA256 do body (raw string) com `SUMUP_WEBHOOK_SECRET`; comparar com timing-safe equal. Em Deno: `crypto.subtle.sign` ou implementação HMAC com Web Crypto.
- **Stripe:** Header `Stripe-Signature`; usar `stripe.webhooks.constructEvent(body, signature, secret)` com o body **raw** (ArrayBuffer). Em Edge, ler `req.arrayBuffer()` e não fazer `req.json()` antes da verificação.

---

## 4. Rollout

1. **Pré-requisitos:** Criar funções em `supabase/functions/`, configurar secrets (ver [EDGE_ENV.md](./EDGE_ENV.md)), testar localmente: `supabase functions serve`.
2. **Deploy:** `supabase functions deploy webhook-sumup`, `deploy webhook-stripe`, `deploy billing-create-checkout-session`, etc. (ou `supabase functions deploy` para todas).
3. **Webhooks Stripe/SumUp:** No dashboard de cada provider, alterar a URL do webhook para `https://<PROJECT_REF>.supabase.co/functions/v1/webhook-sumup` e `.../webhook-stripe`.
4. **Frontend:** Alterar `VITE_API_BASE` no build (Vercel/Render env) para `https://<PROJECT_REF>.supabase.co/functions/v1`. Ajustar paths das chamadas para os nomes das funções (ver secção 2) **ou** manter um proxy no Render que encaminha para Edge (híbrido durante transição).
5. **Validação:** Testar checkout billing, webhook SumUp/Stripe (eventos de teste), e internal/events.

---

## 5. Rollback

1. **Frontend:** Reverter `VITE_API_BASE` para a URL do backend Render; redeploy do merchant-portal.
2. **Webhooks:** No Stripe e SumUp, repor a URL do webhook para o endpoint Render (ex. `https://chefiapp-backend.onrender.com/api/v1/webhook/sumup`).
3. **Serviço Render:** Garantir que o serviço backend continua activo e a receber tráfego.
4. Opcional: desactivar ou não invocar as Edge Functions (não é obrigatório apagá-las; basta deixar de as usar).

---

## 6. Checklist “done” (migração)

- [x] Todas as rotas críticas (webhooks, billing, internal/events, sumup/pix checkout) implementadas em Edge.
- [x] Verificação de assinatura SumUp e Stripe activa; nenhum webhook processado sem verificação.
- [x] Idempotência mantida (RPC `process_webhook_event` ou equivalente com UNIQUE em provider+event_id).
- [x] Env vars documentadas em [EDGE_ENV.md](./EDGE_ENV.md) e configuradas no projeto Supabase.
- [x] Frontend a usar nova base URL e paths das funções (CONFIG.isEdgeGateway + paths por função); testes E2E de checkout e webhook (staging).
- [x] Runbook de rollback documentado (este documento, secção 5).
