# DbWriteGate — Plano de 5 Testes (ROI Coverage)

**Objetivo:** Cobrir ~20–25 branches em `governance/DbWriteGate.ts` com 5 cenários de alta densidade.

**Linhas-alvo:** 49, 64, 89, 93, 101–104, 118–120, 133, 135, 144, 162, 168, 181, 183, 214, 224, 248–249, 257, 287, 299, 311, 320, 372, 382, 394–396.

---

## Cluster 1 — Pilot/Client/Block (L49, 64, 89, 93, 101–104)

**Branches:** `getClient` supabase path, BLOCK+gm_payments, isPilot via `isDockerBackend()`, Pilot mock entry, gm_restaurants exclusion.

### Teste 1: BLOCK_DIRECT_WRITES + gm_payments + getClient supabase path

```
Cenário: Backend NÃO Docker, BLOCK=true, table=gm_payments.
Mock: isDockerBackend → false (supabase client).
Ação: DbWriteGate.insert("TestCaller", "gm_payments", {...}, {tenantId: "t1"}).
Esperado: DirectWriteBlockedError (nunca chega ao client).
Branches: L64 (BLOCKED_TABLES.includes para gm_payments).
```

**Alternativa densa:** Combinar com getClient supabase path.

```
Mock: isDockerBackend → false.
Ação: insert em tabela permitida (ex: gm_products) para forçar getClient() → supabase.
Branches: L49 (else → supabase).
```

**Recomendação:** 1 teste que faz:
- `isDockerBackend` false
- insert `gm_payments` com `BLOCK_DIRECT_WRITES` true → DirectWriteBlockedError
- Depois (outro it ou restore mocks) insert `gm_products` com BLOCK false → atinge L49 (supabase path).

---

## Cluster 2 — Pilot mock details (L118–120, 133, 135, 144)

**Branches:** uuidTables, crypto fallback, gm_products localStorage, gm_restaurants mock storage.

### Teste 2: Pilot mock gm_restaurant_members (UUID fallback sem crypto)

```
Cenário: Pilot mode, Core error, table=gm_restaurant_members, Node (crypto.randomUUID ausente).
Mock: localStorage chefiapp_pilot_mode=true, getDockerCoreFetchClient insert→reject.
Ação: DbWriteGate.insert("BootstrapPage", "gm_restaurant_members", {restaurant_id:"r1"}, {}).
Esperado: result.data com id no formato 00000000-0000-0000-0000-{timestamp}.
Branches: L118–120 (uuidTables, crypto undefined → fallback).
```

### Teste 2b: Pilot mock gm_restaurants (quando isDockerBackend false)

```
Cenário: Pilot mode, isDockerBackend=false (supabase), Core error, table=gm_restaurants.
Condição: !(isDockerBackend() && table === "gm_restaurants") → true quando isDockerBackend false.
Mock: isDockerBackend false, supabase.from().insert() reject, localStorage pilot_mode=true.
Ação: insert("BootstrapPage", "gm_restaurants", {name:"R1"}, {}).
Esperado: mockData em localStorage chefiapp_pilot_mock_restaurant.
Branches: L144 (table===gm_restaurants && mockData.id).
```

---

## Cluster 3 — Reconciliation + Update/Delete guards (L162, 168, 181, 183, 214, 224)

**Branches:** Shadow reconciliation enqueue, reconciliation catch + throw, BLOCK update, update sem id.

### Teste 3: Shadow table reconciliation enqueue + catch rethrow

```
Cenário: insert gm_cash_registers (shadow), success, tenantId presente.
Mock: getClient insert→resolve({data:{id:"cr-1"}, error:null}), ReconciliationEngine.enqueue→reject.
Ação: DbWriteGate.insert("GenesisKernel", "gm_cash_registers", {name:"CR1"}, {tenantId:"t1"}).
Esperado: rethrow do erro (se !isPilot). Pilot false → Logger.critical + throw.
Branches: L162, 168 (enqueue path), L181–183 (catch, !isPilot, throw).
```

Nota: isPilot = (localStorage pilot_mode) || isDockerBackend(). Com isDockerBackend true e localStorage null, isPilot = true. Para isPilot false: isDockerBackend false E localStorage pilot_mode não "true".

```
Mock: isDockerBackend false, localStorage getItem→null, ReconciliationEngine.enqueue→reject.
Branches: L181–183.
```

### Teste 3b: Update BLOCK_DIRECT_WRITES + gm_orders

