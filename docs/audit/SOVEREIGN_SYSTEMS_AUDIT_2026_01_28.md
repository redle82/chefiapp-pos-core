# Supreme Audit — ChefIApp POS Core

**Data:** 2026-01-28  
**Tipo:** Auditoria forense arquitectural total (não feature, não refactor).  
**Âmbito:** Repositório, docs, scripts, CI, estrutura de pastas.  
**Regra:** Apenas conclusões derivadas de evidência; sem invenção, sem suavização.

---

## 1. Executive Summary

O sistema é um **Restaurant Operating System** com Core financeiro soberano documentado, Kernel em código (core-engine + merchant-portal kernel), Docker Core (Postgres + PostgREST + Realtime), e quatro terminais (Web Pública, AppStaff, KDS, TPV). A **hierarquia documentada** (Kernel → Core → Contratos → Terminais) está clara; a **implementação** está parcial: o Docker Core existe e é autoridade de schema e RPCs; o frontend continua a usar Supabase como canal primário em muitos fluxos. Existem **~15 violações arquitecturais** documentadas (Supabase como autoridade para pagamentos, caixa, reconciliação, criação de tenant, etc.) e **4 contratos só em lei** (Instalação, Identidade, Heartbeat, Print). O **contract-gate** passa (todos os .md indexados e referenciados). **Pós-remediação Sprint 01 (2026-01-28):** O CI principal passou a executar testes (`npm test` com exclusão de e2e/playwright/massive) e o sovereignty-gate (`scripts/sovereignty-gate.sh`); ver [SOVEREIGN_REMEDIATION_SPRINT_01.md](./SOVEREIGN_REMEDIATION_SPRINT_01.md). A maturidade é **heterogénea**: contratos e documentação são fortes; enforcement e migração para Core Docker estão em curso; produção enterprise não está pronta sem fechar violações e testes em CI.

---

## 2. System Map (Kernel → Core → Contracts → Terminals)

| Camada | O que existe (evidência) | Autoridade |
|--------|---------------------------|------------|
| **Kernel** | `core-engine/kernel/TenantKernel.ts`, `ExecutionContext.ts`, `core-engine/executor/CoreExecutor.ts`, `event-log/`; `merchant-portal/src/core/kernel/` (BootstrapKernel, GenesisKernel, KernelContext, SurfaceRegistry, MenuAuthority, TableAuthority). Ciclo BOOTING → ACTIVE. | Código em core-engine + kernel no portal; documento BOOTSTRAP_KERNEL, KERNEL_EXECUTION_MODEL. |
| **Core (Docker)** | `docker-core/docker-compose.core.yml`: Postgres 15, PostgREST, Realtime. Schema em `docker-core/schema/core_schema.sql` e 29 migrações em `docker-core/schema/migrations/`. Porta 54320 (Postgres), 3001 (Nginx→PostgREST). | Documento CORE_FINANCIAL_SOVEREIGNTY_CONTRACT; docker-core é a stack oficial do Core. |
| **Core (lógica)** | OrderEngine (create_order_atomic), DbWriteGate, ExceptionRegistry, ReconciliationEngine, LegalBoundary, event_store, legal_seals (migração 20260128). Constraint constitucional `idx_one_open_order_per_table`; RPC `create_order_atomic` congelado (CORE_FROZEN_STATUS.md). | docs/CORE_FROZEN_STATUS.md; DATABASE_AUTHORITY (tabelas gm_*). |
| **Contratos** | CORE_CONTRACT_INDEX.md indexa 90+ documentos em docs/architecture e docs/contracts. Contract-gate (scripts/contract-gate.sh) verifica: .md não vazios, links existentes, todos indexados. CONTRACT_IMPLEMENTATION_STATUS: 10 ✅, 18 🟡, 4 🔴. | CORE_CONTRACT_INDEX.md; CONTRACT_CREATION_PROTOCOL; contract-gate em CI (branch main). |
| **Terminais** | **Web Pública:** rotas `/public/*`, PublicWebPage, TablePage (CONTRACT_ENFORCEMENT). **Web Command Center:** DashboardPortal, OperationalShell, PanelRoot, SystemTree/WorkTree (parcial). **AppStaff:** mobile-app (Expo), AppStaffMobileOnlyPage no web; StaffContext, MiniKDS, MiniTPV. **KDS:** KDSMinimal, MiniKDSMinimal. **TPV:** TPVMinimal, MiniTPVMinimal, DebugTPV. | Contratos CORE_PUBLIC_WEB_CONTRACT, CORE_APPSTAFF_CONTRACT, CORE_KDS_CONTRACT, CORE_TPV_BEHAVIOUR_CONTRACT. |

