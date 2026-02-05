# Checklist Anti-Supabase — Purga de domínio

**Status:** PURGE COMPLETE. Todos os passos 2.1–2.7, P1, Passo 3 e Passo 4 estão concluídos. Supabase domain usage remains an architectural violation; domínio = só Docker Core; Supabase apenas Auth em quarentena.

**Contexto:** [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) §4 — Proibição explícita. Supabase não pode ser fonte de verdade de domínio. Este checklist lista ficheiros a limpar para que **Docker Core seja o único backend de domínio**.

**Objetivo:** Eliminar `BackendType.supabase` de fluxos de domínio; eliminar `supabase.from` / `supabase.rpc` / `supabase.functions` para pedidos, menu, restaurantes, billing, relatórios; manter Supabase apenas como Auth temporário (quarentena explícita).

---

## Check automatizado anti-regressão

Um script falha o CI se alguém voltar a usar Supabase em domínio financeiro. **A auditoria P0 está fechada; novas violações são detetadas automaticamente por este check.**

| Item          | Detalhe                                                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Script**    | `scripts/check-financial-supabase.sh` (raiz do repo)                                                                                                                                                        |
| **Comando**   | `npm run audit:supabase-domain` (raiz) ou `bash ./scripts/check-financial-supabase.sh`                                                                                                                       |
| **Regras**    | Proibido em `merchant-portal/src/**`: `supabase.from("gm_orders")`, `supabase.from("gm_order_items")`, `supabase.from("fiscal_event_store")`, `supabase.from("inventory_*")`; e `supabase.rpc("...")` quando o nome da tabela/RPC contenha `gm_orders`, `gm_order_items`, `fiscal_event_store` ou o prefixo `inventory_`. |
| **Ignorar**   | Testes (`**/tests/**`, `*.test.*`, `*.spec.*`, `*.skip`), mocks, `core/supabase/index.ts` (shim), `core/auth/useSupabaseAuth.ts`, `core/infra/supabaseClient.ts`, `core/scripts/**`, `core/sync/*test.ts`.   |
| **Resultado** | Se encontrar violação → `exit 1` com mensagem clara (ficheiro + linha); caso contrário → passa.                                                                                                              |

Integração: o CI (ex.: GitHub Actions) deve executar `npm run audit:supabase-domain` antes de merge. Ver [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) para validar soberania financeira.

---

## Estado de execução (Fase 2 + P0 + OrderProjection)

| Passo                                                                                                       | Estado | Nota                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| 2.1 Billing                                                                                                 | ✅     | coreBillingApi Core-only; throw se não Docker.                                                          |
| 2.2 coreOrSupabaseRpc / OrderProjection                                                                     | ✅     | RPC só Core; OrderProjection escrita só via Core (ramo Supabase removido).                              |
| 2.3 Bootstrap / Onboarding                                                                                  | ✅     | BootstrapPage + IdentitySection, LocationSection, ScheduleSection Core-only.                            |
| 2.4 Relatórios                                                                                              | ✅     | AdvancedReportingService Core-only.                                                                     |
| 2.5 Menu                                                                                                    | ✅     | useMenuItems via RestaurantReader (Core).                                                               |
| 2.6 TenantContext + health, SovereigntyService, useSubscription, stripePayment, PaymentBroker, GlovoAdapter | ✅     | Todos Core-only ou throw.                                                                               |
| 2.7 backendAdapter                                                                                          | ✅     | Política documentada em backendAdapter.ts; domínio = só Docker; Supabase só auth.                       |
| ReflexEngine, performanceMonitor, empire-pulse                                                              | ✅ P1  | Decidido: Core-only ou no-op quando não Docker; telemetria não-autoritativa (sem domínio via Supabase). |
| Passo 3 Quarentena auth                                                                                     | ✅     | Banner TEMPORARY em useSupabaseAuth, supabaseClient, SystemGuardianContext.                             |
| Passo 4 ORE + Menu                                                                                          | ✅     | Verificado: deriveMenuState e useOperationalReadiness não usam Supabase.                                |

---

## Passo 2 — Código: matar o backendType em domínio

### 2.1 Billing ✅

| Ficheiro                                             | O quê                                                                                                | Ação                                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `merchant-portal/src/core/billing/coreBillingApi.ts` | `getBackendType() === BackendType.supabase` → chama `supabase.functions.invoke` para portal/checkout | ~~Remover ramo Supabase~~ **Feito.** Billing só via Docker Core; falhar explícito se não Docker. |

### 2.2 Orders / Criação de pedidos ✅