```
(globalThis as any).__DBWRITEGATE_BLOCK_DIRECT_WRITES = true.
DbWriteGate.update("TestCaller", "gm_orders", {status:"paid"}, {id:"o1"}, {tenantId:"t1"}).
Esperado: DirectWriteBlockedError.
Branches: L214.
```

### Teste 3c: Update sem id (já existe)

```
DbWriteGate.update("TestCaller", "gm_products", {name:"X"}, {}, {tenantId:"t1"}).
Esperado: ConstitutionalBreachError.
Branches: L224.
```

---

## Cluster 4 — Update reconciliation + Delete block (L248–249, 257, 287, 299, 311)

**Branches:** Update reconciliation enqueue, BLOCK delete, enforce isAuthorized (update/delete).

### Teste 4: Update gm_cash_registers com reconciliação

```
Cenário: update gm_cash_registers, success, tenantId, shadow table.
Mock: getClient update→resolve({data:[{id:"cr-1"}], error:null}).
Ação: DbWriteGate.update("GenesisKernel", "gm_cash_registers", {name:"CR1"}, {id:"cr-1"}, {tenantId:"t1"}).
Esperado: ReconciliationEngine.enqueue chamado.
Branches: L248–249, 257.
```

### Teste 4b: BLOCK_DIRECT_WRITES + delete gm_payments

```
__DBWRITEGATE_BLOCK_DIRECT_WRITES = true.
DbWriteGate.delete("TestCaller", "gm_payments", {id:"p1"}, {tenantId:"t1"}).
Esperado: DirectWriteBlockedError.
Branches: L287.
```

### Teste 4c: enforce isAuthorized false em update

```
isAuthorized.mockReturnValueOnce(false).
DbWriteGate.update("BadCaller", "gm_products", {n:"x"}, {id:"1"}, {tenantId:"t1"}).
Esperado: ConstitutionalBreachError.
Branches: L382 (enforce).
```

---

## Cluster 5 — enforce PURE + tenant warning (L372, 394–396)

**Branches:** PURE mode block operational table, tenant warning (insert sem tenantId, não bootstrap).

### Teste 5: PURE mode block insert gm_cash_registers

```
Cenário: KERNEL_WRITE_MODE = "PURE" (default em Vitest), OPERATIONAL_TABLES inclui gm_cash_registers.
Ação: DbWriteGate.insert("GenesisKernel", "gm_cash_registers", {name:"CR1"}, {tenantId:"t1"}).
Esperado: ConstitutionalBreachError (PURE mode, operational table).
Branches: L372.
```

Nota: Se o módulo já está em PURE por default, este teste deve passar sem mocks extra.

### Teste 5b: Tenant warning (insert sem tenantId, tabela gm_* não bootstrap)

```
Ação: DbWriteGate.insert("MenuAuthority", "gm_products", {name:"P1"}, {}) // sem tenantId.
Esperado: insert completa, Logger.warn("DB_WRITE_WITHOUT_TENANT_ID").
Branches: L394–396.
```

Requisito: isAuthorized(true) para MenuAuthority+gm_products. Table gm_products, op INSERT, !tenantId, !isBootstrapRestaurantCreate → warn.

---

## Mapeamento Teste → Linhas

| Teste | Linhas cobertas | Tipo predominante |
|-------|-----------------|-------------------|
| 1 | 49, 64 | if, logical |
| 2 | 89, 101–104, 118–120, 133, 135, 144 | if, logical, default |
| 3 | 162, 168, 181, 183, 214, 224 | if, logical |
| 4 | 248–249, 257, 287, 299, 311, 382 | if, logical |
| 5 | 372, 394–396 | if, logical |

---

## Ordem de execução recomendada

1. Teste 5 (PURE + tenant) — sem novos mocks, rápido.
2. Teste 4 (update reconciliation + delete block + enforce update).
3. Teste 3 (reconciliation insert + catch + update block).
4. Teste 1 (getClient supabase + BLOCK gm_payments).
5. Teste 2 (Pilot gm_restaurant_members + gm_restaurants com isDockerBackend false).

---

## Dependências de mock

- `vi.mock("../../config")` — CONFIG.BLOCK_DIRECT_WRITES via globalThis.
- `vi.mock("../infra/backendAdapter")` — isDockerBackend (true/false).
- `vi.mock("../infra/dockerCoreFetchClient")` — getDockerCoreFetchClient.
- `vi.mock("./ExceptionRegistry")` — isAuthorized.
- `vi.mock("./ReconciliationEngine")` — enqueue.
- `(globalThis as any).localStorage` — getItem/setItem para pilot_mode e mocks.

Não é necessário alterar código de produção.