---

## 3. Strengths (what is unusually good)

- **Contrato e índice:** CORE_CONTRACT_INDEX + CONTRACT_CREATION_PROTOCOL + contract-gate em CI garantem que nenhum .md fica órfão ou não indexado; proibições explícitas (TERMINAL_REGISTRATION_CONTRACT, CORE_PAYMENT_RECONCILIATION_CONTRACT) estão documentadas e auditadas.
- **Auditoria de violações:** FINANCIAL_CORE_VIOLATION_AUDIT classifica violações (a/b/c) e lista ficheiros; roadmap de remediação com fases; PaymentGuard/FlowGate já migrados para coreBillingApi quando Docker.
- **Core congelado:** CORE_FROZEN_STATUS define schema de pedidos, constraint única por mesa aberta, RPC create_order_atomic e semântica OPEN/CLOSED/PAID como constitucionais; testes massivos (A–E) documentados.
- **Separação Billing vs Payments:** billing-core/ e gateways/ separam SaaS billing (Stripe) de pagamentos restaurante (gateway abstraction); README e state machine claros.
- **Failure Model em código:** FailureClassifier, executeSafe, failureClass em vários serviços (CONTRACT_IMPLEMENTATION_STATUS; CORE_STATE).
- **Multi-tenant e readers:** Readers com restaurantId; TENANCY_KERNEL_CONTRACT referenciado; DATABASE_AUTHORITY com regra gm_* e zona de exclusão de tabelas legadas.

---

## 4. Critical Risks (ranked)

1. **Supabase ainda é autoridade em fluxos críticos** (FINANCIAL_CORE_VIOLATION_AUDIT): PaymentEngine, CashRegister/CashRegisterProjection, OrderProjection, ReconciliationEngine, FinancialEngine, GenesisKernel, SovereigntyService, PaymentBroker/stripePayment, etc. Riscos: split-brain, inconsistência, indisponibilidade do BaaS confundida com Core.
2. **CI não roda testes de regressão:** ci.yml só executa prettier, lint (merchant-portal), typecheck, build. Nenhum `npm test` ou Jest no pipeline principal. Regressões podem entrar em main/develop.
3. **Contratos só lei (4):** CORE_INSTALLATION_AND_PROVISIONING_CONTRACT, CORE_IDENTITY_AND_TRUST_CONTRACT, CORE_HEARTBEAT_AND_LIVENESS_CONTRACT, CORE_PRINT_CONTRACT — sem enforcement. Qualquer terminal pode ser tratado como “instalado” sem provisionamento real.
4. **Bootstrap documentado vs implementado:** BOOTSTRAP_CONTRACT descreve INIT → BOOTING → RUNNING com criação de tenant root e carga de contratos; BootstrapKernel/KernelContext existem mas “a evoluir” (CONTRACT_IMPLEMENTATION_STATUS). Docker sobe Postgres/PostgREST/Realtime; não há um único “ritual” que crie tenant e valide guards em sequência canónica.
5. **Cálculo de totais no cliente:** WebOrderingService, SyncEngine (e outros) calculam totais/subtotais localmente; auditoria classifica como technical debt ou violação. Risco de divergência com Core.
6. **Duplicidade de bases de dados:** supabase/migrations (185 .sql) e docker-core/schema (core_schema + 29 migrações). Autoridade para produção (Supabase hosted vs Docker Core) não está unívoca no código.

