# Diagnóstico Técnico — Readiness para Uso Comercial Real (Use-in-Commerce)

**Data:** 2026-02-26  
**Âmbito:** core-engine, backend, infraestrutura  
**Objetivo:** Avaliar se o ChefiApp está pronto para uso comercial real (registro de trademark) com 1 restaurante real em produção.

---

## Resumo Executivo

O **caminho de produção atual** não usa o core-engine Event Sourcing. Todo o fluxo operacional passa por **RPCs Postgres** (PostgREST) via Docker Core: `create_order_atomic`, `process_order_payment`, etc. O Event Sourcing (TenantKernel, EventExecutor, ExecutorRegistry) está **DORMANT** e documentado como tal (`core-engine/ARCHITECTURE_DECISION.md`, `KernelContext.tsx`).

Para **1 restaurante real amanhã**, o sistema está **operacionalmente viável** se o Core e integration-gateway estiverem em execução, com autenticação e autorização tratadas no gateway. Existem **bloqueadores** e **riscos** que devem ser mitigados antes de uso comercial amplo.

---

## 1. Persistência

### 1.1 InMemory vs Adapters Reais

| Componente | Tipo | Localização | Em uso em produção? |
|------------|------|-------------|----------------------|
| **Fluxo real** | Postgres via RPC | `create_order_atomic`, `process_order_payment`, etc. | ✅ Sim |
| InMemoryRepo | In-memory | `core-engine/repo/InMemoryRepo.ts` | ❌ Não (TenantKernel dormant) |
| InMemoryStorageAdapter | In-memory | `core-engine/repo/InMemoryStorageAdapter.ts` | ❌ Não |
| StorageAdapter (interface) | Interface | `core-engine/repo/StorageAdapter.ts` | ❌ CoreExecutor não usado em prod |
| PostgresEventStore | Postgres | `core-engine/persistence/PostgresEventStore.ts` | ❌ **Quebrado** — importa `gate3-persistence/PostgresLink` que não existe |
| PostgresStorageAdapter | — | **Não existe** | N/A |

**Conclusão:** O fluxo de produção usa **Postgres diretamente** via RPCs. Não há InMemory em produção para pedidos/pagamentos. O core-engine Event Sourcing usa InMemory mas está desativado. `PostgresEventStore` e `CoreTransactionManager` dependem de `gate3-persistence/PostgresLink` (pasta removida); testes usam mock (`tests/__mocks__/PostgresLink.ts`).

### 1.2 Multi-Tenant e Isolamento

| Aspecto | Implementação | Ficheiro |
|---------|---------------|----------|
| RPCs com validação | `has_restaurant_access(p_restaurant_id)` no início de `create_order_atomic`, etc. | Migrations (ex.: `20260213_server_side_idempotency.sql`) |
| RLS em tabelas | Políticas `has_restaurant_access(restaurant_id)` | `20260212_fix_tenancy_rls_hardening.sql`, `20260221_device_heartbeats_and_runtime_views.sql` |
| Docker Core auth shim | `has_restaurant_access()` **sempre retorna TRUE** | `docker-core/schema/04.6-auth-shims.sql:36` |
| PostgREST role | `PGRST_DB_ANON_ROLE: postgres` — superuser, RLS bypassed | `docker-compose.core.yml:126` |
| event_store | RLS por `restaurant_id` | `20260220_event_store_tenant_hardening.sql` |

**Conclusão:** Em Docker Core, o Postgres usa superuser e RLS é bypassed. O isolamento depende de:
1. O **integration-gateway** (ou outro BFF) validar que o utilizador só acede ao seu `restaurant_id`
2. RPCs com `has_restaurant_access()` — que em Docker Core retornam sempre TRUE (shim)

Para multi-tenant real, é necessário ativar autenticação real (Keycloak/Supabase) e substituir o shim por uma verificação baseada em sessão/JWT.

---

## 2. CoreExecutor

### 2.1 Estado em Produção

O CoreExecutor **não está em uso** em produção. O caminho real é:
`OrderContextReal` → `CoreOrdersApi.createOrderAtomic()` → `dockerCoreFetchClient.rpc("create_order_atomic", ...)` → PostgREST → função SQL.

### 2.2 Estabilidade (caso fosse ativado)

| Mecanismo | Implementação |
|-----------|---------------|
| Transações | `repo.beginTransaction()`, `commit()`, `rollback()` — InMemoryRepo |
| Lock | `repo.withLock(lockIds, fn)` — evita race em PAYMENT:CONFIRM |
| Conflito de concorrência | `ConcurrencyConflictError` em `commit()` (versão) |
| Rollback em guard/effect | `CoreExecutor.ts` — rollback em falhas |

