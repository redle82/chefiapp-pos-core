# Sovereign Remediation Sprint 01 — Evidence Report

**Data:** 2026-01-28  
**Âmbito:** Auditoria virada em enforcement (CI, ordem + totais, produção = Docker Core, gate).

---

## 1. O que mudou

### CI (Task A)

- **Ficheiro:** `.github/workflows/ci.yml`
- **Alteração:** Novo passo "Run tests" após Build: `npm test -- --ci --testPathIgnorePatterns="e2e|playwright|massive" --testTimeout=15000 --maxWorkers=2`. Novo passo "Sovereignty gate": `bash ./scripts/sovereignty-gate.sh`.
- **Efeito:** O pipeline principal falha se os testes falharem ou se o sovereignty-gate detectar uso de `supabase.rpc('create_order_atomic')` nos módulos críticos.

### Código (Task B)

- **Novo:** `merchant-portal/src/core/infra/CoreOrdersApi.ts`  
  - API única para `create_order_atomic`: em modo Docker chama PostgREST (getDockerCoreFetchClient().rpc); em modo Supabase fallback transicional. Totais vêm do Core (resposta do RPC).
- **Alterado:** `merchant-portal/src/core/tpv/OrderEngine.ts`  
  - `createOrder` passa a usar `createOrderAtomic` de CoreOrdersApi em vez de `supabase.rpc('create_order_atomic')`.
- **Alterado:** `merchant-portal/src/core/services/WebOrderingService.ts`  
  - `createDirectOrder` passa a usar `createOrderAtomic`; total para routing (auto_accept vs airlock) continua como estimativa de UI; autoridade do pedido e totais vem da resposta do Core.
- **Alterado:** `merchant-portal/src/core/sovereignty/OrderProjection.ts`  
  - `persistOrder` usa `createOrderAtomic`; em modo Docker não escreve em `gm_orders` via Supabase para origin (RPC já seta via sync_metadata).
- **Alterado:** `merchant-portal/src/core/sync/SyncEngine.ts`  
  - `syncOrderCreate` usa `createOrderAtomic` com parâmetros alinhados ao RPC (p_sync_metadata com origin, table_number, table_id).  
  - `syncOrderUpdate`: quando `getBackendType() === BackendType.docker` não atualiza `total_cents` a partir de `payload.total` (totais = autoridade do Core).

### Docs e gates (Task C)

- **DATABASE_AUTHORITY.md:** Nova secção "PRODUÇÃO / PILOT: CORE = DOCKER CORE": autoridade financeira = Docker Core; Supabase transicional apenas para auth/sessão e leituras não financeiras documentadas; proibido Supabase como autoridade para pagamentos, caixa, reconciliação, totais de pedidos, criação de tenant; referência a `scripts/sovereignty-gate.sh` e CONTRACT_ENFORCEMENT.
- **scripts/sovereignty-gate.sh:** Novo script. Falha se OrderEngine, WebOrderingService, OrderProjection ou SyncEngine contiverem `supabase.rpc('create_order_atomic')` ou `(supabase as any).rpc('create_order_atomic')`; verifica existência de CoreOrdersApi.ts.
- **CONTRACT_ENFORCEMENT.md:** Em §4 (Banco / Domínio) adicionadas linhas "Produção = Docker Core" e "Sovereignty gate" com referência a DATABASE_AUTHORITY e ao script no CI.
- **FINANCIAL_CORE_VIOLATION_AUDIT.md:** OrderProjection, SyncEngine, WebOrderingService (criação + totais), SyncEngine (totais em sync), OrderEngine marcados como **Remediado** com evidência (ficheiros e API usada).

---

## 2. Violação removida (com referência a ficheiros)

- **Alvo:** OrderProjection + SyncEngine + ordem e totais via Supabase.
- **Regra:** Em modo Docker Core ativo, criação de pedido e totais usam exclusivamente o RPC do Docker Core (PostgREST).
- **Remoção:** Todos os call sites de `supabase.rpc('create_order_atomic')` e `invokeRpc('create_order_atomic')` nesses fluxos passaram a usar `CoreOrdersApi.createOrderAtomic`. Totais deixam de ser escritos no sync a partir do cliente quando o backend é Docker.
- **Ficheiros envolvidos:**  
  - `merchant-portal/src/core/infra/CoreOrdersApi.ts` (novo),  
  - `merchant-portal/src/core/tpv/OrderEngine.ts`,  
  - `merchant-portal/src/core/services/WebOrderingService.ts`,  
  - `merchant-portal/src/core/sovereignty/OrderProjection.ts`,  
  - `merchant-portal/src/core/sync/SyncEngine.ts`.

---

## 3. Como o enforcement evita regressão

- **CI:** O job "Run tests" falha o pipeline se qualquer teste falhar. O job "Sovereignty gate" executa `scripts/sovereignty-gate.sh`, que falha se algum dos quatro módulos (OrderEngine, WebOrderingService, OrderProjection, SyncEngine) voltar a usar `supabase.rpc('create_order_atomic')` ou `(supabase as any).rpc('create_order_atomic')`. Assim, uma alteração que reintroduza Supabase como autoridade para criação de pedidos faz o CI falhar antes do merge.

---

*Relatório de evidência. Sem marketing.*
