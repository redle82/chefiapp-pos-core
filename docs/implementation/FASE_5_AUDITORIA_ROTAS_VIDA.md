# Auditoria de rotas — Vida do Restaurante (Opção C, v2)

Listagem de rotas e fase(s) em que cada uma é permitida, conforme [CONTRATO_VIDA_RESTAURANTE](../contracts/CONTRATO_VIDA_RESTAURANTE.md) (v2) e [LifecycleState.ts](../../merchant-portal/src/core/lifecycle/LifecycleState.ts).

**Referência:** Plano Opção A (implementado) → Opção B (Bootstrap linear, implementado) → **Opção C (esta auditoria)**. **v2:** Eliminados DEMO_GUIDED e DEMO_FINISHED; fluxo único Landing → Auth → Bootstrap → Operação.

---

## 1. Matriz contrato (resumo)

| Fase                      | Rotas permitidas (código)                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| **VISITOR**               | `/`, `/landing`, `/pricing`, `/features`, `/demo-guiado`, `/demo`, `/auth`, `/help/start-local` |
| **BOOTSTRAP_REQUIRED**    | `/bootstrap`, `/auth`, `/onboarding/first-product`                                              |
| **BOOTSTRAP_IN_PROGRESS** | `/bootstrap`, `/auth`, `/onboarding/first-product`                                              |
| **READY_TO_OPERATE**      | Todas (após bootstrap concluído)                                                                |

---

## 2. Rotas fora do FlowGate (definidas antes de `/*`)

Estas rotas são resolvidas pelo React Router antes de entrar no `AppOperationalWrapper` (FlowGate). O lifecycle não bloqueia o render; redirecionamentos para estas rotas são feitos pelo contrato quando o estado exige (ex.: VISITOR → `/` ou `/auth`).

| Rota                | Permitida em (fase)                                | Notas                                                                                   |
| ------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `/`                 | VISITOR                                            | Landing canónica                                                                        |
| `/landing`          | VISITOR                                            | Redirect → `/`                                                                          |
| `/app/demo-tpv`     | —                                                  | Só acessível se entrar por `/*`; na prática VISITOR pode aceder via link (fora do gate) |
| `/pricing`          | VISITOR                                            |                                                                                         |
| `/features`         | VISITOR                                            |                                                                                         |
| `/demo`             | VISITOR                                            | Redirect → `/auth`; DemoTourPage se mantida noutra rota                                 |
| `/demo-guiado`      | VISITOR                                            | Demo guiado 3 min; ao sair → `/auth`                                                    |
| `/login`            | VISITOR                                            | Redirect → `/auth`                                                                      |
| `/signup`           | VISITOR                                            | Redirect → `/auth?mode=signup`                                                          |
| `/forgot-password`  | VISITOR                                            | Redirect → `/auth`                                                                      |
| `/auth`             | VISITOR, BOOTSTRAP_REQUIRED, BOOTSTRAP_IN_PROGRESS | Auth + logout                                                                           |
| `/bootstrap`        | BOOTSTRAP_REQUIRED, BOOTSTRAP_IN_PROGRESS          | Definida aqui e dentro de `/*`; match explícito tem prioridade                          |
| `/billing/success`  | —                                                  | Pago; tipicamente READY_TO_OPERATE ou após fluxo Stripe                                 |
| `/op/tpv`           | —                                                  | Handler: demo → TPVDemoPage; senão → AppOperationalWrapper (FlowGate)                   |
| `/help/start-local` | VISITOR                                            |                                                                                         |

---

## 3. Rotas dentro do FlowGate (sob `/*`)

Quem entra nestas rotas passa pelo FlowGate. Se o estado atual não permitir a rota, o utilizador é redirecionado para o destino canónico da fase.

### 3.1 Bootstrap e seleção de tenant

| Rota                 | Permitida em (fase)                           | Notas                            |
| -------------------- | --------------------------------------------- | -------------------------------- |
| `/bootstrap`         | BOOTSTRAP_REQUIRED, BOOTSTRAP_IN_PROGRESS     | Passo 1 de 2                     |
| `/app/select-tenant` | READY_TO_OPERATE (exceção: tenant não selado) | TENANT_EXEMPT_ROUTES no FlowGate |
| `/app`               | READY_TO_OPERATE                              | Redirect → `/app/dashboard`      |

