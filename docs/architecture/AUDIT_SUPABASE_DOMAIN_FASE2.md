# Auditoria Supabase Domínio — Pós Fase 2

**Data:** 2025-02  
**Objetivo:** Confirmar que não existe Supabase como backend de domínio após Fase 2 (bootstrap/onboarding/menu/tenant) e classificar ocorrências restantes.

**Classificação:**
- **(A)** Auth temporário permitido (quarentena)
- **(B)** Domínio proibido (P0) — remoção/repoint para Docker Core
- **(C)** Telemetria/monitoramento (P1) — Core-only ou não-autoridade explícita

---

## 1. `supabase.from(`

| Ficheiro | Linha | Classificação | Ação recomendada |
|----------|-------|---------------|-------------------|
| `core/tenant/withTenant.ts` | 15, 54, 60, 66 | **(C)** Comentários de exemplo em JSDoc | Deixar ou trocar exemplos para Core. |
| `core/supabase/index.ts` | 40 | **(A)** Shim que proíbe uso em Docker | Manter (quarentena). |
| `pages/AppStaff/core/ReflexEngine.ts` | 73, 96 | **(B)** reflex_firings, app_tasks | Repoint para Core (getDockerCoreFetchClient); se não Docker, throw. |
| `core-boundary/README.md` | 47 | **(C)** Doc exemplo | Atualizar exemplo para Core. |
| `core/monitoring/performanceMonitor.ts` | 164 | **(C)** app_logs telemetria | Core-only ou marcar não-autoritativo. |
| `core/adapter/empire-pulse.ts` | 27, 59, 90 | **(C)** gm_products, empire_pulses | Core-only ou não-autoridade explícita. |
| `core/scripts/verify_recipe_deduction.ts` | 23, 34, 47, 60, 70, 78, 116–117 | **(C)** Script de teste | Não usar como autoridade; mocks ou Core. |

---

## 2. `supabase.rpc(`

| Ficheiro | Linha | Classificação | Ação recomendada |
|----------|-------|---------------|-------------------|
| `core/scripts/verify_recipe_deduction.ts` | 91 | **(C)** Script de teste | Manter em script; não é domínio em produção. |

---

## 3. `supabase.functions.invoke`

| Ficheiro | Linha | Classificação | Ação recomendada |
|----------|-------|---------------|-------------------|
| `core/health.ts` | 31 | **(B)** health check | Core-only: quando não Docker, throw. |
| `hooks/useSubscription.ts` | 123 | **(B)** create-subscription | Core-only: quando não Docker, throw (já faz para createSubscription). |
| `core/supabase/index.ts` | 94 | **(A)** Shim | Manter. |
| `integrations/adapters/glovo/GlovoAdapter.ts` | 237 | **(B)** delivery-proxy | Core-only ou throw quando não Docker. |
| `core/governance/SovereigntyService.ts` | 124 | **(B)** reconcile | Core-only: triggerHealer via Core; se não Docker, throw. |
| `core/tpv/stripePayment.ts` | 35 | **(B)** stripe-payment | Core-only: throw quando não Docker. |
| `core/payment/PaymentBroker.ts` | 32 | **(B)** stripe-payment | Core-only: throw quando não Docker. |

---

## 4. `BackendType.supabase`

| Ficheiro | Linha | Classificação | Ação recomendada |
|----------|-------|---------------|-------------------|
| `pages/AuthPage.tsx` | 116 | **(A)** UI auth (mostrar opção Supabase) | Manter em quarentena até Core Auth. |
| `core/infra/backendAdapter.ts` | 88, 96 | **(A)** Definição do enum e helper | Manter. |
| `core/auth/authAudit.ts` | 12, 26, 40 | **(A)** Audit só quando Supabase auth | Manter. |
| `core/sovereignty/OrderProjection.ts` | 55 | **(B)** Escrita projeção quando supabase | Remover ramo Supabase; só Core. |

---

## 5. `getBackendType()` (resumo)

- **BootstrapPage, Onboarding sections, useMenuItems, TenantContext, coreBillingApi, coreOrSupabaseRpc, AdvancedReportingService:** já Core-only (Fase 2); uso é `!== BackendType.docker` → erro. **(OK)**
- **useSupabaseAuth, FlowGate, AuthPage, backendAdapter, RuntimeContext, BillingConfigPanel, ConfigModulesPage, ShiftGate, SyncEngine, CoreOrdersApi, PaymentEngine, FinancialEngine, TaskAnalytics, TaskFeedback, useRealtimeMetrics, TaskDetailCoreTODO:** uso legítimo (auth, UI, ou Core path). **(A) ou (OK)**
- **OrderProjection (BackendType.supabase):** P0 — remover ramo Supabase. **(B)**

---

## Resumo executivo

- **P0 (B) a tratar nesta entrega:**  
  `health.ts`, `SovereigntyService.ts`, `useSubscription.ts` (path Supabase em fetch/create), `stripePayment.ts`, `PaymentBroker.ts`, `GlovoAdapter.ts`.  
  Opcional nesta fase: `ReflexEngine.ts`, `OrderProjection.ts` (ramo Supabase).
- **Auth (A):** Supabase permanece apenas em auth temporário (quarentena); sem novo uso de domínio.
- **Telemetria/scripts (C):** performanceMonitor, empire-pulse, verify_recipe_deduction — Core-only ou marcar não-autoritativo em fase posterior.

**Conclusão:** Após Fase 2, domínio crítico (bootstrap, onboarding, menu, tenant) está Core-only. Restam P0 em health, sovereignty, subscription, payment e Glovo; aplicação dos patches abaixo elimina Supabase como backend de domínio nesses pontos.
