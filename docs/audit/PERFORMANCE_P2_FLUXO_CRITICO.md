# Performance P2 — Fluxo crítico (auditoria)

**Data:** 2026-02-13  
**Âmbito:** Fechamento de caixa (Z-Report) e pós-pagamento no TPV. Sem otimizações além do estritamente necessário.

---

## 1. Fechamento de caixa (Z-Report)

### Caminho em uso

- **UI:** `ShiftCloseReport.tsx` e `OrderContextReal.closeCashRegister` usam um único RPC: `close_cash_register_atomic`.
- **Efeito:** 1 chamada ao Core; o RPC gera Z-Report e evento CDC atomicamente.

### Conclusão

- **Fechamento = 1 RPC.** Nenhuma alteração necessária para o fluxo crítico.

### Nota sobre CashRegisterProjection

- `CashRegisterProjection.persistCloseCashRegister` existe (query `getTodayPayments` + update `gm_cash_registers`) e está ligado ao state-machine da sovereignty.
- O path de produção para “fechar caixa” na UI é o RPC `close_cash_register_atomic`, não esta projeção. Manter como está; não faz parte do fluxo crítico de fecho na UI.

---

## 2. Pós-pagamento (OrderContextReal)

### Sequência atual (ação `pay`)

1. **Crítico:** `process_order_payment` (1 RPC) — regista pagamento e atualiza estado do pedido.
2. **Opcional:** Update em `gm_orders` (tip_cents, discount_cents) se payload tiver valores.
3. **FASE 3 — CRM/Loyalty:** try/catch; várias leituras/escritas em `gm_customers`, `gm_loyalty_logs`. Falha não bloqueia; apenas log.
4. **FASE 4 — Inventory:** try/catch; `OrderEngine.getOrderById`, `InventoryEngine.processOrder`, `calculateOrderCost`, update `gm_orders` (total_cost_cents, gross_margin_cents). Falha não bloqueia resposta ao utilizador; log de erro.

### Conclusão

- **Crítico para o utilizador:** 1 RPC `process_order_payment`. Resposta ao utilizador pode ser dada após este RPC (e, se existir, após o update de tip/discount).
- **FASE 3 e FASE 4:** pós-críticos; já executam em try/catch e não bloqueiam a perceção de “pagamento concluído”. Decisão: **manter sequência atual**; não tornar assíncrono por agora. Se no futuro houver necessidade de reduzir latência sentida, FASE 3 e FASE 4 podem ser movidas para fila/worker (fora do scope desta auditoria).

---

## 3. Resumo

| Fluxo           | Chamadas críticas | Decisão                          |
|-----------------|-------------------|----------------------------------|
| Fechamento caixa| 1 RPC             | Manter; sem alteração            |
| Pós-pagamento   | 1 RPC + opcional  | Manter sequência; FASE 3/4 OK   |

Nenhuma otimização adicional implementada; documentação para referência futura e para alinhamento com o plano “Fechar 20% técnicos”.
