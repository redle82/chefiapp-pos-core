# Billing Freeze — Fase fechada (checklist final)

**Objetivo:** Confirmar que a fase "Internacionalização & Billing Freeze" está fechada antes de considerar o sistema billing estável e operacionalmente elegante.

**Ref:** Plano em 3 sprints (Sprint 1 Pagamentos, Sprint 2 UI i18n, Sprint 3 Stress e Ops).

---

## Critérios de fecho

- [ ] **Metadata obrigatória:** `POST /internal/billing/create-checkout-session` exige `restaurant_id` (UUID) no body; Stripe session criada com `subscription_data.metadata.restaurant_id` e `metadata.restaurant_id`.
- [ ] **PIX e SumUp:** Documentação de hardening aplicada ([PIX_BILLING_BRL_AND_REFUNDS.md](../PIX_BILLING_BRL_AND_REFUNDS.md), [SUMUP_WEBHOOK_EUR_PIX_AND_RETRY.md](../SUMUP_WEBHOOK_EUR_PIX_AND_RETRY.md)); fluxos validados quando credenciais disponíveis.
- [ ] **E2E checkout + webhook:** Script `./scripts/e2e-billing-three-currencies.sh` passa (com `restaurant_id`). Runbook [E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md](./E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md) executado; opcional: webhook de teste e verificação no DB.
- [ ] **Cross-currency guard:** Comportamento documentado e, quando aplicável, testado (evento com moeda diferente não actualiza estado; billing_incidents com reason currency_mismatch).
- [ ] **i18n:** Sem fallbacks críticos em fluxos de billing/TPV; strings de billing e facturação (ex.: InvoicesTable) em namespaces (billing/common). Contrato em [UI_CURRENCY_AND_DATES_CONTRACT.md](../UI_CURRENCY_AND_DATES_CONTRACT.md).
- [ ] **Runbook e incidentes:** [RUNBOOKS.md](./RUNBOOKS.md) inclui secção Billing (§6.1). Em incidentes de billing, consultar `billing_incidents` (Core) quando a migração 20260327 estiver aplicada.
- [ ] **Checklist de fluxos reais:** [BILLING_FLOWS_MANUAL_CHECKLIST.md](./BILLING_FLOWS_MANUAL_CHECKLIST.md) executado (ou assinado como "a executar antes de go-live"). Roteiro passo a passo: [BILLING_VALIDATION_RUNBOOK.md](./BILLING_VALIDATION_RUNBOOK.md).
- [ ] **Migrations:** Nenhuma migração de billing pendente no Core; ordem documentada em [docker-core/MIGRATIONS.md](../../docker-core/MIGRATIONS.md) se necessário.
- [ ] **TODOs billing:** Nenhum TODO/FIXME em aberto em `merchant-portal/src/core/billing` nem em funções de billing do server (ou convertidos em issue rastreável e referenciados aqui).

---

## Assinatura (opcional)

| Data       | Responsável | Notas |
| ---------- | ----------- | ----- |
| ___________ | ___________ | ______ |

---

## Referências

- [BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md](../BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md)
- [ENDPOINT_RISK_AUDIT.md](../audit/ENDPOINT_RISK_AUDIT.md) (create-checkout-session, webhooks)
- [docker-core/MIGRATIONS.md](../../docker-core/MIGRATIONS.md)