### 2.3 Pontos Frágeis (Event Sourcing)

1. **ExecutorRegistry incompatível com EventExecutor**  
   `ExecutorRegistry.ts:34` chama `new EventExecutor(this.eventStore, repo)` com 2 argumentos. O construtor de `EventExecutor` exige 4: `(eventStore, repo, boundTenantId, boundExecutionId)`. Isto causaria erro em runtime se o Kernel fosse ativado.

2. **Effects acoplados a InMemoryRepo**  
   `core-engine/effects/index.ts`: acesso a `(repo as any).transactions`, `(repo as any).orders` — quebra encapsulamento e dificulta adapters Postgres.

3. **PostgresEventStore quebrado**  
   Import de `gate3-persistence/PostgresLink` inexistente.

---

## 3. SyncEngine

### 3.1 Localização e Responsabilidade

- **Ficheiro:** `merchant-portal/src/core/sync/SyncEngine.ts`
- Responsabilidades: fila offline, retries com backoff, idempotência via RPCs, conectividade.

### 3.2 Singleton e Concorrência

| Aspecto | Detalhe |
|---------|---------|
| Singleton | `export const SyncEngine = new SyncEngineClass()` (linha 569) |
| Processamento | `isProcessing` evita processamento paralelo da fila |
| Dependências | `IndexedDBQueue`, `ConflictResolver` (hardcoded se não injetadas) |

**Risco:** Um único SyncEngine para toda a aplicação. Em multi-tab ou múltiplos restaurantes na mesma sessão, pode haver interferência. `docs/strategy/CORE_ENGINE_3_EVOLUTIONS.md` descreve refatoração para DI e multi-tenant.

---

## 4. Observabilidade

### 4.1 Logging

| Componente | Detalhe |
|------------|---------|
| Logger | `core-engine/logger/Logger.ts` — singleton, integração Sentry |
| Contexto | `tenantId`, `userId`, `sessionId`, `requestId` |
| Métodos | `info`, `warn`, `error`, `critical` com contexto estruturado |

### 4.2 Métricas

| Métrica | Onde | Estado |
|---------|------|--------|
| Latência por operação | `CoreOrdersApi.ts` — `latencyAddSample(restaurantId, "create_order_atomic", durationMs)` | ✅ Existe |
| Falhas de guard | — | ❌ Não instrumentado |
| Falhas de effect | — | ❌ Não instrumentado (CoreExecutor não em uso) |
| Latência por transição | CoreExecutor | ❌ Não instrumentado |

### 4.3 Tratamento de Erros

- CoreExecutor: `TransitionResult` com `error`, `guardFailures`, `conflict`
- SyncEngine: `classifyFailure` → critical → dead_letter; retry com backoff
- DbWriteGate: `ConstitutionalBreachError` + `Logger.critical`

---

## 5. Segurança Mínima

### 5.1 Autenticação

| Componente | Estado |
|------------|--------|
| Docker Core | PostgREST com `PGRST_DB_ANON_ROLE: postgres` — sem JWT obrigatório |
| integration-gateway | Valida `INTERNAL_API_TOKEN` para rotas internas; Stripe/CORS para billing |
| Keycloak | Incluído no Docker Core com `profiles: ["auth", "full"]` — opcional |

### 5.2 Controle de Permissões

| Aspecto | Implementação |
|---------|---------------|
| RBAC em RPCs | `gm_has_role(p_actor_user_id, p_restaurant_id, 'manager')` em `update_order_status`, `mark_pix_paid` | `20260403_gm_has_role_and_update_order_status_rbac.sql` |
| DbWriteGate | Bloqueia writes diretos em `gm_orders`, `gm_order_items`, etc. (PURE) | `core-engine/governance/DbWriteGate.ts` |
| Billing guard | `_billing_guard_order` em `create_order_atomic` | Migrations |

### 5.3 Validações Críticas

- **has_restaurant_access** no início de RPCs críticos — em Docker Core retorna sempre TRUE (shim)
- **TenantId** em DbWriteGate: aviso quando ausente em writes em `gm_*`

**Gap:** Em modo Docker Core, se o PostgREST for exposto diretamente (sem gateway que valide JWT/tenant), qualquer cliente pode chamar RPCs para qualquer restaurante. O isolamento depende da arquitetura de rede e do gateway.

---

## 6. Deploy Readiness

### 6.1 O que está pronto

