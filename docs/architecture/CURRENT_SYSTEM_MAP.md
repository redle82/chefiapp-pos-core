# Mapa do Sistema Atual (Core Crystallization)

Documento de verdade de engenharia: o que existe, o que foi removido, o que é legacy/archive. **Não é marketing** — é referência para quem mantém o sistema.

**Fontes de verdade:** Docker Core, ORE (Operational Readiness), TPV, Mini-TPV, KDS, Mini-KDS, Fiscal via Core. Fluxos reais validados por E2E e testes humanos.

---

## 1. O que existe (ativo)

### Backend / Core

- **Docker Core** — API de domínio (pedidos, menu, caixa, tarefas, fiscal). Único backend de domínio; Supabase apenas Auth em quarentena.
- **ORE** — Operational Readiness (deriveMenuState, useOperationalReadiness, readiness gates).
- **Contratos** — CoreFlow (navegação), OrderProjection, CashRegisterProjection, ProductProjection, TableProjection, InventoryProjection (soberania).
- **TPV** — OrderEngine, PaymentEngine, CashRegister (merchant-portal/src/core/tpv/). OrderContextReal consome OrderEngine + PaymentEngine.
- **KDS** — Fluxo receber → preparar → concluir; realtime; tarefas.
- **Fiscal** — Via Core (FiscalService, adapters quando existirem); não Supabase como domínio.
- **Billing** — coreBillingApi (Core-only); stripePayment, PaymentBroker.
- **Menu** — MenuReader/Writer via core-boundary; useMenuItems; publicação e primeiro produto (Bootstrap / First Product).

### Frontend (merchant-portal)

- **Fluxos cobertos:** Bootstrap / Activation, Menu (criação e publicação), TPV (abrir mesa → pedido → pagar), KDS (receber → preparar → feito), Offline/degradation (indicadores e fallbacks). Fluxo explícito TPV → Order → KDS: ver [FLOW_TPV_ORDER_KDS.md](FLOW_TPV_ORDER_KDS.md).
- **Navegação:** FlowGate + CoreFlow (resolveNextRoute); bootstrap, onboarding/first-product, /app/\*.
- **Contextos:** RestaurantRuntimeContext, ShiftContext, TenantContext, OnboardingContext, GlobalUIStateContext, ContextEngine (TPV).
- **Páginas principais:** BootstrapPage, TPV (TPV.tsx + OrderContextReal), KDSMinimal, MenuBuilderMinimal, DashboardPortal, Config, Billing, Alerts, Tasks.

### Testes ativos

- **Jest (raiz):** `tests/unit/`, `tests/integration/` (excluindo legacy-skip, doc-only, e2e, massive). Ver `docs/testing/STATUS_TESTS.md`.
- **Comando CI:** `npm test -- --ci` ou `npm run test:ci` — zero falhas esperadas.
- **E2E / Playwright:** Em `tests/e2e/` e `merchant-portal`; executados separadamente.

---

## 2. O que foi removido intencionalmente

### Código morto eliminado (Core Crystallization — Phase 1)

| Módulo                     | Local original   | Motivo                                        |
| -------------------------- | ---------------- | --------------------------------------------- |
| BlockchainAuditService     | core/blockchain/ | Nunca importado.                              |
| EdgeComputingService       | core/edge/       | Nunca importado.                              |
| IoTKitchenService          | core/iot/        | Nunca importado.                              |
| PredictiveAnalyticsService | core/analytics/  | Nunca importado.                              |
| CustomerBehaviorService    | core/customer/   | Nunca importado.                              |
| HistoricalDataEngine       | core/history/    | Nunca importado.                              |
| EventSourcingService       | core/events/     | Nunca importado.                              |
| HashChainService           | core/integrity/  | Só usado por EventSourcingService (removido). |

Registo em `merchant-portal/src/core/archive/README.md`.

### Arquitetura antiga (já removida antes do Crystallization)