---

## 5. Missing Pieces (explicit list)

- **Enforcement de Instalação/Identidade/Heartbeat:** Nenhum fluxo de provisionamento de terminal, validação de chave, ou heartbeat para estado online/offline no Core (CONTRACT_IMPLEMENTATION_STATUS §6).
- **Enforcement de CORE_PRINT_CONTRACT:** Nenhum driver/fila/API de impressão governada pelo Core (🔴).
- **Testes no CI:** Job de testes (Jest) não está no ci.yml; apenas core-validation (docker-tests) e contract-gate/truth-gate em workflows separados e/ou branches específicos.
- **RPCs em falta no Core Docker:** create_tenant_atomic, dequeue_reconciliation_jobs (FINANCIAL_CORE_VIOLATION_AUDIT §5).
- **Design System como contrato aplicado:** CORE_DESIGN_IMPLEMENTATION_POLICY está 🔴; nenhum componente trata DS como contrato com enforcement (CONTRACT_IMPLEMENTATION_STATUS).
- **Documento único de “qual DB em produção”:** DATABASE_AUTHORITY fala em gm_*; não diz explicitamente “em produção o Core é sempre Docker” vs “Supabase é legado”.

---

## 6. Violations (with file references)

| Tipo | Onde | Contrato / regra |
|------|------|-------------------|
| Supabase como autoridade | PaymentEngine.ts: supabase.rpc process_order_payment, process_split_payment_atomic, etc. | CORE_FINANCIAL_SOVEREIGNTY_CONTRACT |
| Idem | CashRegister.ts, CashRegisterProjection.ts: open_cash_register_atomic via Supabase | Idem |
| Idem | OrderProjection.ts: create_order_atomic via Supabase | Idem |
| Idem | ReconciliationEngine.ts: dequeue_reconciliation_jobs, gm_reconciliation_queue | CORE_RECONCILIATION_CONTRACT |
| Idem | FinancialEngine.ts: calculate_product_margin via Supabase | Soberania financeira |
| Idem | GenesisKernel.ts: create_tenant_atomic via Supabase | Soberania / bootstrap |
| Idem | SovereigntyService.ts: supabase.functions.invoke('reconcile') | CORE_RECONCILIATION_CONTRACT |
| Idem | PaymentBroker.ts, stripePayment.ts: stripe-payment via Edge Function | CORE_BILLING_AND_PAYMENTS_CONTRACT |
| Idem | SyncEngine.ts: totais calculados localmente (subtotal_cents, total_cents) | Nenhum terminal calcula totais |
| Idem | ReflexEngine.ts: reflex_firings, app_tasks insert | Core persiste operacional |
| Idem | ProductProjection.ts: upsert/update gm_products | Escrita produto = Core |
| Idem | StaffIncidentService.ts: admin_disable_staff_member RPC | Autoridade staff = Core |
| Technical debt (auth/session) | useSupabaseAuth, FlowGate, TPV, etc.: getSession/getUser | Aceitável até Core auth; não para verdade financeira |
| Legacy | verify_recipe_deduction.ts, exemplos em core-boundary | Marcados como não autoritativos |

Referência completa: docs/architecture/FINANCIAL_CORE_VIOLATION_AUDIT.md.

---

## 7. Maturity Score (0–10) per layer

