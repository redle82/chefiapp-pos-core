# Plano 72h — Gateway Mínimo para Stripe

**Objectivo:** Activar checkout Stripe (assinatura SaaS) via Supabase Edge Functions, sem integration-gateway nem Render.

**Stack:** Supabase Edge Functions + Vercel (frontend).

---

## 1. Arquitectura

| Componente | Onde | Função |
|------------|------|--------|
| Frontend | Vercel (chefiapp-pos-core) | Já pronto — usa `CONFIG.isEdgeGateway` quando `VITE_API_BASE` aponta a Supabase |
| Checkout | Supabase Edge `billing-create-checkout-session` | Cria sessão Stripe, devolve URL |
| Webhook | Supabase Edge `webhook-stripe` | Sincroniza assinatura no Core |
| Billing sync | Core RPC `process_webhook_event` | Já existe |

---

## 2. Passos de implementação (72h)

### 2.1 Deploy da Edge Function (Dia 1)

```bash
# Na raiz do projeto
cd /path/to/chefiapp-pos-core

# Login Supabase (se ainda não feito)
npx supabase login

# Link ao projecto (project ref: kwgsmbrxfcezuvkwgvuf)
npx supabase link --project-ref kwgsmbrxfcezuvkwgvuf

# Deploy billing-create-checkout-session
npx supabase functions deploy billing-create-checkout-session

# Deploy webhook-stripe (para sync de assinaturas)
npx supabase functions deploy webhook-stripe
```

### 2.2 Secrets no Supabase (Dia 1)

No Supabase Dashboard → Edge Functions → Secrets, definir:

| Secret | Valor | Nota |
|--------|-------|------|
| `STRIPE_SECRET_KEY` | `sk_live_...` ou `sk_test_...` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Do Stripe Dashboard → Webhooks |
| `INTERNAL_API_TOKEN` | Token forte (ex.: `openssl rand -hex 32`) | Deve coincidir com VITE_INTERNAL_API_TOKEN do frontend |
| `STRIPE_PRICE_STARTER` | `price_xxx` | (Opcional) Mapeia "starter" → price_id |
| `STRIPE_PRICE_PRO` | `price_xxx` | (Opcional) Mapeia "pro" → price_id |

Ou via CLI:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
npx supabase secrets set INTERNAL_API_TOKEN=xxx
```

### 2.3 Webhook Stripe (Dia 2)

1. No Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://kwgsmbrxfcezuvkwgvuf.supabase.co/functions/v1/webhook-stripe`
3. Eventos: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
4. Copiar o **Signing secret** (whsec_...) e configurar como `STRIPE_WEBHOOK_SECRET`

### 2.4 Variáveis no Vercel (Dia 2)

No projecto Vercel (chefiapp-pos-core) → Settings → Environment Variables:

| Variável | Valor (Produção) |
|----------|------------------|
| `VITE_API_BASE` | `https://kwgsmbrxfcezuvkwgvuf.supabase.co/functions/v1` |
| `VITE_INTERNAL_API_TOKEN` | O mesmo valor definido em Supabase para `INTERNAL_API_TOKEN` |

O frontend usa `CONFIG.isEdgeGateway` — quando `VITE_API_BASE` contém `supabase.co/functions/v1`, o path é `billing-create-checkout-session` (sem `/internal/billing/`).

### 2.5 Validação (Dia 3)

1. **Health:** `curl -X POST https://kwgsmbrxfcezuvkwgvuf.supabase.co/functions/v1/billing-create-checkout-session -H "Content-Type: application/json" -H "X-Internal-Token: <TOKEN>" -d '{}'` → 400 (body inválido, mas confirma que a função responde)
2. **Checkout real:** Ir a /app/billing, clicar "Assinar" / "Activate now" → deve redirecionar para Stripe Checkout
3. **Webhook:** Após pagamento de teste, verificar que `merchant_subscriptions` no Core foi actualizado

---

## 3. O que NÃO está incluído (gateway mínimo)

| Funcionalidade | Estado | Nota |
|----------------|--------|------|
| PIX (TPV) | ❌ | Requer integration-gateway ou payment-pix-checkout Edge |
| SumUp (TPV) | ❌ | Idem |
| Stripe cartão TPV | ❌ | Requer PaymentIntent via gateway |
| Customer Portal (gerir assinatura) | ❌ | Requer billing-create-portal-session Edge (criar) |
| Internal events | ❌ | Requer internal-events Edge |
| Upload imagens | ❌ | Requer gateway |

---

## 4. Rollback

Para desactivar checkout e voltar ao modo "operação sem gateway":

1. Em Vercel, alterar `VITE_API_BASE` para `https://your-gateway-url.vercel.app` (placeholder) ou vazio
2. Redeploy
3. `CONFIG.isGatewayAvailable` passa a `false` — checkout/PIX ocultos (PLANO_48H)

---

## 5. Ficheiros alterados (Plano 72h)

- `supabase/functions/billing-create-checkout-session/index.ts` — adicionado `restaurant_id` em metadata para sync webhook
- Nenhuma alteração no frontend — já suporta Edge via `CONFIG.isEdgeGateway`
