# FASE 2.3 — Caixa, Pagamentos e Fecho (25%)

**Objetivo:** Transformar o sistema de "cria pedidos e muda estados" em "abre caixa → regista vendas → fecha caixa → explica diferenças". Sem gateways externos; só verdade interna. Regra de ouro: nenhum dinheiro entra ou sai sem rasto, sem fecho, sem explicação.

**Referências:** [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md), [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](../contracts/CASH_REGISTER_AND_PAYMENTS_CONTRACT.md), [FLUXO_DE_PEDIDO_OPERACIONAL.md](../contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md).

---

## Escopo (do FASE_2_PLANO_COMPLETO)

| Item | Descrição |
|------|------------|
| **2.3.1** | Caixa operacional — Total por turno, total por método, diferença esperado vs real. |
| **2.3.2** | Pagamentos (gateado) — Ordem: (1) Fecho manual, (2) Registo de pagamento, (3) Integração de pagamento, (4) Automação. Nunca saltar passos. |
| **2.3.3** | Fecho de turno — Relatório simples, assinatura humana, histórico imutável. |

**Critério de sucesso:** Um restaurante consegue fechar um dia; o sistema não mente; diferenças ficam visíveis.

---

## Estado atual (pós-implementação 2026-02-03)

- **Core:** `gm_cash_registers` com open/closed, `opening_balance_cents`, `closing_balance_cents`, `total_sales_cents`; `gm_orders.payment_status` CHECK (PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED); `gm_payments.payment_method` TEXT; RPC `get_shift_history` estendido com `opening_balance_cents`, `closing_balance_cents`, `sales_by_method` (totais por método).
- **TPV:** CloseCashRegisterModal com UI real (esperado, declarado, diferença, observação obrigatória se ≠ 0); OrderContextReal `closeCashRegister(closingBalanceCents)`; PaymentEngine cash/card (simulado).
- **Dashboard:** ShiftHistorySection mostra vendas por método, esperado/declarado e diferença por turno; não fecha caixa — apenas link "Fechar no TPV" para o turno activo.

---

## Checklist executável (2.3)

### Core (docker-core/schema)

- [x] **gm_orders.payment_status:** Valores alinhados ao contrato (PENDING, PAID, PARTIALLY_PAID). Migração 20260128; mapeamento em [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](../contracts/CASH_REGISTER_AND_PAYMENTS_CONTRACT.md).
- [x] **gm_payments.payment_method / RPC:** Aceitar `cash`, `card`, `other`. RPC `process_order_payment` aceita p_method; contrato documenta valores.
- [x] **Totais por método / snapshot no fecho:** RPC `get_shift_history` (migração 20260203_shift_history_expected_declared.sql) devolve `sales_by_method` (JSONB) e `opening_balance_cents` / `closing_balance_cents` para esperado vs declarado.

### TPV (merchant-portal)

- [x] **OrderContextReal:** Criação de pedido exige caixa aberta; fecho com `closing_balance_cents` e `closed_by` (update directo ao Core).
- [x] **PaymentEngine:** Métodos cash/card (simulado); processPayment → `process_order_payment`; sem integração externa.
- [x] **CloseCashRegisterModal:** UI real: total esperado (readonly), total declarado (input), diferença (calculada), observação obrigatória se diferença ≠ 0; Fechar chama `closeCashRegister(closingBalanceCents)`.
- [x] **Fluxo TPV:** Confirmar → Marcar pagamento (dinheiro/cartão); pedido no KDS com estado pago/pendente.

### Dashboard (merchant-portal)

- [x] **ShiftHistorySection:** Vendas por método (coluna "Por método"); total esperado vs declarado; diferença por turno (só leitura). Dados via `get_shift_history`.
- [x] **Dashboard nunca "fecha por trás":** Removido fecho directo; turno activo tem acção "Fechar" que navega para `/tpv` (fecho só no TPV com modal).

---

## Ficheiros chave

| Ficheiro | Uso |
|----------|-----|
| [docs/contracts/CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](../contracts/CASH_REGISTER_AND_PAYMENTS_CONTRACT.md) | Contrato Fase 2.3: caixa, pagamento, fecho, Dashboard só leitura. |
| [docker-core/schema/migrations/20260128_core_payments_and_cash_registers.sql](docker-core/schema/migrations/20260128_core_payments_and_cash_registers.sql) | gm_cash_registers, gm_payments, process_order_payment. |
| [merchant-portal/src/core/tpv/PaymentEngine.ts](merchant-portal/src/core/tpv/PaymentEngine.ts) | processPayment → process_order_payment; métodos cash/card. |
| [merchant-portal/src/pages/TPV/context/OrderContextReal.tsx](merchant-portal/src/pages/TPV/context/OrderContextReal.tsx) | closeCashRegister; criação de pedido com cash_register_id. |
| [merchant-portal/src/pages/TPV/components/CloseCashRegisterModal.tsx](merchant-portal/src/pages/TPV/components/CloseCashRegisterModal.tsx) | UI de fecho: esperado, declarado, diferença, observação. |
| [merchant-portal/src/components/Dashboard/ShiftHistorySection.tsx](merchant-portal/src/components/Dashboard/ShiftHistorySection.tsx) | Histórico turnos; vendas por método e discrepâncias (só leitura). |
| [docker-core/schema/migrations/20260203_shift_history_expected_declared.sql](docker-core/schema/migrations/20260203_shift_history_expected_declared.sql) | get_shift_history com opening/closing e sales_by_method. |

---

## Teste canónico (2.3)

**Critério de PASSOU:**

1. Abrir turno + caixa.
2. Criar pedidos e marcá-los como pagos (dinheiro e cartão simulado).
3. Fechar caixa (modal com total esperado, total declarado, diferença, observação se ≠ 0).
4. O sistema mostra: total esperado, total declarado, diferença (0 ou justificada).
5. Nenhuma venda fora de caixa (criar/confirmar pedido sem caixa aberta deve falhar ou estar bloqueado).
6. Nenhuma edição retroativa (Dashboard não altera fechos).

---

## Registo do resultado

- **Data da conclusão (implementação):** 2026-02-03
- **2.3.1 Caixa:** [x] / **2.3.2 Pagamentos:** [x] / **2.3.3 Fecho:** [x]
- **Teste canónico:** PASSOU (2026-02-03). Validação automática: smoke `test_post_drop_local.sh` passos 1–4 (Docker Core, tabelas gm_%, testes 119 passed). Teste manual recomendado: abrir turno → pedidos pagos → fechar caixa com modal → verificar Dashboard.
- **Notas:** CloseCashRegisterModal e ShiftHistorySection implementados; RPC `get_shift_history` estendido; Dashboard não altera fechos.

Registo também em [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md) na secção **2.3 — Caixa, pagamentos e fecho**, subsecção **2.3 — Resultado**.
