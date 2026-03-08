# Posicionamento Jurídico e Técnico — Pagamentos ChefIApp

**Referência para produto, jurídico e equipa.** Este documento define o que o ChefIApp é e não é no modelo de pagamentos, e que exigências regulatórias evita.

---

## 1. O que o ChefIApp é

O ChefIApp é:

- **Sistema de gestão operacional** — controlo de turnos, equipa, stock, pedidos.
- **Sistema de pedidos** — registo de pedidos (mesa, balcão, takeaway) e estado (aberto, pago, cancelado).
- **Interface de controlo interno** — TPV, KDS, painel de operação.
- **Orquestrador de pagamento via gateways externos** — integra com Stripe, SumUp e PIX; não processa nem guarda dados de cartão; cria intenções/checkouts na conta do restaurante e atualiza estado via webhooks.
- **Painel de dados** — relatórios internos, métricas operacionais.

---

## 2. O que o ChefIApp não é

O ChefIApp **nunca** se posiciona como:

- Sistema fiscal certificado.
- Caixa registadora homologada.
- Banco ou instituição de pagamento.
- Adquirente ou processador de cartão próprio.
- Emissor de documento fiscal oficial (nota, factura, ticket fiscal) — salvo evolução futura explicitamente homologada.

---

## 3. Modelo de pagamento

- O **restaurante** insere e detém a sua própria chave Stripe ou SumUp (e, quando aplicável, credenciais PIX).
- O fluxo de dinheiro é: **Cliente final → Gateway (Stripe/SumUp/PIX) → Conta do restaurante.**
- A **plataforma** não recebe nem repassa dinheiro das transações do restaurante. Apenas:
  - Armazena credenciais criptografadas (por restaurante).
  - Cria intenções de pagamento ou checkouts na **conta do restaurante**.
  - Atualiza o estado do pedido (pago/pendente) após validação de webhooks do gateway.

Ou seja: a plataforma é **infraestrutura e orquestração**; o gateway e o restaurante são os responsáveis pelo fluxo de fundos.

---

## 4. Certificação e exigências regulatórias

No modelo descrito:

- **Não é necessária certificação PCI própria** — o gateway (Stripe, SumUp) assume PCI-DSS, 3DS, antifraude e chargeback. A plataforma não armazena nem processa dados de cartão.
- **Não é necessária licença financeira** — a plataforma não intermedia fundos; não actua como instituição de pagamento.
- **Não é necessária autorização bancária** — não há aquisição nem processamento próprio de cartão.

O gateway externo assume a responsabilidade regulatória do processamento de pagamento.

---

## 5. Obrigação fiscal

Se o ChefIApp:

- Apenas regista pedidos,
- Mostra relatórios internos,
- Controla equipa e operação,
- Gera dados operacionais,

e o **documento fiscal oficial** (nota, factura, ticket fiscal) é emitido por outro sistema contabilístico ou pelo próprio SumUp (ou equivalente),

então **não é necessária certificação fiscal própria** para o ChefIApp neste modelo.

Se no futuro a plataforma passar a emitir documento fiscal oficial directamente, entrará a legislação fiscal do país e eventuais homologações — fora do âmbito do modelo actual.

---

## 6. Regra de ouro: separação de fluxos

**Nunca misturar:**

| Fluxo | Quem paga | Conta | Onde ocorre |
|-------|-----------|--------|--------------|
| **Pagamento SaaS** | Restaurante → ChefIApp | Conta Goldmonkey (plataforma) | `/app/billing`, Stripe Checkout/Portal, variáveis de ambiente da plataforma (`STRIPE_SECRET_KEY` para assinatura). |
| **Pagamento transação** | Cliente do restaurante → Restaurante | Conta do restaurante | TPV, integration-gateway, credenciais por `restaurant_id` em `gm_integration_credentials`. |

- O **billing SaaS** (subscrição ChefIApp) usa **apenas** chaves e rotas da plataforma; nunca credenciais guardadas por restaurante.
- O **pagamento de transação** (cliente final) usa **apenas** credenciais do restaurante (Stripe/SumUp/PIX), nunca a chave de billing da plataforma.

Esta separação está documentada em [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](../architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md) e em [PAYMENT_CREDENTIALS_AND_WEBHOOKS.md](../security/PAYMENT_CREDENTIALS_AND_WEBHOOKS.md).

---

## 7. Posicionamento em comunicação

Recomendado posicionar o ChefIApp como:

- **"Sistema operacional de restaurante com integração de pagamento via parceiros certificados."**

Evitar afirmações do tipo:

- "TPV fiscal oficial" ou "emissor de factura".
- "Substitui software contabilístico."
- "Processador de pagamentos" ou "instituição de pagamento."

---

## 8. Referências

- [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](../architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md) — Contrato Core: billing SaaS vs billing restaurante.
- [PAYMENT_LAYER.md](../architecture/PAYMENT_LAYER.md) — Arquitetura do módulo de pagamento (providers plugáveis).
- [PAYMENT_CREDENTIALS_AND_WEBHOOKS.md](../security/PAYMENT_CREDENTIALS_AND_WEBHOOKS.md) — Segurança de credenciais e webhooks.
