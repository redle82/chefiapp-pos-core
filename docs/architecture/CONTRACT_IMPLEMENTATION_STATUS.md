# Estado de Implementação dos Contratos — Lei → Código → Runtime

**Propósito:** Cada contrato declara **onde está aplicado no código** ou **ainda não implementado**. Fecha o ciclo: Lei → Enforcement → Código → Runtime.

**Referências:** [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) (índice), [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) (mapeamento detalhado).

**Legenda:**
- **✅ Implementado** — Regra aplicada em código; ficheiro(s) e símbolo(s) identificados.
- **🟡 Parcial** — Parte em código; resto "a evoluir" ou contaminação conhecida.
- **🔴 Só lei** — Contrato escrito; enforcement em código ainda não implementado.

---

## 0. Soberania e Reconciliação

| Contrato | Status | Onde está (ou "ainda não implementado") |
|----------|--------|-----------------------------------------|
| [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) | 🟡 | Contrato + secção Sovereignty em todos CORE_*; auditoria [FINANCIAL_CORE_VIOLATION_AUDIT](./FINANCIAL_CORE_VIOLATION_AUDIT.md); violações a migrar para Core. |
| [CORE_RECONCILIATION_CONTRACT](./CORE_RECONCILIATION_CONTRACT.md) | 🟡 | Jobs no Core (docker-core); UI só leitura de estado reconciliado. Enforcement a evoluir. |

---

## 1. UI operacional, Landing, Command Center, Web Pública

| Contrato | Status | Onde está (ou "ainda não implementado") |
|----------|--------|-----------------------------------------|
| [CORE_OPERATIONAL_UI_CONTRACT](./CORE_OPERATIONAL_UI_CONTRACT.md) | ✅ | `OperationalShell.tsx`, `PanelRoot.tsx`, `DashboardPortal.tsx`, `MenuBuilderPanel.tsx` (PanelRoot + variant panel). |
| [CORE_LANDING_ROUTES_CONTRACT](./CORE_LANDING_ROUTES_CONTRACT.md) | ✅ | `App.tsx` (rotas); `Hero.tsx`, `Footer.tsx`, `Demonstration.tsx`, `HowItWorks.tsx`, `FAQ.tsx` (destinos). |
| [CORE_WEB_COMMAND_CENTER_CONTRACT](./CORE_WEB_COMMAND_CENTER_CONTRACT.md) | 🟡 | `DashboardPortal`: activeModule, TreeSection, ActiveModuleContent; estrutura existe; árvore SystemTree/WorkTree a alinhar ao contrato. |
| [CORE_PUBLIC_WEB_CONTRACT](../contracts/CORE_PUBLIC_WEB_CONTRACT.md) | ✅ | `App.tsx` (rotas `/public/*`); `PublicWebPage.tsx`, `TablePage.tsx`, `CustomerOrderStatusView.tsx`; auditado sem links internos. |

---

## 2. Tarefas, AppStaff, KDS, TPV

| Contrato | Status | Onde está (ou "ainda não implementado") |
|----------|--------|-----------------------------------------|
| [CORE_TASK_SYSTEM_CONTRACT](./CORE_TASK_SYSTEM_CONTRACT.md) / [CORE_TASK_EXECUTION_CONTRACT](./CORE_TASK_EXECUTION_CONTRACT.md) | 🟡 | TaskPanel não gera tarefas; TaskReader, OrderReader; criação via Core/gerente a evoluir; KDS tarefas operacionais a evoluir. |
| [CORE_APPSTAFF_CONTRACT](./CORE_APPSTAFF_CONTRACT.md) + subcontratos | 🟡 | Rotas `/garcom` → AppStaffMobileOnlyPage; mobile-app bloqueia web; terminal em mobile-app (Expo); TaskPanel em KDSMinimal. |
| [CORE_KDS_CONTRACT](./CORE_KDS_CONTRACT.md) | ✅ | KDSMinimal, MiniKDSMinimal; OrderReader, OrderItems; sem fila/prioridade local. |
| [CORE_TPV_BEHAVIOUR_CONTRACT](./CORE_TPV_BEHAVIOUR_CONTRACT.md) | ✅ | TPVMinimal, MiniTPVMinimal; criação/edição via Core/API; readers; CashRegister + executeSafe. |

---

## 3. Billing, Banco, Multi-tenant

| Contrato | Status | Onde está (ou "ainda não implementado") |
|----------|--------|-----------------------------------------|
| [CORE_BILLING_AND_PAYMENTS_CONTRACT](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) | 🟡 | coreBillingApi.ts, BillingBroker → Core; BillingConfigPanel; PaymentGuard/FlowGate ainda leem billing_status via Supabase (contaminação). |
| [DATABASE_AUTHORITY](./DATABASE_AUTHORITY.md) / [MENU_CONTRACT](./MENU_CONTRACT.md) | ✅ | Migrações em `docker-core/schema/migrations/`, `supabase/migrations/`; readers em `core-boundary/readers/`. |
| [TENANCY_KERNEL_CONTRACT](./TENANCY_KERNEL_CONTRACT.md) | ✅ | Kernel, EventExecutor, Repo, EventStore; readers com restaurantId. |