| Item | Evidência |
|------|-----------|
| Docker Core | `docker-compose.core.yml` — Postgres, PostgREST, Realtime, Nginx |
| Fluxo de pedidos | `create_order_atomic` → Core via `CoreOrdersApi` |
| Idempotência | `p_idempotency_key` em `create_order_atomic` |
| Sovereignty gate | CI falha se módulos críticos usarem `supabase.rpc('create_order_atomic')` |
| Release audit | `audit:release:portal` passa (docs/audit/RELEASE_AUDIT_STATUS.md) |
| Plano de rollout | `docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md` |

### 6.2 O que impediria onboarding de 1 restaurante amanhã

Nada bloqueia **tecnicamente** o onboarding de 1 cliente real, desde que:
- Docker Core + integration-gateway estejam em execução
- O gateway valide autenticação e restrinja chamadas por restaurante
- O Core não esteja exposto diretamente à internet sem proteção

---

## Lista Consolidada

### BLOQUEADORES (impedem uso comercial amplo / trademark sólido)

| # | Item | Esforço |
|---|------|---------|
| 1 | **gate3-persistence ausente** — `PostgresEventStore`, `CoreTransactionManager`, `FiscalEventStore` importam `PostgresLink` inexistente. Em produção o Event Sourcing está dormant, mas testes e futuro podem falhar. | 1–2 dias: criar adapter Postgres mínimo ou remover dependências mortas |
| 2 | **Docker Core sem autenticação real** — `PGRST_DB_ANON_ROLE: postgres`, `has_restaurant_access()` shim retorna TRUE. Exposição direta do Core = zero isolamento. | 2–3 dias: ativar Keycloak, JWT no PostgREST, substituir shim por verificação real |
| 3 | **ExecutorRegistry quebrado** — `new EventExecutor(eventStore, repo)` com 2 args vs 4 args. Não afeta prod atual (Kernel dormant) mas trava ativação futura. | 0.5 dia: corrigir assinatura |

### RISCOS (mitigar antes de escalar)

| # | Item | Mitigação |
|---|------|-----------|
| 1 | **Rate limiter InMemory** — Em multi-instância, cada processo tem estado próprio; sem Redis, rate limit não é partilhado. | Configurar `REDIS_URL` para `RedisRateLimiter` |
| 2 | **SyncEngine singleton** — Um único SyncEngine; multi-tab ou multi-restaurante na mesma sessão pode causar interferência. | Refatorar para DI/tenant-scoped (ver CORE_ENGINE_3_EVOLUTIONS.md) |
| 3 | **Observabilidade limitada** — Sem métricas de falhas de guard/effect; latência só em `create_order_atomic`. | Adicionar instrumentação em DbWriteGate e RPCs críticos |
| 4 | **integration-gateway DEPRECATED** — Documentação indica migração para Supabase Edge Functions. | Planejar migração ou consolidar stack |

### MELHORIAS NÃO CRÍTICAS

| # | Item |
|---|------|
| 1 | Documentar explicitamente que o Core não deve ser exposto sem gateway/proxy |
| 2 | Adicionar métricas de latência para `process_order_payment`, `update_order_status` |
| 3 | Remover ou marcar claramente código morto (ExecutorRegistry, PostgresEventStore se não for usado) |
| 4 | Consolidar migrations — ordem e dependências estão espalhadas |

---

## Estimativa de Esforço para 1 Cliente Real

| Fase | Esforço | Descrição |
|------|---------|-----------|
| **Mínimo** | 0–1 dia | Se o Core + gateway já estiverem em produção e o gateway fizer validação de tenant: onboarding de 1 restaurante é viável hoje. Validar rede, DNS, certificados. |
| **Recomendado** | 3–5 dias | Corrigir ExecutorRegistry; resolver gate3-persistence (adapter ou remoção); configurar Redis para rate limiter; verificar que o Core não está exposto. |
| **Para trademark sólido** | 1–2 semanas | Acima + autenticação real no Core (Keycloak/JWT); substituir shim `has_restaurant_access`; testes de isolamento multi-tenant; observabilidade básica. |

---

## Conclusão

O ChefiApp está **operacionalmente pronto** para 1 restaurante real se o Core e o integration-gateway estiverem corretamente configurados e o gateway garantir isolamento de tenant. Para **Use-in-Commerce** e registro de trademark com base técnica sólida, é recomendável:

1. Resolver dependências quebradas (gate3-persistence)
2. Ativar autenticação real e isolamento multi-tenant no Core
3. Configurar Redis para rate limiting em multi-instância
4. Documentar e auditar a superfície de exposição do Core

O core-engine Event Sourcing permanece dormant por decisão de arquitectura; o caminho de produção é RPC Postgres, que é estável e adequado para o momento.
