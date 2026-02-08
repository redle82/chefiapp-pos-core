# Validação Stripe em produção

**Objetivo:** Validar priceId, webhook e `/billing/success` antes do primeiro cliente pagante.

**Código relevante:** [merchant-portal/src/config.ts](../merchant-portal/src/config.ts) (env) · [BillingBroker.ts](../merchant-portal/src/core/billing/BillingBroker.ts) (successUrl) · [coreBillingApi.ts](../merchant-portal/src/core/billing/coreBillingApi.ts) (RPC) · [BillingSuccessPage.tsx](../merchant-portal/src/pages/Billing/BillingSuccessPage.tsx)

---

## 0. Obter Price ID no Stripe Dashboard (se ainda não tens)

No dashboard Stripe (test mode ou live):

1. **Product catalog** (menu esquerda) → **Products** → **Add product**.
2. Nome: ex. "ChefIApp Plano Mensal". Preço: **Recurring**, **€79** (ou 79 EUR), **Monthly**.
3. Guardar. Na página do produto aparece um **Price** com ID tipo `price_xxxxxxxxxxxx`.
4. Copiar esse **Price ID** e colar em `merchant-portal/.env.local` como `VITE_STRIPE_PRICE_ID=price_xxx`.

Sem um Price criado, não há `price_xxx` para configurar; o merchant-portal mostra "Preço do plano não configurado" até `VITE_STRIPE_PRICE_ID` estar preenchido.

---

## 1. Variáveis de ambiente (merchant-portal)

| Variável | Uso | Onde |
|----------|-----|------|
| `VITE_STRIPE_PRICE_ID` | Preço mensal (ex. €79); obrigatório para mostrar preço e botão "Ativar agora" | [config.ts](../merchant-portal/src/config.ts) → CONFIG.STRIPE_PRICE_ID |
| `VITE_STRIPE_PUBLISHABLE_KEY` ou `VITE_STRIPE_PUBLIC_KEY` | Chave pública Stripe (opcional para checkout redirect; usada noutros fluxos) | [config.ts](../merchant-portal/src/config.ts) |

Sem `VITE_STRIPE_PRICE_ID`, a [BillingPage](../merchant-portal/src/pages/Billing/BillingPage.tsx) mostra "Preço do plano não configurado" e desativa o botão.

---

## 2. Backend (Core ou Supabase) — checkout e webhook

- **Checkout:**  
  - **Backend Supabase:** O merchant-portal chama a Edge Function `stripe-billing` com `action: "create-checkout-session"`, `priceId`, `successUrl`, `cancelUrl`. A função usa `STRIPE_SECRET_KEY` (Supabase Secrets ou `supabase/.env.local`) e devolve `{ url, sessionId }`. [coreBillingApi.ts](../merchant-portal/src/core/billing/coreBillingApi.ts) — caminho Supabase implementado.  
  - **Backend Docker:** O merchant-portal chama `POST ${REST}/rpc/create_checkout_session` com `price_id`, `success_url`, `cancel_url`. O Core deve expor este RPC e devolver a URL do Stripe Checkout.
- **Success URL:** O [BillingBroker](../merchant-portal/src/core/billing/BillingBroker.ts) usa `successUrl = window.location.origin + '/billing/success'`. Em produção deve ser `https://<teu-dominio>/billing/success`.
- **Webhook:** A Edge Function `stripe-billing-webhook` processa `checkout.session.completed`, `customer.subscription.*` e `invoice.*`. Em `checkout.session.completed` e quando a subscrição fica ativa, atualiza `gm_restaurants.billing_status` para `active`; em `customer.subscription.updated`/`deleted` sincroniza `billing_status` com `past_due` ou `canceled`.

Checklist:

- [ ] Core (ou serviço de billing) expõe `create_checkout_session` e devolve URL Stripe (ou usa Edge Function `stripe-billing`).
- [ ] Variáveis Stripe (secret key, price id) configuradas no backend que chama a API Stripe.
- [ ] Webhook Stripe configurado no dashboard para `https://<projeto>.supabase.co/functions/v1/stripe-billing-webhook`; secret em `STRIPE_BILLING_WEBHOOK_SECRET`; evento `checkout.session.completed` (e `customer.subscription.*`, `invoice.*`) processado — o handler já atualiza `gm_restaurants.billing_status`.

---

## 3. Rota `/billing/success`

- **App:** [App.tsx](../merchant-portal/src/App.tsx) define `<Route path="/billing/success" element={<BillingSuccessPage />} />`.
- **Página:** [BillingSuccessPage.tsx](../merchant-portal/src/pages/Billing/BillingSuccessPage.tsx) mostra "Assinatura ativa" e links para `/dashboard` e `/op/tpv`.

Checklist:

- [ ] Após pagamento no Stripe Checkout, o redirect vai para `https://<teu-dominio>/billing/success`.
- [ ] A página carrega sem 404 e os links funcionam.

---

## 4. Teste rápido (manual)

1. Abrir `https://<teu-dominio>/app/billing` (ou `/app` e navegar para billing).
2. Verificar que o preço aparece (ex. 79 €/mês) e o botão "Ativar agora" (ou equivalente) está ativo.
3. Clicar e completar o checkout Stripe (cartão de teste em live ou cartão real).
4. Confirmar redirect para `/billing/success` e mensagem "Assinatura ativa".
5. (Opcional) Verificar no Stripe Dashboard que a sessão/pagamento foi criado e que o webhook foi chamado; na BD, `gm_restaurants.billing_status` para o restaurante está `active` (se já tiveres webhook a atualizar).

---

## 5. Migração `billing_status`

- [ ] Migração que adiciona `billing_status` a `gm_restaurants` aplicada em produção (ex. [20260201180000_add_billing_status_to_gm_restaurants.sql](../supabase/migrations/) se existir no repo).

---

**Próximo:** Domínio (DNS, HTTPS, URL base) e depois [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md).
