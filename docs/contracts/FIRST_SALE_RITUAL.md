# Contrato Primeira Venda (Ritual) — Passo 4 do Onboarding

**Propósito:** Passo 4 do wizard. O momento em que o restaurante faz a primeira venda no sistema: abrir TPV, criar pedido, marcar como pago. Ritual explícito que marca a transição para "operacional".

**Ref:** [FUNIL_VIDA_CLIENTE.md](FUNIL_VIDA_CLIENTE.md), [FLUXO_DE_PEDIDO_OPERACIONAL.md](FLUXO_DE_PEDIDO_OPERACIONAL.md), [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](CASH_REGISTER_AND_PAYMENTS_CONTRACT.md), [CONTRATO_DO_TURNO.md](CONTRATO_DO_TURNO.md).

---

## Estado antes

- Restaurant criado, menu mínimo válido, modo de operação escolhido.
- Ainda não houve primeira venda no sistema.

---

## Ritual (passos guiados)

1. **Abrir TPV** (acesso ao ponto de venda).
2. **Abrir turno** (caixa) se aplicável — conforme CONTRATO_DO_TURNO e CASH_REGISTER.
3. **Criar pedido** — pelo menos um item do menu mínimo.
4. **Marcar como pago** — fechar o pedido com estado de pagamento pago.

O sistema pode guiar explicitamente estes passos (ex.: "Abrir turno" → "Adicionar produto" → "Confirmar e marcar pago").

---

## Estado após

- **Trial:** ativo.
- **Restaurant:** operacional (primeira venda feita).
- Transição para vida normal do trial (Dashboard operacional).

---

## Regra

Este é o "momento sagrado" do onboarding: primeira venda feita no ChefIApp. A partir daqui aplicam-se os contratos operacionais (fluxo de pedido, caixa, turno).

---

## Próximo contrato

[TRIAL_OPERATION_CONTRACT.md](TRIAL_OPERATION_CONTRACT.md) — Vida do trial: dashboard, sem bloqueios, avisos de dias restantes.