| Ficheiro                                                  | O quê                                                        | Ação                                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `merchant-portal/src/core/infra/CoreOrdersApi.ts`         | Já usa Docker quando `BackendType.docker`; path alternativo? | Garantir que **não** existe path Supabase para `create_order_atomic`.                                |
| `merchant-portal/src/core/infra/coreOrSupabaseRpc.ts`     | Se não Docker, chama `supabase.rpc(fnName, params)`          | Remover: RPC de domínio só via Core. Eliminar ficheiro ou reduzir a “só Core”; falhar se não Docker. |
| `merchant-portal/src/core/sovereignty/OrderProjection.ts` | ~~getBackendType() === supabase → escreve via Supabase~~     | **Feito.** Ramo Supabase removido; escrita de projeção só via Core.                                  |

### 2.3 Bootstrap / Restaurante ✅

| Ficheiro                                      | O quê                                                   | Ação                                                            |
| --------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| `merchant-portal/src/pages/BootstrapPage.tsx` | ~~supabase.rpc / supabase.from para criar restaurante~~ | **Feito.** Bootstrap só via Core; erro explícito se não Docker. |

### 2.4 Relatórios ✅

| Ficheiro                                                         | O quê                     | Ação                                                   |
| ---------------------------------------------------------------- | ------------------------- | ------------------------------------------------------ |
| `merchant-portal/src/core/reporting/AdvancedReportingService.ts` | ~~supabase para queries~~ | **Feito.** Só Docker Core (gm_orders, gm_order_items). |

### 2.5 Menu / Produtos ✅

| Ficheiro                                    | O quê                              | Ação                                                     |
| ------------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| `merchant-portal/src/hooks/useMenuItems.ts` | ~~supabase.from categorias/itens~~ | **Feito.** RestaurantReader (Core); throw se não Docker. |

### 2.6 Outros fluxos de domínio (backendType) ✅

| Ficheiro                                                          | O quê                                           | Ação                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `merchant-portal/src/core/tenant/TenantContext.tsx`               | ~~Supabase para members/restaurantes~~          | **Feito.** Resolução só via Core.                                     |
| `merchant-portal/src/pages/Onboarding/sections/*`                 | ~~Fallback Supabase~~                           | **Feito.** IdentitySection, LocationSection, ScheduleSection só Core. |
| `merchant-portal/src/core/billing/coreBillingApi.ts`              | ~~Ramo Supabase~~                               | **Feito.** Só Core.                                                   |
| `merchant-portal/src/hooks/useSubscription.ts`                    | ~~supabase.functions.invoke~~                   | **Feito.** Só Core; throw se não Docker.                              |
| `merchant-portal/src/core/health.ts`                              | ~~supabase.functions.invoke('health')~~         | **Feito.** Só Core; throw se não Docker.                              |
| `merchant-portal/src/core/governance/SovereigntyService.ts`       | ~~supabase.functions.invoke('reconcile')~~      | **Feito.** Core RPC; throw se não Docker.                             |
| `merchant-portal/src/core/tpv/stripePayment.ts`                   | ~~supabase.functions.invoke('stripe-payment')~~ | **Feito.** Core RPC; throw se não Docker.                             |
| `merchant-portal/src/core/payment/PaymentBroker.ts`               | Idem                                            | **Feito.** Core RPC; throw se não Docker.                             |
| `merchant-portal/src/integrations/adapters/glovo/GlovoAdapter.ts` | ~~supabase.functions.invoke('delivery-proxy')~~ | **Feito.** Core RPC; se não Docker, erro e skip poll.                 |

### 2.7 Adapter / runtime ✅

