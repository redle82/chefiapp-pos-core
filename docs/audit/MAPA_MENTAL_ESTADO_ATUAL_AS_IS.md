# Mapa Mental — Estado Atual (AS-IS) ChefIApp

> ⚠️ **PARTIALLY SUPERSEDED** — Referências a `AppDomainWrapper` são históricas. Componente eliminado em PR-G (refactor/boot-pipeline). Lógica de tenant selection vive em `TenantContext`.

**Data:** 2026-01-31
**Propósito:** Orientação arquitetural e decisão técnica. O que funciona, o que está fragmentado, onde não tocar.
**Escopo:** merchant-portal + docker-core + contratos + testes. Sem propor novas features. Sem alterar código.

---

## 1) PUBLIC (Landing)

### A) Estado geral

**✅ FECHADO** — Camada estável e isolada. Não carrega Runtime nem Core. Contrato cumprido.

### B) Rotas existentes

| Rota               | Existe? | Estável? | Observações                    |
| ------------------ | ------- | -------- | ------------------------------ |
| `/`                | ✅      | ✅       | LandingPage                    |
| `/pricing`         | ✅      | ✅       | PricingPage                    |
| `/features`        | ✅      | ✅       | FeaturesPage                   |
| `/demo`            | ✅      | ✅       | DemoTourPage                   |
| `/login`           | ✅      | ✅       | Redirect → `/auth`             |
| `/signup`          | ✅      | ✅       | Redirect → `/auth?mode=signup` |
| `/forgot-password` | ✅      | ✅       | Redirect → `/auth`             |

Todas as rotas PUBLIC estão **fora** de `AppWithRuntime` (sem RestaurantRuntimeProvider, ShiftProvider, etc.).

### C) Componentes-chave

- **Páginas:** LandingPage, PricingPage, FeaturesPage, DemoTourPage.
- **Providers:** Nenhum (apenas Router).
- **Gates:** Nenhum.

### D) Contratos relacionados

- [PUBLIC_SITE_CONTRACT.md](../architecture/PUBLIC_SITE_CONTRACT.md) — cobre rotas, regra “nunca Core”.
- [APPLICATION_BOOT_CONTRACT.md](../architecture/APPLICATION_BOOT_CONTRACT.md) — modo PUBLIC.
- [ROTAS_E_CONTRATOS.md](../architecture/ROTAS_E_CONTRATOS.md) — índice.

**Lacunas:** Nenhuma relevante para esta camada.

### E) Testes

- **Existem?** Não dedicados à camada PUBLIC (nenhum spec de Landing/Pricing/Features/Demo).
- **Tipo:** —
- **Cobertura:** Nula para páginas públicas.

### F) Alertas

- **Onde NÃO mexer:** Não carregar Runtime, RestaurantContext ou Core em nenhuma rota listada acima. Qualquer fetch a dados do restaurante aqui = violação de contrato.
- **Efeito cascata:** Alterar estrutura de rotas públicas pode quebrar CTAs (/signup, /auth, /demo) referenciados em docs e landing.

---

## 2) AUTH (Login / Signup)

### A) Estado geral

**✅ FECHADO** — Login e signup funcionam. Destino pós-auth: `/app/dashboard`. Rotas `/bootstrap` e `/app/select-tenant` existem e fecham o fluxo de criação de restaurante.

### B) Rotas existentes

| Rota               | Existe? | Estável? | Observações                                    |
| ------------------ | ------- | -------- | ---------------------------------------------- |
| `/auth`            | ✅      | ✅       | AuthPage (login + signup)                      |
| `/login`           | ✅      | ✅       | Redirect → `/auth`                             |
| `/signup`          | ✅      | ✅       | Redirect → `/auth?mode=signup`                 |
| `/forgot-password` | ✅      | ✅       | Redirect → `/auth`                             |
| `/billing/success` | ✅      | ✅       | BillingSuccessPage (rota pública, sem Runtime) |

Rotas de criação de restaurante (pós-signup):
| Rota | Existe? | Estável? | Observações |
|------|---------|----------|-------------|
| `/bootstrap` | ✅ | 🟡 | BootstrapPage; cria restaurante + owner; recém-exposta. |
| `/app/select-tenant` | ✅ | 🟡 | SelectTenantPage; 0 → /bootstrap, 1 → auto-select, >1 → lista; recém-exposta. |

### C) Componentes-chave

