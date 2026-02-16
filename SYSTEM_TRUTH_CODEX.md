# System Truth Codex

**Objetivo:** Fonte única de verdade para estado operacional. Nenhum dado crítico (pedidos, pagamentos, turnos) pode ter duas fontes em conflito.

---

## Lei 1 — Core é autoridade

- **Pedidos, pagamentos, mesas, turnos:** Autoridade = Docker Core (PostgREST + PostgreSQL).
- O frontend (merchant-portal) **nunca** é fonte de verdade para dados financeiros ou de pedidos.
- Escritas passam por RPCs atómicos: `create_order_atomic`, `process_split_payment_atomic`, `open_cash_register_atomic`, `close_cash_register_atomic`.

---

## Lei 2 — Fast Offline (fila offline)

- Operações em modo offline são enfileiradas (IndexedDB + SyncEngine).
- Ao reconectar, a fila é processada e as escritas são aplicadas no Core.
- **Implementação:** `merchant-portal/src/core/sync/SyncEngine.ts`, `IndexedDBQueue.ts`, hooks `useOfflineQueue` / `useOfflineReconciler`.
- Nenhuma operação crítica é perdida por falha de rede.

---

## Lei 3 — Truth Zero (health do Core)

- O estado "Core está vivo" vem de **uma** fonte: health check do Core (useCoreHealth / fetchHealth).
- Componentes não devem fazer health checks diretos ao backend; usam o core de verdade (core.truth.backendIsLive ou equivalente).
- **Implementação:** `merchant-portal/src/core/health/useCoreHealth.ts`, gating.ts.

---

## Referências

- Contratos: `merchant-portal/src/core/ContractSystem.ts`, `CoreWebContract.ts`
- Flow: `merchant-portal/src/core/flow/FlowGate.tsx`
- Garantias: `SYSTEM_OF_RECORD_SPEC.md`
