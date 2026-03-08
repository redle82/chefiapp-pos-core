# Billing — Checklist de fluxos reais (validação manual)

**Objetivo:** Antes de fechar a fase "Billing Freeze", executar manualmente os fluxos abaixo e verificar o estado no DB. Cada passo indica o que verificar em `gm_restaurants`, `merchant_subscriptions`, `webhook_events` e, quando aplicável, `billing_incidents`.

## Pré-requisitos

- Core a correr; migrações de billing aplicadas.
- Gateway a correr com Stripe (test) e, opcionalmente, SumUp/PIX.
- Acesso ao DB (Core) para consultas.

## 1. Criar restaurantes por mercado

- [ ] **Brasil:** Criar restaurante com `country`/`currency` = BR/BRL. Verificar que `getRestaurantBillingCurrency` devolve BRL e que a UI de planos mostra preços em BRL.
- [ ] **EUA:** Criar restaurante com country/currency = US/USD. Verificar preços em USD.
- [ ] **Europa:** Criar restaurante com country/currency = PT ou DE ou FR, moeda EUR. Verificar preços em EUR.

## 2. Upgrade / downgrade

- [ ] Com um restaurante com plano Starter (ou trial), iniciar checkout para plano Pro. Concluir pagamento. Verificar: `merchant_subscriptions.plan_id` = pro, `gm_restaurants.billing_status` = active (ou trial).
- [ ] (Se suportado) Alterar de Pro para Starter via portal ou novo checkout. Verificar que o estado reflete o novo plano.

## 3. Cancelamento e re-subscribe

- Seguir [BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md](./BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md).
- [ ] Após cancelar, verificar `billing_status` e `merchant_subscriptions.status` = canceled.
- [ ] Após novo checkout, verificar `billing_status` = active e nova subscription.

## 4. Falha de pagamento

- [ ] No Stripe (test), simular falha de pagamento (ex.: cartão recusado). O webhook `invoice.payment_failed` deve ser recebido. Verificar: `gm_restaurants.billing_status` = past_due (conforme lógica do Core).

## 5. Renovação automática

- [ ] (Test mode) Avançar o relógio ou usar evento de teste Stripe para simular renovação. Verificar que o estado permanece active e que não há incidente desnecessário.

## 6. Trial → pago

- [ ] Restaurante em trial: quando o trial termina (ou simular evento), verificar que o estado passa a past_due ou que o utilizador é direccionado para checkout. Concluir checkout e verificar active.

## O que verificar no DB (resumo)

| Tabela / coluna              | Consulta típica |
|-----------------------------|------------------|
| gm_restaurants              | `SELECT id, billing_status, trial_ends_at, last_billing_event_at FROM gm_restaurants WHERE id = ?` |
| merchant_subscriptions      | `SELECT restaurant_id, plan_id, status, stripe_subscription_id, canceled_at FROM merchant_subscriptions WHERE restaurant_id = ?` |
| webhook_events              | `SELECT id, provider, event_type, event_id, created_at FROM webhook_events ORDER BY created_at DESC LIMIT 20` |
| billing_incidents           | `SELECT * FROM billing_incidents WHERE restaurant_id = ? ORDER BY created_at DESC` (quando a migração 20260327 está aplicada) |

## Referências

- [BILLING_VALIDATION_RUNBOOK.md](./BILLING_VALIDATION_RUNBOOK.md) — roteiro operacional passo a passo (pré-requisitos, SQL antes/depois, simulação de falha).
- [BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md](./BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md)
- [E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md](./E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md)
- [BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md](../BILLING_MULTICURRENCY_GO_LIVE_CHECKLIST.md)