- **Páginas:** AuthPage, BillingSuccessPage, BootstrapPage, SelectTenantPage.
- **Providers:** Nenhum específico de AUTH (AuthPage não está dentro de TenantProvider; `/bootstrap` e `/app/select-tenant` estão dentro de AppWithRuntime com TenantProvider).
- **Gates:** Nenhum na camada AUTH.

### D) Contratos relacionados

- [AUTH_AND_ENTRY_CONTRACT.md](../architecture/AUTH_AND_ENTRY_CONTRACT.md) — login/signup → sempre `/app/dashboard`.
- [APPLICATION_BOOT_CONTRACT.md](../architecture/APPLICATION_BOOT_CONTRACT.md) — modo AUTH.
- **Lacunas:** Contrato dedicado a bootstrap e seleção de tenant não existe (RESTAURANT_CREATION_AND_BOOTSTRAP, TENANT_SELECTION sugeridos na auditoria). ROTAS_E_CONTRATOS e CORE_RUNTIME_AND_ROUTES não listam ainda `/bootstrap` e `/app/select-tenant`.

### E) Testes

- **Existem?** Não dedicados a AuthPage, BootstrapPage ou SelectTenantPage.
- **Tipo:** —
- **Cobertura:** Nula para fluxo de auth e criação de restaurante.

### F) Alertas

- **Onde NÃO mexer:** Não alterar destino pós-login (deve ser `/app/dashboard`). Não remover rotas `/bootstrap` e `/app/select-tenant` sem substituir fluxo de criação de restaurante.
- **Efeito cascata:** Alterar AuthPage (backend de auth, redirect) impacta todo o fluxo de entrada. BootstrapPage e SelectTenantPage dependem de TenantProvider na árvore.

---

## 3) MANAGEMENT (/app)

### A) Estado geral

**🟡 FUNCIONA MAS FRÁGIL** — Muitas rotas e páginas. Portal de gestão completo para quem já tem tenant. Fluxo dependente de TenantProvider + RoleGate. **FlowGate não está na árvore** (existe em código e docs como “Executor”; não é renderizado em App.tsx). Decisões de tenant e redirecionamento dependem de TenantContext + AppDomainWrapper (quando usado), não de FlowGate.

### B) Rotas existentes

| Rota                                                                                    | Existe? | Estável? | Observações                                               |
| --------------------------------------------------------------------------------------- | ------- | -------- | --------------------------------------------------------- |
| `/app/dashboard`                                                                        | ✅      | ✅       | Redirect → `/dashboard`                                   |
| `/dashboard`                                                                            | ✅      | ✅       | DashboardPortal (hub principal)                           |
| `/app/billing`                                                                          | ✅      | ✅       | BillingPage (ManagementAdvisor)                           |
| `/app/publish`                                                                          | ✅      | ✅       | PublishPage (ManagementAdvisor)                           |
| `/app/install`                                                                          | ✅      | ✅       | InstallPage (ManagementAdvisor)                           |
| `/app/backoffice`                                                                       | ✅      | 🟡       | BackofficePage (ManagementAdvisor)                        |
| `/app/setup/*`                                                                          | ✅      | ✅       | Redirects para /menu-builder, /operacao, /config/_, /op/_ |
| `/config`, `/config/identity`, `/config/location`, …                                    | ✅      | ✅       | ConfigLayout + várias Config\*Page                        |
| `/menu-builder`                                                                         | ✅      | ✅       | MenuBuilderMinimal                                        |
| `/operacao`                                                                             | ✅      | 🟡       | RequireOperational + OperacaoMinimal                      |
| `/inventory-stock`, `/task-system`, `/shopping-list`                                    | ✅      | 🟡       | Páginas mínimas                                           |
| `/employee/*`, `/manager/*`, `/owner/*`                                                 | ✅      | 🟡       | ManagementAdvisor + páginas por papel                     |
| `/tasks`, `/tasks/:taskId`, `/tasks/recurring`                                          | ✅      | 🟡       | TaskDashboardPage, etc.                                   |
| `/people`, `/people/time`                                                               | ✅      | 🟡       | PeopleDashboardPage, TimeTrackingPage                     |
| `/health`, `/alerts`, `/mentor`, `/purchases`, `/financial`, `/reservations`, `/groups` | ✅      | 🟡       | Várias dashboards                                         |
| `/system-tree`                                                                          | ✅      | 🟡       | SystemTreePage                                            |

Todas as rotas MANAGEMENT estão **dentro** de `RoleGate` (exceto `/bootstrap` e `/app/select-tenant`, que estão fora do RoleGate).