### 3.2 Onboarding (bootstrap passo 2)

| Rota                        | Permitida em (fase)                     | Notas                          |
| --------------------------- | --------------------------------------- | ------------------------------ |
| `/onboarding/first-product` | BOOTSTRAP_IN_PROGRESS, READY_TO_OPERATE | Passo 2 de 2; concluir → READY |

### 3.3 Operação (TPV, KDS, Staff, etc.)

| Rota                    | Permitida em (fase) | Notas                              |
| ----------------------- | ------------------- | ---------------------------------- |
| `/op/tpv`               | READY_TO_OPERATE    | RequireOperational, ModuleGate tpv |
| `/op/kds`               | READY_TO_OPERATE    | RequireOperational, ModuleGate kds |
| `/op/cash`              | READY_TO_OPERATE    | Redirect → `/op/tpv`               |
| `/op/staff`             | READY_TO_OPERATE    | AppStaffMobileOnlyPage             |
| `/tpv`                  | READY_TO_OPERATE    | Redirect → `/op/tpv`               |
| `/kds-minimal`          | READY_TO_OPERATE    | Redirect → `/op/kds`               |
| `/garcom`               | READY_TO_OPERATE    |                                    |
| `/garcom/mesa/:tableId` | READY_TO_OPERATE    |                                    |
| `/tpv-test`             | READY_TO_OPERATE    | DebugTPV                           |

### 3.4 Dashboard e gestão

| Rota               | Permitida em (fase) | Notas                                        |
| ------------------ | ------------------- | -------------------------------------------- |
| `/dashboard`       | READY_TO_OPERATE    | DashboardPortal                              |
| `/app/dashboard`   | READY_TO_OPERATE    | Redirect → `/dashboard`                      |
| `/app/backoffice`  | READY_TO_OPERATE    | BackofficePage                               |
| `/app/setup/*`     | READY_TO_OPERATE    | Vários redirects (menu, mesas, equipe, etc.) |
| `/menu-builder`    | READY_TO_OPERATE    |                                              |
| `/operacao`        | READY_TO_OPERATE    | RequireOperational                           |
| `/inventory-stock` | READY_TO_OPERATE    |                                              |
| `/task-system`     | READY_TO_OPERATE    |                                              |
| `/shopping-list`   | READY_TO_OPERATE    |                                              |
| `/system-tree`     | READY_TO_OPERATE    |                                              |

### 3.5 Configuração

| Rota                       | Permitida em (fase) | Notas                                    |
| -------------------------- | ------------------- | ---------------------------------------- |
| `/config`                  | READY_TO_OPERATE    | ConfigLayout; index → `/config/identity` |
| `/config/identity`         | READY_TO_OPERATE    |                                          |
| `/config/location`         | READY_TO_OPERATE    |                                          |
| `/config/location/address` | READY_TO_OPERATE    |                                          |
| `/config/location/tables`  | READY_TO_OPERATE    |                                          |
| `/config/schedule`         | READY_TO_OPERATE    |                                          |
| `/config/schedule/hours`   | READY_TO_OPERATE    |                                          |
| `/config/people`           | READY_TO_OPERATE    |                                          |
| `/config/people/employees` | READY_TO_OPERATE    |                                          |
| `/config/people/roles`     | READY_TO_OPERATE    |                                          |
| `/config/payments`         | READY_TO_OPERATE    |                                          |
| `/config/integrations`     | READY_TO_OPERATE    |                                          |
| `/config/modules`          | READY_TO_OPERATE    |                                          |
| `/config/perception`       | READY_TO_OPERATE    |                                          |
| `/config/status`           | READY_TO_OPERATE    |                                          |

### 3.6 Employee / Manager / Owner