| Camada | Score | Justificação |
|--------|-------|--------------|
| **Kernel** | 6 | TenantKernel, ExecutionContext, CoreExecutor existem; ciclo BOOTING→ACTIVE. Bootstrap “ritual” completo (tenant root + guards) não unificado no deploy. |
| **Core** | 6 | Docker Core com schema e RPCs; create_order_atomic e constraint constitucional congelados. Muitos fluxos ainda via Supabase; reconciliação e pagamentos não totalmente no Core. |
| **Contracts** | 8 | Índice completo, gate de integridade, proibições explícitas, auditoria referenciados. 4 contratos só lei; 18 parciais. |
| **Terminals** | 6 | Web, AppStaff, KDS, TPV existem e têm contratos; Command Center parcial; AppStaff em mobile com bloqueio web. |
| **Billing** | 5 | Separação SaaS vs restaurante clara em docs e billing-core; PaymentGuard/FlowGate usam Core quando Docker. Stripe/Edge Functions ainda usados em vários pontos (violation audit). |
| **Observability** | 4 | MONITORING_LOGGING, health checks, AlertService; sem métricas centralizadas nem SLO documentados no contrato. |
| **Evolution** | 5 | Migrações versionadas; CORE_FROZEN_STATUS e SCOPE_FREEZE; sem versioning explícito de API nem CORE_EVOLUTION_AND_COMPATIBILITY em código. |

---

## 8. Readiness Verdict

- **Prototype:** Sim — fluxos principais (pedido, caixa, KDS, web pública) existem; Core Docker pode ser usado em ambiente controlado.
- **Pilot:** Sim — com ressalvas: usar Docker Core como única autoridade no piloto; aceitar Supabase apenas para auth/session onde documentado como technical debt; não depender de Instalação/Heartbeat para decisões.
- **Production (Small):** Não — sem testes no CI; violações de soberania ainda em uso; 4 contratos críticos (instalação, identidade, heartbeat, print) sem enforcement.
- **Production (Enterprise):** Não — além do acima: multi-tenant e isolamento precisam de validação contínua; evolução e compatibilidade não governadas em código.

---

## 9. Recommended Next 3 Moves (only 3)

1. **Incluir testes no CI principal:** Adicionar um job em `.github/workflows/ci.yml` que execute `npm test` (ou um subset estável com timeout razoável). Falhar o pipeline se os testes falharem. Reduz risco de regressão em cada PR.
2. **Remover uma violação crítica de soberania por sprint:** Escolher uma das: (a) OrderProjection + SyncEngine usarem apenas Core RPC para create_order e totais; (b) CashRegister/CashRegisterProjection chamarem apenas Core para open_cash_register_atomic; (c) ReconciliationEngine ser executado apenas no Core (job no Docker) e UI só ler estado. Documentar no FINANCIAL_CORE_VIOLATION_AUDIT como “remediado”.
3. **Documentar e automatizar “Core = Docker em produção”:** Um único doc (ou secção em DATABASE_AUTHORITY / DEPLOYMENT_GUIDE) que diga: em produção, o Financial Core é o Docker Core (Postgres + PostgREST + Realtime); Supabase é usado apenas para X, Y, Z (lista explícita). Opcional: script ou check que falhe se código chamar Supabase para operações listadas como “apenas Core”.

---

## 10. Final Verdict

O ChefIApp POS Core tem uma **arquitectura documentada e coerente** (Kernel → Core → Contratos → Terminais), um **Docker Core real** com schema e RPCs congelados, e um **sistema de contratos** com índice, gate e auditoria de violações. A **implementação está atrás da lei**: o frontend ainda usa Supabase como autoridade em pagamentos, caixa, reconciliação e criação de tenant; o CI não roda testes; quatro contratos (instalação, identidade, heartbeat, impressão) existem só no papel. O sistema é **utilizável em piloto** com Docker Core como autoridade e Supabase restrito ao que está classificado como technical debt, mas **não está pronto para produção pequena ou enterprise** sem fechar violações críticas, colocar testes no pipeline e implementar pelo menos um dos contratos de soberania operacional (instalação ou heartbeat). A auditoria é utilizável para due diligence, handoff de CTO e revisão de segurança desde que se assuma explicitamente o estado “piloto com dívida técnica conhecida”.

---

*Fim do relatório. Todas as conclusões são baseadas em ficheiros e referências listadas neste documento.*
