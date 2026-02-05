# Validação domínio em produção

**Objetivo:** Apontar o domínio para o merchant-portal, HTTPS ativo, e alinhar Stripe (redirects e webhook).

**Referências:** [PLANO_VENDA_STRIPE_DOMINIO_ONBOARDING.md](./PLANO_VENDA_STRIPE_DOMINIO_ONBOARDING.md) · [VALIDACAO_STRIPE_PRODUCAO.md](./VALIDACAO_STRIPE_PRODUCAO.md)

---

## 1. Domínio e DNS

- [ ] **Domínio** comprado (ex.: `chefiapp.pt`, subdomínio `app.chefiapp.pt`).
- [ ] **DNS:** Registo A ou CNAME apontando para o host do merchant-portal (IP da VPS ou CNAME da Vercel/Netlify).
- [ ] **Propagação:** `dig app.chefiapp.pt` (ou equivalente) resolve para o IP/correcto.

---

## 2. HTTPS

- [ ] **Certificado** ativo (Let's Encrypt, ou automático na Vercel/Netlify).
- [ ] **URL de produção:** `https://<teu-dominio>` abre sem aviso de certificado (ex.: `https://app.chefiapp.pt`).

---

## 3. Deploy do merchant-portal

- [ ] **Build** do merchant-portal deployado no host que responde ao domínio (ex.: Vercel, Netlify, VPS com nginx).
- [ ] **SPA:** O servidor devolve `index.html` para rotas do front (/, /auth, /app/billing, /billing/success, etc.). O [vite.config.ts](../merchant-portal/vite.config.ts) usa `base: "/"` — em produção não é necessário alterar para domínio; o browser usa o origin do site.
- [ ] **Variáveis de ambiente** de produção definidas no host (VITE_STRIPE_PRICE_ID, VITE_API_BASE ou SUPABASE_URL para o Core, etc.).

---

## 4. Stripe com domínio real

O [BillingBroker](../merchant-portal/src/core/billing/BillingBroker.ts) usa `window.location.origin` para success e cancel:

- `successUrl = origin + '/billing/success'`
- `cancelUrl = origin + '/app/billing?billing=cancel'`

Em produção, assim que o utilizador abre o app em `https://<teu-dominio>`, o origin já é correcto. Garantir:

- [ ] **Stripe Dashboard → Product / Checkout:** URLs de redirect permitidas ou deixar dinâmicas (Stripe aceita success_url/cancel_url enviadas pelo backend).
- [ ] **Webhook Stripe:** Endpoint em produção: `https://<teu-projeto>.supabase.co/functions/v1/stripe-billing-webhook` (não usar localhost). Secret em Supabase Edge Functions → `STRIPE_BILLING_WEBHOOK_SECRET`.

---

## 5. Teste rápido

1. Abrir `https://<teu-dominio>/` → landing (TPV demo + overlay).
2. Clicar "Começar agora" → `/auth`.
3. Abrir `https://<teu-dominio>/app/billing` → página de billing com preço e botão (se Stripe configurado).
4. (Após Stripe live) Fazer um checkout de teste e confirmar redirect para `https://<teu-dominio>/billing/success`.

---

**Próximo:** [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md) (onboarding 1º cliente).