| Rota                          | Permitida em (fase) | Notas |
| ----------------------------- | ------------------- | ----- |
| `/employee/home`              | READY_TO_OPERATE    |       |
| `/employee/tasks`             | READY_TO_OPERATE    |       |
| `/employee/operation`         | READY_TO_OPERATE    |       |
| `/employee/operation/kitchen` | READY_TO_OPERATE    |       |
| `/employee/mentor`            | READY_TO_OPERATE    |       |
| `/manager/dashboard`          | READY_TO_OPERATE    |       |
| `/manager/central`            | READY_TO_OPERATE    |       |
| `/manager/analysis`           | READY_TO_OPERATE    |       |
| `/manager/schedule`           | READY_TO_OPERATE    |       |
| `/manager/schedule/create`    | READY_TO_OPERATE    |       |
| `/manager/reservations`       | READY_TO_OPERATE    |       |
| `/owner/vision`               | READY_TO_OPERATE    |       |
| `/owner/stock`                | READY_TO_OPERATE    |       |
| `/owner/simulation`           | READY_TO_OPERATE    |       |
| `/owner/purchases`            | READY_TO_OPERATE    |       |

### 3.7 Tasks, People, Health, Alerts, Mentor, Financial, Billing, Reports

| Rota                           | Permitida em (fase) | Notas                   |
| ------------------------------ | ------------------- | ----------------------- |
| `/tasks`                       | READY_TO_OPERATE    |                         |
| `/tasks/:taskId`               | READY_TO_OPERATE    |                         |
| `/tasks/recurring`             | READY_TO_OPERATE    |                         |
| `/people`                      | READY_TO_OPERATE    |                         |
| `/people/time`                 | READY_TO_OPERATE    |                         |
| `/health`                      | READY_TO_OPERATE    |                         |
| `/alerts`                      | READY_TO_OPERATE    |                         |
| `/mentor`                      | READY_TO_OPERATE    |                         |
| `/purchases`                   | READY_TO_OPERATE    |                         |
| `/financial`                   | READY_TO_OPERATE    |                         |
| `/reservations`                | READY_TO_OPERATE    |                         |
| `/groups`                      | READY_TO_OPERATE    |                         |
| `/app/billing`                 | READY_TO_OPERATE    |                         |
| `/app/publish`                 | READY_TO_OPERATE    |                         |
| `/app/install`                 | READY_TO_OPERATE    |                         |
| `/app/reports/daily-closing`   | READY_TO_OPERATE    |                         |
| `/app/reports/sales-by-period` | READY_TO_OPERATE    |                         |
| `/app/reports/finance`         | READY_TO_OPERATE    | Redirect → `/financial` |

### 3.8 Público (slug) e fallback

| Rota                           | Permitida em (fase) | Notas                        |
| ------------------------------ | ------------------- | ---------------------------- |
| `/public/:slug`                | READY_TO_OPERATE    | PublicWebPage (menu público) |
| `/public/:slug/mesa/:number`   | READY_TO_OPERATE    | TablePage                    |
| `/public/:slug/order/:orderId` | READY_TO_OPERATE    | CustomerOrderStatusView      |
| `/public/:slug/kds`            | READY_TO_OPERATE    | PublicKDS                    |
| `/app/access-denied`           | READY_TO_OPERATE    | TENANT_EXEMPT_ROUTES         |
| `*` (fallback)                 | READY_TO_OPERATE    | CoreResetPage                |

---

## 4. Verificação contra o contrato

- **VISITOR:** Não pode aceder a `/dashboard`, `/bootstrap`, `/op/tpv`, `/config`, etc.; FlowGate redireciona para `/` (ou `/auth` se aplicável). Pode aceder a `/demo-guiado`; ao sair → `/auth`.
- **BOOTSTRAP_REQUIRED / BOOTSTRAP_IN_PROGRESS:** Só `/bootstrap`, `/auth`, `/onboarding/first-product`; tentativa de dashboard/TPV/config → redirect para `/bootstrap`.
- **READY_TO_OPERATE:** Todas as rotas operacionais e de gestão permitidas; exceções de tenant (`/app/select-tenant`, `/app/access-denied`) tratadas no FlowGate.

---

## 5. Manutenção

- Ao adicionar uma nova rota em `App.tsx` ou dentro de `AppContentWithBilling`, registar aqui e indicar em que fase(s) é permitida.
- A fonte de verdade para “rota permitida?” em código é `LifecycleState.ts` (`ROUTES_BY_STATE` + `isPathAllowedForState`). Esta auditoria é documentação e referência para suporte e revisão.

Última atualização: 2026-02-01.
