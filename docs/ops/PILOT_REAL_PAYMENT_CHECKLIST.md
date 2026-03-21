# Checklist — Piloto Pagamento Real em Produção

**Propósito:** Validar pagamento com dinheiro real antes de abrir para clientes. Um restaurante piloto confirma que Stripe/SumUp funcionam end-to-end.

**Ref:** [STRATEGIC_DECISION_FRAMEWORK.md](../strategy/STRATEGIC_DECISION_FRAMEWORK.md), [PAYMENT_PROVIDERS_AND_MARKETS.md](../PAYMENT_PROVIDERS_AND_MARKETS.md)

---

## Pré-requisitos

- [ ] Core em produção (Docker/Postgres ou Supabase) acessível
- [ ] Integration-gateway em produção na porta 4320 (billing) ou configurado
- [ ] Stripe: conta ativa, `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` configurados
- [ ] SumUp (se EUR/Pix): `SUMUP_CLIENT_ID`, `SUMUP_CLIENT_SECRET`, webhook configurado
- [ ] Restaurante piloto identificado (nome, contacto, NIF se PT)

---

## Fase 1 — Billing (Assinatura)

| # | Verificação | Resultado |
|---|-------------|-----------|
| 1 | Gateway billing responde em `/internal/billing/*` ou equivalente | ☐ OK / ☐ Falha |
| 2 | Stripe Checkout abre ao clicar "Cambiar plan" / "Escolher plano" | ☐ OK / ☐ Falha |
| 3 | Webhook `checkout.session.completed` é recebido e processado | ☐ OK / ☐ Falha |
| 4 | Subscription criada no Core (`merchant_subscriptions` ou equivalente) | ☐ OK / ☐ Falha |
| 5 | UI mostra plano ativo após checkout | ☐ OK / ☐ Falha |

---

## Fase 2 — Pagamento TPV (Stripe/SumUp)

| # | Verificação | Resultado |
|---|-------------|-----------|
| 1 | TPV abre e lista métodos de pagamento configurados | ☐ OK / ☐ Falha |
| 2 | Pagamento cartão (Stripe Payment Intent) completa com sucesso | ☐ OK / ☐ Falha |
| 3 | Pagamento Pix (SumUp, se aplicável) completa com sucesso | ☐ OK / ☐ Falha |
| 4 | Pedido muda para `CLOSED` após pagamento | ☐ OK / ☐ Falha |
| 5 | `gm_payments` regista o pagamento com `status=paid` | ☐ OK / ☐ Falha |
| 6 | Webhook Stripe/SumUp é recebido e idempotente | ☐ OK / ☐ Falha |

---

## Fase 3 — Fechamento de Caixa

| # | Verificação | Resultado |
|---|-------------|-----------|
| 1 | Fechar caixa (`close_cash_register_atomic`) gera Z-report | ☐ OK / ☐ Falha |
| 2 | Z-report persiste em `gm_z_reports` | ☐ OK / ☐ Falha |
| 3 | Totais batem: `total_cents` = soma dos pedidos `CLOSED` | ☐ OK / ☐ Falha |
| 4 | Reconciliação: declarado vs esperado (cash) calculada | ☐ OK / ☐ Falha |

---

## Fase 4 — Observabilidade

| # | Verificação | Resultado |
|---|-------------|-----------|
| 1 | Sentry captura erros (se configurado) | ☐ OK / ☐ Falha |
| 2 | Logs estruturados para pagamentos e webhooks | ☐ OK / ☐ Falha |
| 3 | Dashboard Stripe mostra transações do restaurante piloto | ☐ OK / ☐ Falha |

---

## Critério GO/NO-GO

**GO:** Fases 1 e 2 completas sem falhas críticas. Fase 3 e 4 podem ter avisos documentados.

**NO-GO:** Qualquer falha em webhook, idempotência ou persistência de pagamento → corrigir antes de abrir para mais clientes.

---

## Pós-piloto

- [ ] Documentar incidentes e resoluções
- [ ] Atualizar [CONSOLIDATION_LOG_BLOCK1.md](../ops/CONSOLIDATION_LOG_BLOCK1.md) se aplicável
- [ ] Definir segundo restaurante piloto (opcional)
