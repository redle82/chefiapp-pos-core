# BILLING_AND_PLAN_CONTRACT — Planos SaaS e conversão Trial → Pago

**Propósito:** Contrato de negócio para planos SaaS (ChefIApp → restaurante), assinatura, trial countdown e conversão para pago. Separação clara entre (1) cobrança SaaS e (2) cobrança ao cliente final no TPV.

**Ref:** [TRIAL_TO_PAID_CONTRACT.md](TRIAL_TO_PAID_CONTRACT.md), [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](CASH_REGISTER_AND_PAYMENTS_CONTRACT.md). Arquitectura: [BILLING_FLOW.md](../architecture/BILLING_FLOW.md), [BILLING_SUSPENSION_CONTRACT.md](../architecture/BILLING_SUSPENSION_CONTRACT.md).

---

## Âmbito

- **Planos SaaS:** oferta, preços, trial 14 dias, renovação.
- **Conversão:** fim do trial → escolher plano ou encerrar (modo leitura / exportar).
- **Estados:** trial | active | past_due | suspended (ver BILLING_SUSPENSION_CONTRACT).
- **UI:** rota `/app/billing`, Stripe Checkout/Portal; gates operacionais quando past_due/suspended.

Core nunca processa pagamento; Stripe como provedor. Billing persistido no Core (Postgres); UI consome Core RPCs (coreBillingApi).

---

## Fluxo UI (o que acontece ao clicar em "Escolher plano")

1. **Rota:** `/app/billing` — [BillingPage](merchant-portal/src/pages/Billing/BillingPage.tsx). Acesso protegido (RoleGate, RequireOnboarding); PaymentGuard inclui `/app/billing` no Safe Harbor.
2. **Estado:** BillingPage usa `useSubscription` e exibe estado (trial, active, past_due, suspended). CTAs: "Escolher plano" (Stripe Checkout) e "Gerir assinatura" (Stripe Customer Portal) quando já existe cliente.
3. **Escolher plano:** Clicar em "Escolher plano" chama `BillingBroker.startSubscription(priceId)`; redireciona para Stripe Checkout. Após pagamento, Stripe redireciona para `/billing/success` (BillingSuccessPage).
4. **Callback:** `/billing/success` — confirmação visual; webhook Stripe (`stripe-billing-webhook`) actualiza `gm_restaurants.billing_status` no Core; a UI reflecte trial/active/past_due/suspended via Runtime e GlobalUIState.
5. **Gate operacional:** [RequireOperational](merchant-portal/src/components/operational/RequireOperational.tsx) aplica BILLING_SUSPENSION_CONTRACT: quando `billing_status` é `past_due` ou `suspended`/`canceled`, bloqueia TPV/KDS e mostra BlockingScreen com "Assinatura em atraso" ou "Assinatura suspensa" e CTA "Ir para Faturação" → `/app/billing`.

---

## Contratos relacionados

| Documento | Descrição |
|-----------|-----------|
| [TRIAL_TO_PAID_CONTRACT.md](TRIAL_TO_PAID_CONTRACT.md) | Fim do trial: escolher plano, modo leitura, exportar |
| [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](CASH_REGISTER_AND_PAYMENTS_CONTRACT.md) | Caixa e pagamentos no TPV (cliente final) |
| [BILLING_FLOW.md](../architecture/BILLING_FLOW.md) | Fluxo completo de billing (schema, migrações, Stripe) |
| [BILLING_SUSPENSION_CONTRACT.md](../architecture/BILLING_SUSPENSION_CONTRACT.md) | Estados e bloqueio de operação (past_due/suspended) |
