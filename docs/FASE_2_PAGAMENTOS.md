# Fase 2 — Pagamentos (dinheiro preparado)

**Objetivo:** Validar e preparar os meios de pagamento por região antes do primeiro cliente pagante.  
**Ref:** [PLANO_FINAL_PRIMEIRO_E79.md](PLANO_FINAL_PRIMEIRO_E79.md) Fase 2 · [PAYMENT_ROUTING_STRATEGY.md](PAYMENT_ROUTING_STRATEGY.md)

**Checklist único para ativar os três (Stripe + SumUp EUR + PIX):** [ATIVAR_TUDO_PAGAMENTOS.md](ATIVAR_TUDO_PAGAMENTOS.md)

---

## Visão por região

| Região        | Método principal | Provider | Doc de validação / guia |
|---------------|------------------|----------|---------------------------|
| **Europa**    | Cartão (EUR)     | **SumUp** | [SUMUP_EUR_INTEGRATION_GUIDE.md](SUMUP_EUR_INTEGRATION_GUIDE.md) |
| **Brasil**    | **PIX** (BRL)    | SumUp PIX | [PIX_ACTIVATION_PLAN.md](PIX_ACTIVATION_PLAN.md) · [PIX_UI_INTEGRATION_COMPLETE.md](PIX_UI_INTEGRATION_COMPLETE.md) |
| **Resto do mundo** | Cartão       | **Stripe** | [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md) |

---

## 1. Stripe (resto do mundo / assinatura SaaS)

- **Doc:** [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md)
- **Resumo:** Criar produto no Stripe Dashboard (ex.: ChefIApp Plano Mensal, €79/mês), copiar Price ID, definir `VITE_STRIPE_PRICE_ID` no env. Validar em `/app/billing`: preço visível, botão "Ativar agora" ativo. Configurar webhook quando for cobrar.

---

## 2. SumUp — Europa (cartão EUR)

- **Doc:** [SUMUP_EUR_INTEGRATION_GUIDE.md](SUMUP_EUR_INTEGRATION_GUIDE.md)
- **Resumo:** Conta SumUp Europa (ex.: ES/EUR), `SUMUP_ACCESS_TOKEN` no env. Integration-gateway em 4320: checkout SumUp, webhook para confirmar pagamento. Validar criação de checkout e callback no Core (gm_payments).

---

## 3. PIX — Brasil (BRL)

- **Docs:** [PIX_ACTIVATION_PLAN.md](PIX_ACTIVATION_PLAN.md) · [PIX_UI_INTEGRATION_COMPLETE.md](PIX_UI_INTEGRATION_COMPLETE.md)
- **Resumo:** SumUp PIX (Brasil): checkout PIX, QR Code no PaymentModal, polling de estado. Fase 1–2 (testes + UI) concluídas; Fase 3 E2E depende de credenciais sandbox SumUp Brasil. Validar fluxo PIX na UI e, quando tiver sandbox, E2E.

---

## Ordem sugerida (Fase 2)

1. **Stripe** — Price ID + env + `/app/billing` (obrigatório para plano SaaS em qualquer região).
2. **SumUp Europa** — Se fores cobrar em EUR (ES, PT, etc.): token, gateway, webhook.
3. **PIX Brasil** — Se fores cobrar em BRL: credenciais SumUp BR, validar UI PIX e depois E2E com sandbox.

---

## Critério de fecho Fase 2

- [ ] Stripe: preço configurado, billing page mostra "Ativar agora" e sucesso em `/billing/success` após checkout.
- [ ] (Se Europa) SumUp EUR: checkout criado, webhook recebido, pagamento registado no Core.
- [ ] (Se Brasil) PIX: UI PIX validada; E2E quando sandbox disponível.

**Próximo:** Fase 3 — [VALIDACAO_DOMINIO_PRODUCAO.md](VALIDACAO_DOMINIO_PRODUCAO.md) (domínio + produção).
