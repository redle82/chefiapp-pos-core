# Checklist: Billing Stress Test (Stripe real)

**Objetivo:** Validar ciclo completo de subscription e PaymentGuard com eventos Stripe reais (ou teste).  
**Ref:** Plano Fase 6 — Cutover Real + Billing Stress Test; [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](../architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md) § 9.

---

## Pré-requisitos

- Cutover executado: `VITE_API_BASE` aponta para Edge; webhooks Stripe/SumUp apontam para Edge.
- Conta de teste Stripe; `restaurant_id` de teste com `metadata.restaurant_id` no checkout ou customer ligado em `merchant_subscriptions`.

---

## Cenários

| # | Cenário | Resultado esperado | Executado em | Pass / Fail | Notas |
|---|---------|--------------------|--------------|-------------|-------|
| 1 | Trial → Active | `billing_status` = active; PaymentGuard deixa passar. | | | |
| 2 | Active → Past_due | `billing_status` = past_due; UI dunning (banner + CTA billing); TPV/operação com aviso ou bloqueio. | | | |
| 3 | Past_due → Active | `billing_status` = active; bloqueio/dunning desaparece. | | | |
| 4 | Cancelado | `billing_status` = canceled; PaymentGuard GlobalBlockedView exceto /app/billing, /app/console, /app/setup. | | | |
| 5 | Reativar | `billing_status` = trial/active; acesso operacional restaurado. | | | |

### Cenários de hardening (caos Stripe)

| # | Cenário | Resultado esperado | Executado em | Pass / Fail | Notas |
|---|---------|--------------------|--------------|-------------|-------|
| 6 | Evento duplicado | Enviar mesmo evento Stripe 2x (Send test webhook). `webhook_events` tem apenas 1 registo; `billing_status` nao muda na 2a vez. | | | |
| 7 | Alternancia rapida | Active → Past_due → Active → Past_due → Active (5 transicoes consecutivas). PaymentGuard reage correctamente em cada estado; estado final = active. | | | |
| 8 | Webhook fora de ordem | Receber `invoice.paid` (event.created=T2) e depois `invoice.payment_failed` (event.created=T1, anterior). Estado deve permanecer `active` (evento mais recente vence via `last_billing_event_at`). | | | |

---

## Verificacao de consistencia DB

Apos cada cenario, confirmar:

- [ ] `gm_restaurants.billing_status` bate com o estado esperado.
- [ ] `merchant_subscriptions.status` e consistente com `gm_restaurants.billing_status` (mapeamento Stripe → Core).
- [ ] `gm_restaurants.trial_ends_at` consistente (nao NULL se trial, nao alterado indevidamente).
- [ ] `merchant_subscriptions.stripe_subscription_id` bate com o subscription ID no Stripe Dashboard.
- [ ] `gm_restaurants.last_billing_event_at` avanca monotonicamente (nunca recua).

---

## Definition of Done (Fase 6 — Billing real)

- [ ] Cenarios 1, 2, 4 e 5 executados com Stripe (teste ou real).
- [ ] Cenarios 6, 7 e 8 (hardening) executados; resultados documentados.
- [ ] Verificacao de consistencia DB feita apos cada cenario.
- [ ] Resultado verificado em UI (PaymentGuard, Billing page) e em `gm_restaurants.billing_status` no Core.
- [ ] Esta tabela preenchida com datas e Pass/Fail para evidencia antes de 25/03.

---

## Registo de execução (Bloco 1)

- **Registo consolidado:** [CONSOLIDATION_LOG_BLOCK1.md](./CONSOLIDATION_LOG_BLOCK1.md) — secção 1.2.
- **Data em que este checklist foi preenchido:** —
- **Responsável:** —

## Scripts de validação

Antes de executar os cenários manualmente, validar infra e APIs:

1. **Validação unificada (gateway + billing + PIX + SumUp):**
   ```bash
   ./scripts/run-billing-pix-sumup-validation.sh
   ```
   Requer: gateway em `http://localhost:4320` (ou `GATEWAY_URL`). Verifica health, create-checkout-session, PIX checkout, SumUp checkout e opcionalmente portal em 5175.

2. **PIX E2E (só checkout + status):**
   ```bash
   ./scripts/pix-e2e-curl.sh
   ```
   Requer: gateway a correr; `INTERNAL_API_TOKEN` (default `chefiapp-internal-token-dev`). Cria um checkout PIX e consulta o estado.

3. **Runbook cenários 1–4 (manual):** [BILLING_STRESS_TEST_RUNBOOK_SCENARIOS_1-4.md](BILLING_STRESS_TEST_RUNBOOK_SCENARIOS_1-4.md) — passos concretos para Trial→Active, Past_due, Active, Cancelado e verificações DB.

   **Lista rápida de comandos:** `./scripts/run-billing-scenarios-1-4.sh` (imprime passos e queries). Com `--validate` executa primeiro a validação unificada.

4. **SumUp infra (gateway + portal + DB):**
   ```bash
   ./scripts/test-sumup-e2e.sh
   ```
   Ver [BILLING_PIX_SUMUP_INDEX.md](../BILLING_PIX_SUMUP_INDEX.md) para índice completo Billing / PIX / SumUp.

---

## Referências

- [PaymentGuard.tsx](../../merchant-portal/src/core/billing/PaymentGuard.tsx) — regras de bloqueio e Safe Harbor.
- [coreBillingApi.ts](../../merchant-portal/src/core/billing/coreBillingApi.ts) — `getBillingStatusWithTrial` (le `gm_restaurants`).
- [webhook-stripe/index.ts](../../supabase/functions/webhook-stripe/index.ts) — chama `sync_stripe_subscription_from_event` com `event.created` como timestamp guard.
- [20260223_stripe_sync_timestamp_guard.sql](../../docker-core/schema/migrations/20260223_stripe_sync_timestamp_guard.sql) — migracao que protege contra eventos fora de ordem.
