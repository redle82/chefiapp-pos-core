# Mapa de Hotspots — Branch Coverage (48% → 60%+)

**Gerado em:** 2026-02-26  
**Coverage atual:** branches 48.49%, total uncovered 1640

Objetivo: priorizar ficheiros por **impacto absoluto** (branches não cobertos) e classificar em Quick wins / Médio impacto / Arquitetural.

---

## Top 20 — Branches Não Cobertos (ordem por impacto)

| # | Ficheiro | Uncovered | Total | % | Classificação |
|---|----------|-----------|-------|---|---------------|
| 1 | `server/integration-gateway.ts` | 296 | 713 | 58.5% | 🔴 Arquitetural |
| 2 | `merchant-portal/src/core/infra/dockerCoreFetchClient.ts` | 110 | 145 | 24.1% | 🔴 Arquitetural |
| 3 | `core-engine/repo/InMemoryRepo.ts` | 73 | 102 | 28.4% | 🟡 Médio |
| 4 | `core-engine/infra/dockerCoreFetchClient.ts` | 68 | 78 | 12.8% | 🔴 Arquitetural |
| 5 | `docker-core/server/payments/providers/sumupProvider.ts` | 62 | 62 | 0% | 🔴 Arquitetural |
| 6 | `merchant-portal/src/infra/readers/RuntimeReader.ts` | 56 | 75 | 25.3% | 🟡 Médio |
| 7 | `merchant-portal/src/core/services/AuditLogService.ts` | 53 | 76 | 30.3% | 🟡 Médio |
| 8 | `core-engine/executor/CoreExecutor.ts` | 45 | 70 | 35.7% | 🟡 Médio |
| 9 | `merchant-portal/src/core/services/WebOrderingService.ts` | 39 | 63 | 38.1% | 🟡 Médio |
| 10 | `docker-core/server/payments/providers/stripeProvider.ts` | 38 | 39 | 2.6% | 🔴 Arquitetural |
| 11 | `merchant-portal/src/core/flow/CoreFlow.ts` | 38 | 90 | 57.8% | 🟢 Quick win |
| 12 | `docker-core/server/billing/orgRevenueAnalyticsEngine.ts` | 36 | 78 | 53.8% | 🟢 Quick win |
| 13 | `merchant-portal/src/core/infra/CoreOrdersApi.ts` | 36 | 48 | 25.0% | 🟡 Médio |
| 14 | `core-engine/effects/index.ts` | 33 | 44 | 25.0% | 🟡 Médio |
| 15 | `merchant-portal/src/core/i18n/regionLocaleConfig.ts` | 33 | 35 | 5.7% | 🟢 Quick win |
| 16 | `merchant-portal/src/core/tpv/OrderEngine.ts` | 33 | 43 | 23.3% | 🟡 Médio |
| 17 | `docker-core/server/billing/stripeOrgInvoiceService.ts` | 32 | 52 | 38.5% | 🟡 Médio |
| 18 | `core-engine/guards/index.ts` | 31 | 33 | 6.1% | 🟢 Quick win |
| 19 | `server/activationMetrics.ts` | 28 | 28 | 0% | 🟡 Médio |
| 20 | `docker-core/server/billing/getEnterpriseRevenueMetricsRpc.ts` | 26 | 49 | 46.9% | 🟢 Quick win |

---

## Classificação

### 🟢 Quick wins (1–2 testes resolvem ~10 branches)

Ficheiros com estrutura linear, poucos guards, ou paths alternativos fáceis de exercitar.

- **CoreFlow.ts** — 38 uncovered, 57.8% já coberto → exercitar branches restantes
- **orgRevenueAnalyticsEngine.ts** — 36 uncovered, 53.8% → edge cases de agregação
- **regionLocaleConfig.ts** — 33 uncovered, 35 branches → matriz de regiões
- **core-engine/guards/index.ts** — 31 uncovered, 33 total → guards isolados
- **getEnterpriseRevenueMetricsRpc.ts** — 26 uncovered → edge cases RPC

### 🟡 Médio impacto (3–6 testes)

Exigem mocks de infra, cenários de erro ou múltiplos paths.

- **InMemoryRepo.ts** — repo em memória; testes de CRUD + edge cases
- **RuntimeReader.ts** — leitor com fallbacks; cenários de erro
- **AuditLogService.ts** — logging; sucesso/erro do RPC
- **CoreExecutor.ts** — executor; sucesso/erro/retry
- **WebOrderingService.ts** — integrações externas; mocks
- **CoreOrdersApi.ts** — API Core; edge paths (já tem testes base)
- **core-engine/effects/index.ts** — side effects; isolamento
- **OrderEngine.ts** — TPV; fluxos de pagamento/erro
- **stripeOrgInvoiceService.ts** — Stripe; mocks de invoice
- **activationMetrics.ts** — servidor; mocks de request/response

### 🔴 Arquitetural (refactor ou testes complexos)

Ficheiros grandes, muitos dispatch paths, ou dependentes de I/O real.

- **integration-gateway.ts** — 296 uncovered, 713 total; dispatch massivo
- **dockerCoreFetchClient** (merchant-portal + core-engine) — 110+68; fetch/erro/timeout
- **sumupProvider.ts** — 0% coverage; provider de pagamento
- **stripeProvider.ts** — 2.6%; provider de pagamento

---

## Recomendação de Sprint

| Prioridade | Ficheiros | Testes estimados | Impacto (branches) |
|------------|-----------|------------------|--------------------|
| P1 | regionLocaleConfig, guards, getEnterpriseRevenueMetricsRpc | 4–6 | ~90 |
| P2 | CoreFlow, orgRevenueAnalyticsEngine | 4–6 | ~74 |
| P3 | InMemoryRepo, AuditLogService, CoreOrdersApi | 6–10 | ~162 |
| P4 | RuntimeReader, WebOrderingService, OrderEngine | 6–10 | ~128 |

**Target 60% branches:** precisas cobrir ~370 branches. P1+P2 ≈ 164. P1+P2+P3 ≈ 326. P1–P4 ≈ 454.

---

## Notas

- **Providers (sumup, stripe):** requerem mocks de SDK ou testes de integração com Stripe/SumUp sandbox.
- **integration-gateway:** gate progressivo por rota (ex.: `/api/orders` ≥70%) é mais realista do que coverage global.
- **dockerCoreFetchClient:** cenários de erro (404, timeout, JSON inválido) são bons candidatos a testes unitários.
