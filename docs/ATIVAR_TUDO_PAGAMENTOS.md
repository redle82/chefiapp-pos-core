# Ativar tudo — Pagamentos (Stripe + SumUp Europa + PIX Brasil)

Checklist único para ativar os três meios de pagamento no frontend e no gateway. **Nunca commitar chaves reais.**

---

## 1. Frontend (merchant-portal) — variáveis

Definir em `.env.local` (dev) ou nas variáveis de ambiente do deploy (ex.: Vercel).

| Variável | Uso | Obrigatório para |
|----------|-----|-------------------|
| `VITE_STRIPE_PRICE_ID` | Preço do plano SaaS (ex.: €79/mês) | Billing + botão "Ativar agora" |
| `VITE_STRIPE_PUBLISHABLE_KEY` ou `VITE_STRIPE_PUBLIC_KEY` | Chave pública Stripe | Pagamento por cartão no TPV |
| `VITE_API_BASE` | URL do integration-gateway (ex.: `http://localhost:4320`) | PIX + SumUp EUR (checkout via gateway) |
| `VITE_INTERNAL_API_TOKEN` | Token para chamadas ao gateway (deve coincidir com `INTERNAL_API_TOKEN` do gateway) | PIX + SumUp EUR |

**Mínimo para ver preço e billing:** `VITE_STRIPE_PRICE_ID`.  
**Para cartão no TPV:** `VITE_STRIPE_PUBLISHABLE_KEY`.  
**Para PIX e SumUp EUR:** `VITE_API_BASE` + `VITE_INTERNAL_API_TOKEN` + gateway a correr com as rotas de payment.

---

## 2. Integration Gateway — variáveis

O gateway (porta 4320, ex.: `pnpm run dev:gateway` ou deploy em Render) precisa de:

| Variável | Uso | Obrigatório para |
|----------|-----|-------------------|
| `INTERNAL_API_TOKEN` | Token aceite pelo gateway para rotas internas (PIX, SumUp checkout) | PIX + SumUp EUR |
| `CORE_URL` | URL do Core (PostgREST) | Persistir pagamentos / webhooks |
| `CORE_SERVICE_KEY` | Chave service do Core (ou anon) | Persistir pagamentos |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe | Billing (checkout session) |
| `SUMUP_ACCESS_TOKEN` | Token SumUp API | SumUp EUR + PIX (criar checkout) |
| `SUMUP_WEBHOOK_SECRET` | (Opcional) Secret para validar webhook SumUp | Confirmar pagamentos SumUp |

**Nota:** Se o gateway que corres (`server/integration-gateway.ts`) não expuser `/api/v1/payment/pix/checkout` nem `/api/v1/sumup/checkout`, essas rotas terão de ser implementadas ou usar o pacote `integration-gateway` que as tenha. Ver [SUMUP_EUR_INTEGRATION_GUIDE.md](SUMUP_EUR_INTEGRATION_GUIDE.md) e [PIX_ACTIVATION_PLAN.md](PIX_ACTIVATION_PLAN.md).

---

## 3. Passos para ativar tudo (local)

1. **Gateway**
   - Definir no env: `INTERNAL_API_TOKEN`, `CORE_URL`, `CORE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `SUMUP_ACCESS_TOKEN` (e opcionalmente `SUMUP_WEBHOOK_SECRET`).
   - Iniciar: `pnpm run dev:gateway` (porta 4320).

2. **Frontend**
   - Copiar `.env.local.example` para `.env.local`.
   - Preencher: `VITE_STRIPE_PRICE_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_API_BASE=http://localhost:4320`, `VITE_INTERNAL_API_TOKEN=<mesmo valor do gateway>`.
   - Iniciar: `pnpm --filter merchant-portal run dev` (porta 5175).

3. **Validar**
   - **Billing:** Abrir `/app/billing` → preço visível, botão "Ativar agora" ativo.
   - **TPV:** Abrir TPV → Pagar → Cartão (Stripe), PIX, Cartão EUR (SumUp) visíveis; Cartão funciona se Stripe key definida; PIX e SumUp EUR funcionam se o gateway tiver as rotas e `SUMUP_ACCESS_TOKEN`.

---

## 4. Produção (Vercel + Render)

- **Vercel (merchant-portal):** Definir `VITE_STRIPE_PRICE_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_API_BASE` (URL do gateway), `VITE_INTERNAL_API_TOKEN` (sensível). Redeploy após alterar.
- **Render (ou host do gateway):** Definir `INTERNAL_API_TOKEN`, `CORE_URL`, `CORE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `SUMUP_ACCESS_TOKEN`, `SUMUP_WEBHOOK_SECRET` (opcional). Redeploy.

---

## 5. Referências

- **Fase 2 geral:** [FASE_2_PAGAMENTOS.md](FASE_2_PAGAMENTOS.md)
- **Stripe (billing):** [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md)
- **SumUp Europa:** [SUMUP_EUR_INTEGRATION_GUIDE.md](SUMUP_EUR_INTEGRATION_GUIDE.md)
- **PIX Brasil:** [PIX_ACTIVATION_PLAN.md](PIX_ACTIVATION_PLAN.md) · [PIX_UI_INTEGRATION_COMPLETE.md](PIX_UI_INTEGRATION_COMPLETE.md)
- **Env produção:** [docs/ops/PRODUCTION_ENV_SETUP.md](ops/PRODUCTION_ENV_SETUP.md)