| Ficheiro                                           | O quê                                                                     | Ação                                                                                                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merchant-portal/src/core/infra/backendAdapter.ts` | `getBackendType()` devolve `BackendType.supabase` quando URL não é Docker | **Feito.** Política documentada em cabeçalho e JSDoc de `getBackendType()`: domínio = só Docker (exigir e falhar se não for); Supabase apenas para Auth em quarentena. |

### P1 Telemetria / monitoramento ✅

| Ficheiro                                                    | O quê                                 | Decisão                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `merchant-portal/src/pages/AppStaff/core/ReflexEngine.ts`   | reflex_firings, app_tasks             | **Feito.** Se não Docker, no-op (return). Em Docker, usa getDockerCoreFetchClient.                       |
| `merchant-portal/src/core/monitoring/performanceMonitor.ts` | app_logs (telemetria)                 | **Feito.** Se não Docker, no-op. Em Docker, envia logs via Core. Telemetria não-autoritativa.            |
| `merchant-portal/src/core/adapter/empire-pulse.ts`          | gm_products, empire_pulses (métricas) | **Feito.** Se não Docker, no-op. Em Docker, leitura/escrita via dockerCoreFetchClient. Não-autoritativo. |

---

## Passo 3 — Supabase em quarentena (Auth temporário)

Mover para pasta explícita (ex.: `merchant-portal/src/infra/legacy-auth-supabase/` ou manter em `core/auth` com banner) e marcar:

- `merchant-portal/src/core/auth/useSupabaseAuth.ts`
- `merchant-portal/src/core/infra/supabaseClient.ts`
- `merchant-portal/src/core/guardian/SystemGuardianContext.tsx` (getSession)
- Páginas que só usam `supabase.auth.getSession()` / `signOut()`: AuthPage, SetupLayout, DraftDashboard, ConfigModulesPage (sessão), etc.

Em cada ficheiro, comentário de bloco:

```text
// TEMPORARY: Supabase auth.
// NOT SOURCE OF TRUTH.
// Scheduled for removal when Core Auth lands.
```

Não adicionar **novos** usos de Supabase para domínio.

---

## Passo 4 — ORE + Menu blindados ✅

| Verificação                                           | Onde                                                            | Ação                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `deriveMenuState` nunca consulta Supabase             | `merchant-portal/src/core/menu/MenuState.ts`                    | **Verificado.** Entrada só de useRestaurantRuntime (Runtime alimentado pelo Core). |
| ORE nunca recebe dados que não venham do Core Runtime | `merchant-portal/src/core/readiness/useOperationalReadiness.ts` | **Verificado.** useMenuState + runtime; sem Supabase.                              |
| Relatórios só usam gm_orders / gm_order_items do Core | `AdvancedReportingService.ts`                                   | Ver Passo 2.4; reader/API Core apenas.                                             |

---

## Ficheiros que chamam supabase.from / supabase.rpc / supabase.functions (lista crua)

Para remover ou repoint:

- `BootstrapPage.tsx` — supabase.rpc (criar restaurante)
- `core/billing/coreBillingApi.ts` — supabase.functions.invoke
- `hooks/useSubscription.ts` — supabase.functions.invoke
- `core/health.ts` — supabase.functions.invoke
- `core/infra/coreOrSupabaseRpc.ts` — supabase.rpc (domínio)
- `integrations/adapters/glovo/GlovoAdapter.ts` — supabase.functions.invoke
- `core/governance/SovereigntyService.ts` — supabase.functions.invoke
- `pages/AppStaff/core/ReflexEngine.ts` — ✅ Core-only ou no-op (reflex_firings, app_tasks)
- `core/monitoring/performanceMonitor.ts` — ✅ Core-only ou no-op (app_logs)
- `core/adapter/empire-pulse.ts` — ✅ Core-only ou no-op (gm_products, empire_pulses)
- `core/tpv/stripePayment.ts` — supabase.functions.invoke
- `core/payment/PaymentBroker.ts` — supabase.functions.invoke
- `core/reporting/AdvancedReportingService.ts` — supabase (queries)
- Scripts/testes: `verify_recipe_deduction.ts`, `SyncEngine.test.ts`, `OfflineStressTest.test.ts` — não usar como autoridade; mocks podem apontar ao Core.

---

## Ordem sugerida de execução

1. **Contrato** — ✅ Feito (CORE_FINANCIAL_SOVEREIGNTY_CONTRACT §4).
2. **coreBillingApi** — ✅ Feito.
3. **CoreOrdersApi / coreOrSupabaseRpc / OrderProjection** — ✅ Feito.
4. **BootstrapPage + Onboarding sections** — ✅ Feito.
5. **AdvancedReportingService** — ✅ Feito.
6. **useMenuItems** — ✅ Feito.
7. **TenantContext** — ✅ Feito.
8. **health, SovereigntyService, stripePayment, PaymentBroker, useSubscription, GlovoAdapter** — ✅ Feito.
9. **ReflexEngine, performanceMonitor, empire-pulse** — ✅ Decidido: Core-only ou no-op; telemetria não-autoritativa.
10. **backendAdapter** — ✅ Política documentada em backendAdapter.ts (domínio = só Docker; Supabase só auth).
11. **Quarentena auth** — ✅ Banner TEMPORARY em useSupabaseAuth, supabaseClient, SystemGuardianContext.
12. **Verificação ORE + Menu** — ✅ Confirmado: deriveMenuState e useOperationalReadiness consomem só Runtime/Context; sem Supabase.

---

## Conclusão

Purga Anti-Supabase concluída. Domínio (pedidos, menu, restaurantes, billing, relatórios, tenant, health, etc.) é **só Docker Core**; fluxos exigem `BackendType.docker` e falham explícito se não for. Supabase permanece **apenas para Auth em quarentena** (useSupabaseAuth, AuthPage). Telemetria (ReflexEngine, performanceMonitor, empire-pulse) é Core-only ou no-op. Próximos passos de produto: [NEXT_STEPS.md](../../NEXT_STEPS.md).

---

**Referência:** [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) §4. [FINANCIAL_CORE_VIOLATION_AUDIT.md](./FINANCIAL_CORE_VIOLATION_AUDIT.md) — classificação (a) Legacy, (b) Technical debt, (c) Violation.