---

## 4. Impressão, Offline, Design System

| Contrato | Status | Onde está (ou "ainda não implementado") |
|----------|--------|-----------------------------------------|
| [CORE_PRINT_CONTRACT](./CORE_PRINT_CONTRACT.md) | 🔴 | Ainda não implementado. Enforcement quando houver driver/fila/API real. |
| [CORE_OFFLINE_CONTRACT](./CORE_OFFLINE_CONTRACT.md) | 🟡 | SyncEngine: classifyFailure, critical → dead_letter, retry com backoff. Fila/UI de estado a evoluir. |
| [CORE_DESIGN_SYSTEM_CONTRACT](./CORE_DESIGN_SYSTEM_CONTRACT.md) | ✅ | core-design-system: tokens.ts, typography.ts, spacing.ts, tokens.css; [DESIGN_SYSTEM_COVERAGE](./DESIGN_SYSTEM_COVERAGE.md), [DESIGN_SYSTEM_ENFORCEMENT_LOOP](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md). |
| [CORE_DESIGN_IMPLEMENTATION_POLICY](./CORE_DESIGN_IMPLEMENTATION_POLICY.md) | 🔴 | Política documentada; nenhum componente trata DS como contrato. Enforcement = erro conceitual se violado. |

---

## 5. Modelo de falha e leis invisíveis

| Contrato | Status | Onde está (ou "ainda não implementado") |
|----------|--------|-----------------------------------------|
| [CORE_FAILURE_MODEL](./CORE_FAILURE_MODEL.md) | ✅ | FailureClassifier.classifyFailure; KernelContext executeSafe; ProductContext, SyncEngine, OrderProcessingService, CashRegister, MenuBootstrapService, OrderContextReal, TPV (failureClass). |
| [CORE_TRUTH_HIERARCHY](./CORE_TRUTH_HIERARCHY.md) | 🟡 | Readers/Kernel expõem estado; UI "sincronizando" / "último estado conhecido". Implementação a evoluir. |
| [CORE_TIME_GOVERNANCE_CONTRACT](./CORE_TIME_GOVERNANCE_CONTRACT.md) | 🟡 | Métricas de atraso (ex. 15 min); SLA no Core. Valores concretos a evoluir. |
| [CORE_SYSTEM_AWARENESS_MODEL](./CORE_SYSTEM_AWARENESS_MODEL.md) | 🟡 | Ainda não implementado. Indicadores de frescura e heartbeat a evoluir. |
| [CORE_OVERRIDE_AND_AUTHORITY_CONTRACT](./CORE_OVERRIDE_AND_AUTHORITY_CONTRACT.md) | 🟡 | RoleGate, guards; override/audit a evoluir. |
| [CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT](./CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT.md) | 🟡 | Ainda não implementado. Versioning/flags a evoluir. |
| [CORE_SILENCE_AND_NOISE_POLICY](./CORE_SILENCE_AND_NOISE_POLICY.md) | 🟡 | Ainda não implementado. Limiares N/M/K no Core a evoluir. |
| [CORE_OPERATIONAL_GOVERNANCE_CONTRACT](./CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md) | 🟡 | Contrato definido; visibilidade por papel e incidentes a evoluir. |

---

## 6. Soberania operacional (Instalação, Identidade, Heartbeat, Retenção, Bootstrap)

| Contrato | Status | Onde está (ou "ainda não implementado") |
|----------|--------|-----------------------------------------|
| [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md) | 🔴 | Ainda não implementado. Enforcement quando houver fluxo de provisionamento/registro de terminal. |
| [CORE_IDENTITY_AND_TRUST_CONTRACT](./CORE_IDENTITY_AND_TRUST_CONTRACT.md) | 🔴 | Ainda não implementado. Enforcement quando houver validação de identidade/chave de terminal no Core. |
| [CORE_HEARTBEAT_AND_LIVENESS_CONTRACT](./CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md) | 🔴 | Ainda não implementado. Enforcement quando Command Center/terminais enviarem heartbeat; estado online/offline via Core. |
| [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) | 🟡 | Políticas no Core; migrações/constraints; UI não purga. Enforcement a evoluir. |
| [BOOTSTRAP_KERNEL](./BOOTSTRAP_KERNEL.md) | 🟡 | Documento SYSTEM_STATE e estado ao arranque; BootstrapKernel/init no código a evoluir. |

---

## Resumo

| Status | Contagem | Significado |
|--------|----------|-------------|
| ✅ Implementado | 10 | Lei aplicada em código; ficheiro+símbolo identificados. |
| 🟡 Parcial | 18 | Parte em código; resto ou contaminação a evoluir. |
| 🔴 Só lei | 4 | Contrato escrito; enforcement ainda não implementado. |

**Atualizar este ficheiro** quando novo código aplicar um contrato ou quando um 🟡/🔴 passar a ✅. Manter alinhado com [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md).