### C) Componentes-chave

- **Páginas:** DashboardPortal, BillingPage, PublishPage, InstallPage, Config\*Page, múltiplas páginas de perfil (Employee, Manager, Owner) e domínio (tasks, people, health, etc.).
- **Providers:** RestaurantRuntimeProvider, ShiftProvider, RoleProvider, TenantProvider (todos em AppWithRuntime).
- **Gates:** RoleGate (bloqueia por papel; redireciona staff para /garcom, outros para /dashboard). **FlowGate não está na árvore.**

### D) Contratos relacionados

- [PORTAL_MANAGEMENT_CONTRACT.md](../architecture/PORTAL_MANAGEMENT_CONTRACT.md) — gestão, nunca bloqueia.
- [MANAGEMENT_ADVISOR_CONTRACT.md](../architecture/MANAGEMENT_ADVISOR_CONTRACT.md) — banners/checklists.
- [RESTAURANT_LIFECYCLE_CONTRACT.md](../architecture/RESTAURANT_LIFECYCLE_CONTRACT.md) — configured / published / operational.
- [READY_TO_PUBLISH_CHECKLIST.md](../architecture/READY_TO_PUBLISH_CHECKLIST.md) — checklist publicar.
- [BILLING_SUSPENSION_CONTRACT.md](../architecture/BILLING_SUSPENSION_CONTRACT.md) — estados de billing (gate em /op/\* não aplica billing ainda).
- **Lacunas:** ROTAS_E_CONTRATOS não lista `/bootstrap` nem `/app/select-tenant`. Contrato de bootstrap/tenant em falta.

### E) Testes

- **Existem?** Parcial. ConfigSidebar tem teste (ConfigSidebar.test.tsx). Nenhum teste de BillingPage, PublishPage, DashboardPortal, Config identity/location.
- **Tipo:** Unit (Vitest) para ConfigSidebar; contract.spec.ts para OnboardingEngine (contrato operacional).
- **Cobertura:** Baixa para MANAGEMENT.

### F) Alertas

- **Onde NÃO mexer:** Não remover RoleGate nem alterar ordem de providers (RestaurantRuntime → Shift → Role → Tenant → ShiftGuard → Routes). Não introduzir bloqueio de acesso ao portal por billing (contrato: billing não bloqueia configuração).
- **Efeito cascata:** Alterar RoleGate ou rolePermissions afeta todas as rotas dentro do RoleGate. Alterar DashboardPortal ou ConfigLayout impacta navegação e links em toda a app.

---

## 4) OPERATIONAL (/op)

### A) Estado geral

**✅ FECHADO** — TPV e KDS protegidos por RequireOperational. Gate verifica apenas `isPublished` (não `billingStatus`). Rotas explícitas e redirects legados consistentes.

### B) Rotas existentes

| Rota                               | Existe? | Estável? | Observações                                                    |
| ---------------------------------- | ------- | -------- | -------------------------------------------------------------- |
| `/op/tpv`                          | ✅      | ✅       | RequireOperational + OperationalFullscreenWrapper + TPVMinimal |
| `/op/kds`                          | ✅      | ✅       | RequireOperational + OperationalFullscreenWrapper + KDSMinimal |
| `/op/cash`                         | ✅      | ✅       | Redirect → `/op/tpv`                                           |
| `/op/staff`                        | ✅      | 🟡       | AppStaffMobileOnlyPage                                         |
| `/tpv`                             | ✅      | ✅       | Redirect → `/op/tpv`                                           |
| `/kds-minimal`                     | ✅      | ✅       | Redirect → `/op/kds`                                           |
| `/tpv-test`                        | ✅      | 🟡       | RequireOperational + DebugTPV                                  |
| `/garcom`, `/garcom/mesa/:tableId` | ✅      | 🟡       | AppStaffMobileOnlyPage                                         |

### C) Componentes-chave

- **Páginas:** TPVMinimal, KDSMinimal, OperacaoMinimal, AppStaffMobileOnlyPage, DebugTPV.
- **Providers:** Os mesmos de AppWithRuntime; OperationalFullscreenWrapper envolve TPV/KDS.
- **Gates:** RequireOperational (bloqueia se `!runtime.isPublished`; redireciona para `/dashboard` com mensagem). **Não verifica billingStatus** (BILLING_SUSPENSION_CONTRACT exige bloqueio por past_due/suspended).

### D) Contratos relacionados

