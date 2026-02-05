# Contrato: Caixa e Pagamentos (FASE 2.3)

**Propósito:** Definir a caixa como contexto financeiro activo, os estados de pagamento do pedido (sem gateways externos), o fluxo TPV (confirmar → marcar pagamento), o ritual de fecho de caixa (total esperado vs declarado, diferença, observação) e o papel do Dashboard (só leitura). Fonte de verdade para a Fase 2.3.

**Referências:** [FASE_2_PLANO_COMPLETO.md](../plans/FASE_2_PLANO_COMPLETO.md), [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](../architecture/CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md), [CONTRATO_DO_TURNO.md](CONTRATO_DO_TURNO.md), [FLUXO_DE_PEDIDO_OPERACIONAL.md](FLUXO_DE_PEDIDO_OPERACIONAL.md).

**Regra de ouro:** Nenhum dinheiro entra ou sai sem rasto, sem fecho, sem explicação.

---

## 1. Caixa como entidade explícita

A **caixa** é o contexto financeiro activo do turno. Uma caixa aberta existe por restaurante (uma única caixa aberta por vez). O Core expõe este estado em `gm_cash_registers` (status `open` / `closed`).

**Regra contratual (inviolável):**

> Pedido CONFIRMADO só é permitido se existir **turno + caixa aberta**.

- Sem caixa aberta, o TPV não pode confirmar pedidos nem processar pagamentos. O Core já garante isto: `process_order_payment` exige que o `cash_register_id` corresponda a uma caixa com status `open`.
- Turno e caixa estão ligados: abrir turno abre a caixa (ex.: `open_cash_register_atomic`); fechar caixa encerra o turno para esse contexto financeiro.

---

## 2. Pagamento como estado do pedido (não gateway)

Na FASE 2.3 **não existem** integrações reais de pagamento (Stripe, SumUp, etc.). O pagamento é apenas **estado do pedido** e registo no Core.

**Estados mínimos (contrato FASE 2.3):**

| Estado (contrato) | Descrição | Mapeamento Core |
|-------------------|-----------|-----------------|
| **UNPAID**        | Pedido não pago ou pendente | `gm_orders.payment_status` = `PENDING` |
| **PAID_CASH**     | Pago em dinheiro | `gm_orders.payment_status` = `PAID`; `gm_payments.payment_method` = `cash` |
| **PAID_CARD**     | Pago por cartão (simulado) | `gm_orders.payment_status` = `PAID`; `gm_payments.payment_method` = `card` |
| **PAID_OTHER**    | Outro método (ex.: vale, transferência) | `gm_orders.payment_status` = `PAID`; `gm_payments.payment_method` = `other` |

- O Core pode manter `PARTIALLY_PAID` para pagamentos parciais; o contrato de produto usa UNPAID até estar totalmente pago.
- `gm_payments.payment_method` (ou parâmetro equivalente do RPC) aceita pelo menos: `cash`, `card`, `other`.

---

## 3. Fluxo TPV — pagamento consciente

O TPV faz, nesta ordem:

1. **Criar pedido** (rascunho).
2. **Confirmar** (pedido vai para o Core com estado operacional; ex.: OPEN; associado a `cash_register_id`).
3. **Marcar pagamento** — dinheiro, cartão (simulado) ou outro.
4. O pedido entra no KDS já **pago** ou **pendente**, conforme o estado de pagamento.

**KDS não toca em pagamento. Nunca.** O KDS apenas altera estados de cozinha (EM_PREPARO, PRONTO, etc.). Criação e pagamento são exclusivos do TPV.

---

## 4. Fecho de caixa (ritual obrigatório)

No fecho de caixa:

- **Total esperado (por método):** Derivado do Core a partir de `gm_payments` para a caixa em questão (soma de `amount_cents` por `payment_method` no âmbito do `cash_register_id`). Valor readonly na UI de fecho.
- **Total declarado:** Input humano — o que o operador declara ter em caixa (ex.: contagem física).
- **Diferença:** `total declarado − total esperado` (ou conforme definição de negócio; o importante é que fique visível e auditável).
- **Observação obrigatória:** Se a diferença for diferente de zero, o sistema exige uma observação (texto) antes de concluir o fecho. Sem observação, o fecho não pode ser finalizado quando há discrepância.

**Output do fecho:**

- Snapshot financeiro ligado ao turno: ex. `gm_cash_registers.closing_balance_cents`, `closed_at`, `closed_by`, e quando existir implementação, campo ou tabela de “declaração”/notas (ex.: motivo da diferença). Tudo auditável e imutável após fecho.

---

## 5. Dashboard — leitura, não magia

O Dashboard:

- **Mostra:** vendas por método, caixa aberta/fechada, discrepâncias (quando existirem, ex.: total esperado vs declarado no último fecho).
- **Não corrige,** **não edita,** **não “fecha por trás”.** Qualquer acção de fechar caixa é feita no TPV (ou fluxo autorizado equivalente). O Dashboard apenas exibe e, se aplicável, pode ter link para “Abrir TPV” / “Fechar no TPV”, nunca botão que feche a caixa directamente com valores editáveis pelo Dashboard.

---

## 6. O que NÃO entra na FASE 2.3

- Integração real de pagamentos (gateways externos).
- Split bill (divisão de conta).
- Reembolsos.
- Fiscalidade.
- Relatórios avançados.

Tudo isso fica para fases posteriores (ex.: FASE 3).

---

## 7. Resumo das regras

| Área | Regra |
|------|--------|
| Caixa | Uma caixa aberta por restaurante; sem caixa aberta não há venda (confirmar/pagar). |
| Pedido | CONFIRMADO só com turno + caixa aberta. |
| Pagamento | Estado do pedido (UNPAID, PAID_CASH, PAID_CARD, PAID_OTHER); sem gateway externo. |
| TPV | Criar → Confirmar → Marcar pagamento (cash/card simulado/other). |
| KDS | Nunca toca em pagamento. |
| Fecho | Total esperado (Core), total declarado (humano), diferença, observação obrigatória se ≠ 0. |
| Dashboard | Só leitura; vendas por método, caixa aberta/fechada, discrepâncias; não fecha nem edita. |

---

Última atualização: Contrato Caixa e Pagamentos; Fase 2.3.