- **event-log** (InMemoryEventStore, EventExecutor, types) — removido; testes em tests/legacy-skip.
- **legal-boundary** (LegalBoundary, InMemoryLegalSealStore, types) — removido; testes em tests/legacy-skip.
- **core-engine** (state-machines, executor, repo, persistence) — removido; excluído do Jest.
- **projections** (server-side OrderSummary, DailySales, etc.) — removido; testes em tests/legacy-skip.
- **gateways** (GatewayRegistry, LocalMockGateway, etc.) — removido; testes em tests/legacy-skip.
- **OrderEngineOffline / core/queue/db (OfflineDB)** — removidos; testes em tests/legacy-skip.

Nenhum destes módulos existe no repositório atual; referências apenas em tests/legacy-skip ou documentação.

---

## 3. Pastas consideradas legacy / archive

| Pasta                                 | Conteúdo                                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **tests/legacy-skip/**                | Testes que dependem de event-log, legal-boundary, core-engine, gateways, projections, OrderEngineOffline, OfflineDB, etc. Não executados pelo Jest. Ver tests/legacy-skip/README.md. |
| **tests/doc-only/**                   | Testes de conceitos documentais/futuros; excluídos da run.                                                                                                                           |
| **merchant-portal/src/core/archive/** | Apenas README listando módulos removidos (Phase 1). Não contém código; documentação do que foi eliminado.                                                                            |
| **tests/e2e/**                        | E2E; alguns ficheiros podem referir APIs antigas; executados fora do Jest.                                                                                                           |
| **tests/massive/**                    | Suites massivas que dependem de event-log/legal-boundary; excluídas do CI.                                                                                                           |
| **core-engine/** (raiz)               | Se existir, excluído do Jest; state-machines removidas.                                                                                                                              |

---

## 4. Regras de manutenção

- **Não** recriar módulos removidos (event-log, legal-boundary, core-engine, gateways, projections, OrderEngineOffline, OfflineDB) para satisfazer testes ou features.
- **Não** usar Supabase como domínio (pedidos, menu, caixa, fiscal); ver ANTI_SUPABASE_CHECKLIST.md.
- **Não** adicionar stubs/mocks para manter código morto vivo.
- Em dúvida entre manter e remover: **remover**. O que importa está nos fluxos reais e nos testes ativos.

---

## 5. Dashboard e camada de apresentação

**Contrato canónico:** Layout e conteúdo do dashboard em modo OPERATIONAL_OS são definidos em [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](../contracts/OPERATIONAL_DASHBOARD_V2_CONTRACT.md) (primeira/segunda dobra, sidebar, regra do menu, o que nunca aparece, o que só após terminais).

- **Modo OPERATIONAL_OS:** Quando `VITE_UI_MODE=OPERATIONAL_OS`, o dashboard ([merchant-portal/src/pages/Dashboard/DashboardPortal.tsx](../../merchant-portal/src/pages/Dashboard/DashboardPortal.tsx)) mostra apenas estado operacional: Operação (Core ON/OFF), histórico real, alertas reais, sinal do menu. Blocos das eras SaaS/onboarding (trial, primeira venda, atalhos rápidos, Sistema pronto, Faturação na sidebar) ficam ocultos.
- **Sidebar do dashboard:** Em OPERATIONAL_OS a sidebar reflecte estado só: subtítulo "Estado: Operação bloqueada" ou "Estado: Pronta"; um único indicador de Core (OperacaoCard); sem duplicação de "Core offline".
- **TPV/KDS "Não instalado":** Enquanto o trilho de instalação de terminais não existir (Gap A do ROADMAP_POS_FREEZE — gm_terminals, device_id), `VITE_TERMINAL_INSTALLATION_TRACK` é false e TPV/KDS aparecem na secção Operar como "Não instalado" com CTA "Instalar terminal" → `/app/install`, em vez de links funcionais.
- **Fonte de verdade:** O Core é a única autoridade; a UI do dashboard reflecte estado, não explica nem mistura marketing com operação.

---

Última atualização: Core Crystallization (Phase 1 + Phase 5); contrato OPERATIONAL_DASHBOARD_V2 (primeira/segunda dobra, regra do menu, sidebar fonte/hierarquia); `npm test -- --ci` passa com zero falhas.
