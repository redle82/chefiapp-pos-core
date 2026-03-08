# Variáveis de ambiente — Supabase Edge Functions

**Propósito:** Lista canónica de secrets/env vars para as Edge Functions que substituem o gateway Render (webhooks, billing, internal events). Configurar em **Supabase Dashboard → Project Settings → Edge Functions → Secrets**.

---

## Obrigatórias (core)

| Variável | Uso | Exemplo (nunca commitar valores reais) |
|----------|-----|----------------------------------------|
| `SUPABASE_URL` | URL do projeto Supabase | `https://<PROJECT_REF>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | RPC e writes server-side (process_webhook_event, gm_payments, etc.) | `eyJ...` |

---

## Webhooks

| Variável | Uso | Quando |
|----------|-----|--------|
| `SUMUP_WEBHOOK_SECRET` | Verificação HMAC-SHA256 do header `X-SumUp-Signature` (ou `X-SumUp-Signature` = `sha256=<hmac(body)>`) | Webhook SumUp |
| `STRIPE_WEBHOOK_SECRET` ou `STRIPE_WHSEC` | Verificação `stripe.webhooks.constructEvent(body, signature, secret)` | Webhook Stripe |

---

## Billing (Stripe Checkout)

| Variável | Uso | Quando |
|----------|-----|--------|
| `STRIPE_SECRET_KEY` | Criar Checkout Session (`stripe.checkout.sessions.create`) | `billing-create-checkout-session` |
| `STRIPE_PRICE_STARTER` | Price ID para plano starter (ou slug → price) | Opcional; pode vir do body |
| `STRIPE_PRICE_PRO` | Price ID plano pro | Opcional |
| `STRIPE_PRICE_ENTERPRISE` | Price ID plano enterprise | Opcional |
| `BILLING_ALLOWED_ORIGINS` | Origens permitidas para checkout (CORS); comma-separated | Ex.: `https://chefiapp.com,https://www.chefiapp.com` |

---

## Internal / Auth

| Variável | Uso | Quando |
|----------|-----|--------|
| `INTERNAL_API_TOKEN` | Bearer token para `/internal/events`, SumUp/PIX checkout (Authorization ou X-Internal-Token) | Chamadas do frontend e serviços internos |

---

## SumUp Checkout (card / PIX)

| Variável | Uso | Quando |
|----------|-----|--------|
| `SUMUP_ACCESS_TOKEN` | Bearer para API SumUp (`POST /v0.1/checkouts`, `GET /v0.1/checkouts/:id`) | Criar/obter checkout card ou PIX |

---

## Resumo mínimo para webhooks + billing

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUMUP_WEBHOOK_SECRET` (se usar webhook SumUp)
- `STRIPE_WEBHOOK_SECRET` (se usar webhook Stripe)
- `STRIPE_SECRET_KEY` (para create-checkout-session)
- `INTERNAL_API_TOKEN`
- `BILLING_ALLOWED_ORIGINS`

Para SumUp/PIX checkout além de webhook:

- `SUMUP_ACCESS_TOKEN`

---

## Referência

- [ARCHITECTURE_OFFICIAL_2026.md](../architecture/ARCHITECTURE_OFFICIAL_2026.md)
- [MIGRATION_RENDER_TO_EDGE.md](./MIGRATION_RENDER_TO_EDGE.md)
