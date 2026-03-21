# Commercial Metrics Contract

**Propósito:** Definição canónica das métricas comerciais. Sem dashboards; apenas contrato.

---

## 1. Métricas

| Métrica | Definição | Unidade | Fonte |
|---------|-----------|---------|-------|
| **Trial Start Rate** | Novos trials iniciados / visitantes únicos da landing (ou formulário de signup) | % | `onTrialStarted` + analytics |
| **Trial → Paid Conversion** | Assinaturas pagas / trials iniciados (coorte) | % | `onConversion` + trial cohort |
| **MRR** | Monthly Recurring Revenue. Soma mensal de receitas recorrentes ativas | EUR / USD / BRL | Stripe + billing_plan_prices |
| **Churn Rate** | Assinaturas canceladas / base ativa no período | % | `customer.subscription.deleted` |
| **Payment Failure Rate** | Faturas com payment_failed / total de faturas | % | `invoice.payment_failed` |
| **Average Revenue Per Location** | MRR / número de locais (restaurantes) ativos | EUR/mês | MRR / count(restaurants) |

---

## 2. Eventos de entrada

| Evento | Origem | Métricas afectadas |
|--------|--------|--------------------|
| `trial_started` | activationHooks | Trial Start Rate |
| `trial_expired` | activationHooks | Trial → Paid (coorte) |
| `payment_failed` | activationHooks, Stripe webhook | Payment Failure Rate |
| `conversion` | activationHooks | Trial → Paid, MRR |
| `subscription.deleted` | Stripe webhook | Churn Rate |

---

## 3. Períodos

- **Trial Start Rate:** rolling 30 dias
- **Trial → Paid Conversion:** coorte por mês de trial start
- **MRR:** fim do mês
- **Churn Rate:** rolling 30 dias ou mensal
- **Payment Failure Rate:** rolling 30 dias
- **ARPL:** fim do mês

---

## 4. Referências

- `merchant-portal/src/core/commercial/activationHooks.ts`
- `merchant-portal/src/core/billing/trialEngine.ts`
- `docker-core/server/webhooks/stripeBillingSync.ts`
