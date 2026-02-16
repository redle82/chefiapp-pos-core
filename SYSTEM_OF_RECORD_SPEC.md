# System of Record — Especificação

**Objetivo:** Garantias de consistência e imutabilidade para dados críticos.

---

## Garantia de atomicidade

- Todas as escritas críticas (pedido, pagamento, abertura/fecho de caixa) passam por **atomic transaction** no Core.
- RPCs atómicos: `create_order_atomic`, `process_split_payment_atomic`, `open_cash_register_atomic`, `close_cash_register_atomic`.
- O frontend não faz múltiplas escritas independentes para um mesmo acto de negócio; uma única chamada RPC representa a transação atómica no PostgreSQL.
- **Implementação:** `merchant-portal/src/core/infra/CoreOrdersApi.ts` (createOrderAtomic), `merchant-portal/src/core/tpv/PaymentEngine.ts` (process_split_payment_atomic), `CashRegister.ts` (open/close_atomic).

---

## Garantia de imutabilidade

- Tabelas de auditoria (ex.: `core_event_log`) são append-only.
- Triggers ou políticas impedem UPDATE/DELETE em tabelas de evento quando aplicável.
- **Implementação:** migrations em `docker-core/schema/migrations/` (core_event_log, device_heartbeats, etc.).

---

## Fonte única

- Pedidos: `gm_orders` + `gm_order_items` (Core).
- Pagamentos: RPCs e tabelas de pagamento no Core.
- Turnos: `gm_cash_registers`, RPCs open/close_atomic.

Ver também: `docs/architecture/CORE_EVENTS_CONTRACT.md`, `SYSTEM_TRUTH_CODEX.md`.
