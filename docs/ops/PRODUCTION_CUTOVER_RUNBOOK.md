# Runbook: Cutover Produção — Render → Supabase Edge (Fase 1)

**Objetivo:** 1 cloud (Supabase), 1 frontend (Vercel), 0 tráfego para Render.  
**Ref:** [GATEWAY_DEPRECATED.md](./GATEWAY_DEPRECATED.md), [MIGRATION_RENDER_TO_EDGE.md](./MIGRATION_RENDER_TO_EDGE.md), [ENV_MATRIX.md](./ENV_MATRIX.md).

---

## Pré-requisitos

- [ ] Edge Functions deployadas: `supabase functions deploy` (webhook-stripe, webhook-sumup, billing-create-checkout-session, internal-events, sumup-create-checkout, sumup-get-checkout, payment-pix-checkout).
- [ ] Secrets configurados no Supabase (Dashboard → Edge Functions → Secrets): ver [EDGE_ENV.md](./EDGE_ENV.md).
- [ ] Testes locais com `supabase functions serve` e frontend com `VITE_API_BASE=http://localhost:54321/functions/v1` (ou URL do projeto remoto) validados.

---

## Passos (ordem recomendada)

### 1. Vercel — Variáveis de produção

1. Abrir projeto na Vercel (merchant-portal / chefiapp-pos-core conforme config).
2. **Settings → Environment Variables**
3. Definir (ou alterar) para **Production** (e Preview se quiser igual):
   - `VITE_API_BASE` = `https://<PROJECT_REF>.supabase.co/functions/v1`  
     (substituir `<PROJECT_REF>` pelo ref do projeto Supabase, ex.: `abcdefghijklmnop`)
4. Garantir que as restantes variáveis de frontend estão preenchidas conforme [ENV_MATRIX.md](./ENV_MATRIX.md): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_INTERNAL_API_TOKEN`, etc.
5. **Save** e fazer **Redeploy** da última produção para aplicar as novas variáveis.

### 2. Webhooks Stripe

1. Stripe Dashboard → Developers → Webhooks.
2. Localizar o endpoint que aponta para o Render (ex.: `https://chefiapp-pos-core-xxxx.onrender.com/api/v1/webhook/stripe`).
3. **Update** ou criar novo endpoint:
   - URL: `https://<PROJECT_REF>.supabase.co/functions/v1/webhook-stripe`
   - Eventos: manter os mesmos (ex.: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`, etc.).
4. Guardar e anotar o **Signing secret** (se criou novo); actualizar no Supabase Edge Secrets como `STRIPE_WEBHOOK_SECRET` se necessário.

### 3. Webhooks SumUp

1. SumUp Dashboard (ou painel de integração) → Webhooks.
2. Alterar URL de:
   - `https://...onrender.com/api/v1/webhook/sumup`  
   para:
   - `https://<PROJECT_REF>.supabase.co/functions/v1/webhook-sumup`
3. Confirmar que o secret usado para HMAC está em Edge Secrets como `SUMUP_WEBHOOK_SECRET`.

### 4. Validação pós-cutover

- [ ] **Login:** Aceder ao portal em produção; login com conta real ou teste.
- [ ] **Billing:** Ir a "Mudar plano" / Assinatura (Admin → Plano → Assinatura); iniciar checkout Stripe; concluir ou cancelar; confirmar que não há erro de CORS ou 404 (deve chamar `billing-create-checkout-session`).
- [ ] **Webhooks:** No Stripe, enviar evento de teste para o novo endpoint; confirmar 200 e (opcional) que o evento aparece em `webhook_events` no Core.
- [ ] **Internal events:** Se a app envia eventos para `/internal/events`, verificar que `internal-events` responde (ex.: criar ordem e confirmar que o fluxo não falha).
- [ ] **Billing stress test (Fase 6):** Executar o checklist em [BILLING_STRESS_TEST_CHECKLIST.md](./BILLING_STRESS_TEST_CHECKLIST.md) (cenarios 1-5 + hardening 6-8) e registar resultado como evidencia pos-cutover.
- [ ] **Idempotencia webhook:** No Stripe Dashboard, "Send test webhook" com o mesmo evento 2x para o novo endpoint. Confirmar: (1) ambos retornam 200; (2) `webhook_events` tem apenas 1 registo para esse `event_id`; (3) `billing_status` nao muda na 2a chamada.
- [ ] **Latencia webhook:** No Stripe Dashboard (Developers → Webhooks → endpoint → Recent deliveries), confirmar que o tempo de resposta medio e < 2s. Se > 5s, investigar cold start da Edge Function.
- [ ] **Rollback testado:** Temporariamente alterar `STRIPE_WEBHOOK_SECRET` no Supabase Edge Secrets para um valor errado; enviar evento de teste; confirmar 400 (signature failed). Repor o secret correcto; enviar novo evento; confirmar 200 e processamento normal. Documentar resultado.

### 5. Desactivar Render

- [ ] Após 24–48 h sem incidentes, no Render: **Settings** do serviço backend → **Suspend** ou apagar o serviço.
- [ ] Opcional: manter o código em `server/integration-gateway.ts` no repo para referência; não voltar a fazer deploy.

---

## Rollback (se algo falhar)

1. **Vercel:** Reverter `VITE_API_BASE` para a URL do Render (ex.: `https://chefiapp-pos-core-xxxx.onrender.com`); Redeploy.
2. **Stripe / SumUp:** Repor a URL do webhook para o endpoint Render.
3. **Render:** Garantir que o serviço está activo e a receber pedidos.

Ver secção 5 de [MIGRATION_RENDER_TO_EDGE.md](./MIGRATION_RENDER_TO_EDGE.md).

---

## Critério de conclusão (Fase 1)

- [ ] 1 cloud (Supabase); 1 frontend (Vercel).
- [ ] 0 tráfego de produção para Render.
- [ ] Build produção sem erros; smoke test (login, ordem, billing) passou.