- [OPERATIONAL_ROUTES_CONTRACT.md](../architecture/OPERATIONAL_ROUTES_CONTRACT.md) — rotas /op/\*.
- [OPERATIONAL_GATES_CONTRACT.md](../architecture/OPERATIONAL_GATES_CONTRACT.md) — published para TPV/KDS.
- [CASH_REGISTER_LIFECYCLE_CONTRACT.md](../architecture/CASH_REGISTER_LIFECYCLE_CONTRACT.md) — operational para caixa.
- [OPERATIONAL_INSTALLATION_CONTRACT.md](../architecture/OPERATIONAL_INSTALLATION_CONTRACT.md), [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](../architecture/OPERATIONAL_INSTALL_FLOW_CONTRACT.md) — instalação Web App.
- [CORE_TPV_BEHAVIOUR_CONTRACT.md](../architecture/CORE_TPV_BEHAVIOUR_CONTRACT.md), [CORE_KDS_CONTRACT.md](../architecture/CORE_KDS_CONTRACT.md) — comportamento TPV/KDS.
- **Lacunas:** RequireOperational não aplica BILLING_SUSPENSION_CONTRACT (falta checagem billing).

### E) Testes

- **Existem?** Parcial. OperationGate.test.tsx (gate operacional). KDS.test.tsx. canon.spec.ts (Playwright) aponta para `/app/staff` (nervous system). Nenhum E2E dedicado a /op/tpv ou /op/kds no repo.
- **Tipo:** Unit (Vitest) para OperationGate; Playwright para canon.
- **Cobertura:** Baixa para fluxo completo TPV/KDS.

### F) Alertas

- **Onde NÃO mexer:** Não remover RequireOperational nem alterar a condição de published. Não expor TPV/KDS sem gate. Alterar OperationalFullscreenWrapper afeta UX de /op/tpv e /op/kds.
- **Efeito cascata:** Alterar RequireOperational impacta todas as rotas que o usam. Alterar RestaurantRuntimeContext (isPublished) impacta gates.

---

## 5) CORE

### A) Estado geral

**✅ FECHADO** (esquema e autoridade) — docker-core é a fonte de verdade para dados do restaurante (gm_restaurants, gm_restaurant_members, installed_modules, restaurant_setup_status, etc.). PostgREST. Migrations e seeds definidos. Nenhuma lógica de UI no Core.

### B) “Rotas” (API)

- PostgREST sobre tabelas e RPCs (ex.: gm_restaurants, gm_restaurant_members, installed_modules, restaurant_setup_status, orders, etc.).
- merchant-portal acessa via core-boundary (RuntimeReader, RuntimeWriter, RestaurantReader, DbWriteGate, dockerCoreClient).

### C) Componentes-chave (boundary)

- **Leitura:** RuntimeReader, RestaurantReader, OrderReader, TaskReader, MapReader, ProductReader, ShiftReader, PulseReader.
- **Escrita:** RuntimeWriter (upsertSetupStatus, setRestaurantStatus, setProductMode, insertInstalledModule). **Não expõe criação de restaurante** (INSERT gm_restaurants só em BootstrapPage via DbWriteGate).
- **Conexão:** docker-core/connection.ts (dockerCoreClient). coreBillingApi (billing_status).

### D) Contratos relacionados

- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](../architecture/CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — Docker Core soberano.
- [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md) — rotas oficiais e runtime.
- [CORE_RECONCILIATION_CONTRACT.md](../architecture/CORE_RECONCILIATION_CONTRACT.md) — reconciliação.
- [CLOSED_PILOT_CONTRACT.md](../architecture/CLOSED_PILOT_CONTRACT.md) — escopo piloto.
- Vários CORE\_\* (KDS, TPV, PUBLIC_WEB, etc.).
- **Lacunas:** Nenhum RPC “create_restaurant” no Core; criação feita pelo cliente (BootstrapPage + DbWriteGate).

### E) Testes

- **Existem?** Não testes de integração contra docker-core no mapa (scripts de verificação existem, ex.: verify\_\*, diagnose_db).
- **Tipo:** —
- **Cobertura:** Depende de testes E2E ou manuais contra Core ativo.

### F) Alertas

- **Onde NÃO mexer:** Não mover persistência financeira/operacional para fora do Core (ex.: Supabase/Firebase como fonte de verdade para pedidos/caixa). Não alterar esquema sem migrations. Não criar rotas no merchant-portal que contornem o boundary.
- **Efeito cascata:** Alterar schema ou RPCs no docker-core exige atualizar RuntimeReader, RuntimeWriter e qualquer cliente que os use.

---

## 6) INFRA (Runtime, Providers, Gates)

### A) Estado geral

**🟡 FRAGMENTADO** — Providers (RestaurantRuntime, Shift, Role, Tenant) estão na árvore e fecham o fluxo. **FlowGate não está na árvore** (existe em código, referenciado em FLOW_CORE.md e comentários como “Executor”; nunca é renderizado em App.tsx). RequireApp existe mas não aparece em App.tsx. AppDomainWrapper usa useTenant e redireciona para /app/select-tenant quando não há tenantId, mas AppDomainWrapper não está na árvore de App.tsx (está referenciado em TPV e comentários). Lógica de “quem redireciona para bootstrap/select-tenant” vive em TenantContext + redirecionamentos internos (ex.: quando não há tenant selado), não em FlowGate.

### B) Árvore atual (App.tsx)

```
App
  Routes
    (rotas públicas: /, /pricing, /features, /demo, /auth, /billing/success, /onboarding…)
    path="*" → AppWithRuntime
      RestaurantRuntimeProvider
        ShiftProvider
          RoleProvider
            TenantProvider
              ShiftGuard
                ModeIndicator + Routes
                  /public/*, /bootstrap, /app/select-tenant
                  RoleGate
                    /op/*, /dashboard, /config, /app/*, … (resto)
                    path="*" → CoreResetPage
```

### C) Componentes-chave

- **Providers:** RestaurantRuntimeProvider, ShiftProvider, RoleProvider, TenantProvider.
- **Gates:** RoleGate (por papel), RequireOperational (published para /op/tpv, /op/kds). ShiftGuard (shift lock). **FlowGate: não na árvore.** **RequireApp: não na árvore de App.tsx.**
- **Páginas especiais:** CoreResetPage (catch-all dentro de RoleGate).

### D) Contratos relacionados

- [APPLICATION_BOOT_CONTRACT.md](../architecture/APPLICATION_BOOT_CONTRACT.md) — modos e o que inicializa.
- [BOOT_CHAIN.md](../architecture/BOOT_CHAIN.md) — cadeia de boot.
- FLOW_CORE.md (core/flow) — descreve FlowGate como Executor; FlowGate não está montado.

### E) Testes

- **Existem?** Parcial. CoreFlow.test.ts, OperationGate.test.tsx. Nenhum teste da árvore de providers (RestaurantRuntimeProvider, TenantProvider, RoleGate em conjunto).
- **Tipo:** Unit (Vitest).
- **Cobertura:** Baixa para INFRA.

### F) Alertas

- **Onde NÃO mexer:** Não remover nem reordenar providers sem rever todas as rotas que dependem de tenantId, runtime ou role. Não montar FlowGate sem alinhar com FLOW_CORE e TenantResolver (risco de duplicar lógica de redirecionamento).
- **Efeito cascata:** Alterar TenantProvider ou TenantContext afeta SelectTenantPage, AppDomainWrapper (onde usado), e qualquer useTenant(). Alterar RoleGate ou rolePermissions afeta todo o MANAGEMENT.

---

## 7) TESTS

### A) Estado geral

**🔴 FRAGMENTADO** — Alguns testes unitários e de contrato; um conjunto Playwright (canon); muitos domínios sem testes.

### B) Testes existentes (resumo)

| Ficheiro / área                               | Tipo             | Escopo                     | Cobertura            |
| --------------------------------------------- | ---------------- | -------------------------- | -------------------- |
| src/tests/canon.spec.ts                       | E2E (Playwright) | Nervous system, /app/staff | Específica           |
| src/tests/contract.spec.ts                    | Unit (Vitest)    | OnboardingEngine contract  | Contrato operacional |
| src/tests/zombie-task.spec.ts                 | Unit             | Zombie tasks               | Específica           |
| src/core/flow/CoreFlow.test.ts                | Unit             | CoreFlow                   | Resolução de rota    |
| src/core/flow/OperationGate.test.tsx          | Unit             | OperationGate              | Gate operacional     |
| src/core/roles/rolePermissions.test.ts        | Unit             | rolePermissions            | Permissões           |
| src/core/roles/normalizePath.test.ts          | Unit             | normalizePath              | Normalização path    |
| src/components/config/ConfigSidebar.test.tsx  | Unit             | ConfigSidebar              | UI config            |
| src/core/events/CoreExecutorInventory.test.ts | Unit             | CoreExecutor               | Inventário           |
| src/core/services/DashboardService.test.ts    | Unit             | DashboardService           | Serviço              |
| src/core/sync/SyncEngine.test.ts              | Unit             | SyncEngine                 | Sincronização        |
| src/core/inventory/HungerEngine.test.ts       | Unit             | HungerEngine               | Inventário           |
| src/core/inventory/RecipeMapping.test.ts      | Unit             | RecipeMapping              | Receitas             |
| src/core/sync/OfflineStressTest.test.ts       | Unit             | Offline                    | Stress               |
| src/pages/TPV/KDS/KDS.test.tsx                | Unit             | KDS                        | KDS                  |
| OrderContextReal.test.tsx.skip                | Unit (skip)      | OrderContextReal           | —                    |

### C) Onde há testes

- Contrato OnboardingEngine (contract.spec.ts).
- CoreFlow (resolução de próximo passo).
- OperationGate (bloqueio por estado operacional).
- Roles (permissions, normalizePath).
- ConfigSidebar.
- Alguns serviços e engines (Dashboard, Sync, Hunger, Recipe, CoreExecutor).
- Canon Playwright (nervous system em /app/staff).

### D) Onde NÃO há testes

- Landing, Auth, Bootstrap, SelectTenant.
- BillingPage, PublishPage, InstallPage.
- DashboardPortal, Config identity/location.
- Fluxo completo /op/tpv, /op/kds (E2E).
- FlowGate (não na árvore; sem teste de integração).
- TenantContext / TenantResolver (lógica crítica sem teste dedicado).
- RuntimeReader / RuntimeWriter (boundary com Core).

### E) Alertas

- **Onde NÃO mexer:** Não remover ou alterar contract.spec.ts sem garantir que OnboardingEngine continua a cumprir o contrato. Não desativar OperationGate.test.tsx sem substituir garantia do gate.
- **Efeito cascata:** Introduzir testes E2E para /op/\* ou auth exige ambiente (Core ativo, auth); dependências de rede e estado.

---

## Mapa Mental Resumido

### ✅ Áreas mais sólidas

- **PUBLIC (Landing):** Rotas estáveis, sem Runtime/Core, contrato claro. Pode evoluir copy/design sem risco arquitetural.
- **OPERATIONAL (/op):** Rotas fechadas, RequireOperational estável, TPV/KDS com wrapper fullscreen. Contratos alinhados (exceto billing no gate).
- **CORE (docker-core):** Esquema e migrations definidos; boundary claro (RuntimeReader, RuntimeWriter, DbWriteGate). Soberania financeira documentada.
- **AUTH + bootstrap/select-tenant:** Rotas existem; fluxo de criação de restaurante exposto. Falta apenas alinhar contratos e índices (ROTAS_E_CONTRATOS, draft vs active).

### 🟡 Áreas mais frágeis

- **MANAGEMENT (/app):** Muitas rotas e páginas; FlowGate não está na árvore; dependência de TenantProvider + RoleGate. Testes escassos.
- **INFRA (Providers/Gates):** FlowGate existe em código mas não é usado; RequireApp e AppDomainWrapper referenciados mas não na árvore de App.tsx. Fragmentação entre “quem decide” (FlowGate no doc) e “quem executa” (TenantContext + redirecionamentos).
- **TESTS:** Cobertura fragmentada; domínios críticos (auth, billing, publish, tenant) sem testes; E2E limitado a canon (/app/staff).

### 🟢 Áreas prontas para evolução

- **Contratos de bootstrap e tenant:** Criar RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT e TENANT_SELECTION_CONTRACT; atualizar ROTAS_E_CONTRATOS e CORE_RUNTIME com /bootstrap e /app/select-tenant.
- **Gate de billing:** Aplicar BILLING_SUSPENSION_CONTRACT em RequireOperational (bloquear TPV/KDS quando past_due ou suspended) sem alterar resto do fluxo.
- **Estado inicial restaurante:** Alinhar BootstrapPage com contrato (status draft) e publicação em /app/publish.
- **Testes:** Priorizar testes para SelectTenantPage, BootstrapPage, RequireOperational (com billing), e um E2E mínimo para fluxo Landing → Signup → Bootstrap → Dashboard.
- **FlowGate:** Decisão explícita: integrar FlowGate na árvore (e documentar) ou remover referências e consolidar lógica em TenantContext/redirecionamentos.

---

**Fim do mapa. Nenhuma alteração de código foi feita; documento apenas descreve o estado atual (AS-IS).**
