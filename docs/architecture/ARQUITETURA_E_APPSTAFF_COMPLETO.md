# Arquitetura completa e AppStaff — Referência única

**Status:** Referência canónica  
**Âmbito:** Sistema ChefIApp (chefiapp-pos-core) — CORE/INFRA, Merchant Portal, AppStaff, Operação.  
**Objetivo:** Documento único que descreve toda a arquitetura e o AppStaff em detalhe, para onboarding, auditoria e defesa técnica.

**Fontes:** App.tsx, docs/architecture (Canon, contratos), docs/audit (AUDITORIA_MAPA_ALINHAMENTO, AUDITORIA_APPSTAFF_SAFE_MODE), appstaff-map.pen / APPSTAFF_MAP_PEN_README.

---

## 1. Visão macro — Três setores

O sistema divide-se em três setores fixos (mapa: `docs/architecture/appstaff-map.pen`):

| Setor | Descrição | Onde vive no código |
| --- | --- | --- |
| **CORE / INFRA** | Infraestrutura técnica: Docker Core, PostgreSQL, Migrations, tabelas gm_*, Auth/Session, Runtime Context, Feature Flags, Billing/Plans. Sem telas. | docker-core, schema/migrations, contextos e serviços do merchant-portal |
| **MERCHANT PORTAL (WEB)** | Aplicação web de gestão: Auth, Setup, Config, Dashboard/Admin, Owner/Manager/Employee, Tasks, People, Billing, etc. Shells: ConfigLayout, ManagementAdvisor, DashboardLayout. | merchant-portal/src: App.tsx (rotas fora de /app/staff), pages/Config, pages/Backoffice, etc. |
| **APPSTAFF** | App operacional único: um shell, uma bottom bar. Entry único: `/app/staff`. Shell: StaffAppShellLayout. Launcher: `/app/staff/home`. Modos: operation, turn, team, tpv, kds, tasks, alerts, profile. | merchant-portal/src/pages/AppStaff e rotas sob Route path="/app/staff" em App.tsx |

**Regra:** Core → Portal (dados/serviços); Portal → AppStaff (entrada `/app/staff`). Config/people cria dados que desbloqueiam o check-in no AppStaff (gm_restaurant_people → WorkerCheckInView).

---

## 2. Boot e entry points (App.tsx)

### 2.1 Árvore de renderização (raiz)

```text
App (Routes)
  ├── Rotas públicas (sem Core): /, /landing, /pricing, /features, /auth/phone, /auth/verify, /auth/email, /bootstrap, /menu, /menu-v2, …
  └── path="/*" → AppOperationalWrapper
        └── FlowGate
              └── ShiftGuard
                    └── AppContentWithBilling
                          └── Routes (todas as rotas operacionais e Portal)
```

- **FlowGate:** Garante que o Core/lifecycle está pronto antes de mostrar conteúdo operacional.
- **ShiftGuard:** Garante contexto de turno onde aplicável.
- **AppContentWithBilling:** Bloqueio por billing (BillingBlockedView, GlobalBlockedView) para rotas críticas; resto: Routes.

### 2.2 Redirecionamentos canónicos

| Path | Redirecionamento |
| --- | --- |
| `/app` | `/app/staff/home` (entrada do app operacional único) |
| `/dashboard`, `/app/dashboard` | `/admin/reports/overview` |
| `/app/control-room` | `/app/staff/mode/operation` |
| `/login`, `/signup` | `/auth/phone` |
| `/app/staff` (index) | StaffIndexRedirect → `/app/staff/home` |

### 2.3 RoleGate

As rotas operacionais (incluindo `/app/staff`, `/op/tpv`, `/op/kds`, etc.) estão dentro de `<Route element={<RoleGate />}>`. RoleGate garante permissão de acesso por papel antes de renderizar filhos.

---

## 3. CORE / INFRA (resumo)

- **Docker Core:** Container de serviços (PostgreSQL, PostgREST, Realtime, etc.).
- **Schema:** `docker-core/schema/`, migrations em `schema/migrations/`. Tabelas principais: gm_restaurants, gm_restaurant_people, gm_staff, etc.
- **Auth/Session:** Supabase Auth; sessão utilizador e restaurante (RestaurantRuntimeContext, useRestaurantIdentity).
- **Runtime Context:** RestaurantRuntimeContext, useRestaurantRuntime — estado do restaurante e do Core.
- **Feature Flags / Billing:** useGlobalUIState, bloqueio de rotas críticas (TPV, KDS) por faturação.

Nenhuma **página** vive no setor CORE; apenas nós técnicos e dados que alimentam o Portal e o AppStaff.

---

## 4. MERCHANT PORTAL (WEB)

### 4.1 Áreas principais

| Área | Rotas (exemplos) | Layout / Shell |
| --- | --- | --- |
| **Auth** | `/auth/phone`, `/auth/verify`, `/auth/email` | Sem shell (páginas standalone) |
| **Setup** | `/bootstrap`, `/setup/restaurant-minimal` | Standalone |
| **Config** | `/config`, `/config/general`, `/config/identity`, `/config/location`, `/config/people`, `/config/schedule`, `/config/payments`, … | ConfigLayout (sidebar + outlet) |
| **Admin** | `/app/backoffice`, `/admin/*` (customers, closures, reservations, payments, reports, devices, config) | ManagementAdvisor + DashboardLayout (ou AdminConfigLayout) |
| **Owner/Manager/Employee** | `/owner/*`, `/manager/*`, `/employee/*` | ManagementAdvisor |
| **Operação (TPV/KDS fora do AppStaff)** | `/op/tpv/*`, `/op/kds` | OperationalFullscreenWrapper + ShiftGate |
| **Outros** | `/tasks`, `/people`, `/health`, `/alerts`, `/financial`, `/menu-builder`, `/inventory-stock`, `/task-system`, `/system-tree`, … | ManagementAdvisor ou standalone |

### 4.2 Config People → AppStaff

A página `/config/people` (ConfigPeoplePage, RestaurantPeopleSection) gere os dados em **gm_restaurant_people**. Esses dados são a fonte do **WorkerCheckInView** no AppStaff: sem pessoas configuradas, o operador não passa do gate de check-in. Por isso o mapa assinala: *Config/people cria dados que desbloqueiam AppStaff*.

### 4.3 Placeholders mobile

As rotas `/op/staff`, `/garcom`, `/garcom/mesa/:tableId` renderizam **AppStaffMobileOnlyPage** (placeholder para app mobile). Não montam o AppStaff real (AppStaffWrapper + Shell); são entradas alternativas para contexto “garçom” em desenvolvimento.

---

## 5. APPSTAFF — Arquitetura completa

### 5.1 Entry único e cadeia de renderização

O AppStaff real é montado **apenas** em:

```text
App.tsx
  └── Route path="/app/staff" element={<AppStaffWrapper />}
        └── AppStaffWrapper
              └── OfflineOrderProvider → OrderProvider → TableProvider
                    └── StaffModule
                          └── StaffProvider + OperatorSessionProvider
                                └── Outlet (rotas nested)
                                      └── StaffAppGate
                                            ├── [falha] → NoLocationsView | LocationSelectView | AppStaffLanding | WorkerCheckInView
                                            └── [OK]    → StaffAppShellLayout
                                                  ├── header (Top Bar fixa)
                                                  ├── main > div (ÚNICO scroll: overflow: auto)
                                                  │     └── <Outlet /> → StaffLauncherPage | OperationModePage | … | StaffProfilePage
                                                  └── nav (Bottom Bar fixa)
```

- **AppStaffWrapper** (`pages/AppStaff/AppStaffWrapper.tsx`): Entrypoint real. Envolve a árvore em OfflineOrderProvider, OrderProvider, TableProvider e renderiza StaffModule. Não usar o componente legado `AppStaff.tsx` (marcado LEGADO e fora das rotas).
- **StaffModule** (`pages/AppStaff/StaffModule.tsx`): Fornece StaffProvider e OperatorSessionProvider; aplica classes `staff-app-fullscreen` ao documento; define `document.title = "ChefIApp POS — Staff"`; renderiza Outlet (rotas filhas de /app/staff).
- **StaffAppGate** (`pages/AppStaff/routing/StaffAppGate.tsx`): Ordem de gates — **Location → Contract → Worker**. Se algum falhar, mostra a vista correspondente; senão renderiza `<Outlet />` (Shell).

### 5.2 StaffAppGate — Ordem e fallbacks

| Condição | Vista mostrada |
| --- | --- |
| `!activeLocation` e `activeLocations.length === 0` | NoLocationsView |
| `!activeLocation` e existem locais | LocationSelectView |
| `!operationalContract` | AppStaffLanding |
| `!activeWorkerId` | WorkerCheckInView |
| Tudo OK | Outlet → StaffAppShellLayout |

Em modo debug (`isDebugMode()`), o gate pode ser bypassado e ir direto ao Outlet (Shell) para inspeção visual.

### 5.3 Shell — StaffAppShellLayout

**Ficheiro:** `pages/AppStaff/routing/StaffAppShellLayout.tsx`.

**Lei (Canon):** O Shell manda na altura e no scroll. Um único content scroller. Top Bar e Bottom Nav fixos.

- **Root:** `minHeight: "100vh"`, `height: "100dvh"`, `overflow: "hidden"` — só o Shell define viewport.
- **Top Bar (header):** 48px, fixa. Mostra: botão voltar (se não for launcher), nome do perfil/role ou “ChefIApp”, local ativo, estado do turno (TURNO ATIVO / A ENCERRAR / SEM TURNO), estado operacional (OK ou N tarefas · M alertas).
- **Área central (main):** `flex: 1`, `minHeight: 0`, `overflow: "hidden"`. Dentro, um único `div` com `overflow: "auto"` (e `key={pathname}` para transição) que envolve `<Outlet />`. Todo o conteúdo das páginas (Launcher, Modos) vive aqui e rola apenas neste content scroller.
- **Bottom Nav (nav):** 56–64px, fixa. Links: Início (/app/staff/home), Operação, TPV, KDS, Mais (sheet com Turno, Tarefas, Exceções ativas, Perfil).

**Proibido (Canon):** Páginas filhas com `height: 100vh`, `minHeight: 100vh` ou `overflow: auto` no root. O scroll é único e pertence ao Shell.

### 5.4 Launcher — /app/staff/home

- **Rota:** `path="home"` com `element={<StaffAppGate><StaffAppShellLayout><Outlet /></StaffAppShellLayout></StaffAppGate>}`; index da home → StaffLauncherPage.
- **StaffLauncherPage:** Renderiza **AppStaffHome**.
- **AppStaffHome** (`pages/AppStaff/AppStaffHome.tsx`): Contrato **AppRootSurface** — launcher de modos, não dashboard. Tiles por modo (Operação, Turno, TPV, KDS, Tarefas, Exceções) com hierarquia (primário / secundário / contextual), estados visuais (● ! ✓), microfeedback `scale(0.98)` no :active (App.css `.staff-launcher-card:active`). Sem banners explicativos; sem texto longo tipo “Toque para…”. Canon: 1 palavra por tile; sem frases explicativas.

### 5.5 Modos (/app/staff/mode/* e profile)

Cada modo é uma rota que renderiza uma página dentro do Shell (mesmo content scroller). Configuração em `pages/AppStaff/routing/staffModeConfig.ts`:

| Modo | Path | Componente |
| --- | --- | --- |
| operation | `/app/staff/mode/operation` | OperationModePage (OwnerDashboard variant=app ou ManagerDashboard) |
| turn | `/app/staff/mode/turn` | ManagerTurnoPage |
| team | `/app/staff/mode/team` | ManagerEquipePage |
| tpv | `/app/staff/mode/tpv` | StaffTpvPage (MiniPOS) |
| kds | `/app/staff/mode/kds` | KitchenDisplay |
| tasks | `/app/staff/mode/tasks` | ManagerTarefasPage |
| alerts | `/app/staff/mode/alerts` | ManagerExcecoesPage |
| profile | `/app/staff/profile` | StaffProfilePage |

Modos fullScreen (tpv, kds, tasks) têm padding zero no content scroller quando aplicável. Nenhum modo define 100vh nem scroll próprio no root; todos respeitam o único scroll do Shell.

### 5.6 Gates (views intermediárias)

| Vista | Ficheiro | Função |
| --- | --- | --- |
| NoLocationsView | views/NoLocationsView.tsx | Zero locais ativos; mensagem para configurar em Config → Ubicaciones. |
| LocationSelectView | views/LocationSelectView.tsx | Escolher local quando há mais de um. |
| AppStaffLanding | AppStaffLanding.tsx | Contrato operacional não aceite; fluxo de entrada (código, tipo, pessoa). |
| WorkerCheckInView | WorkerCheckInView.tsx | Operador não escolhido; lista de pessoas (gm_restaurant_people) para check-in. |

Todas usam `flex: 1`, `minHeight: 0` no root; nenhuma usa 100vh. Semântica operacional (entrada no sistema), não onboarding pedagógico.

---

## 6. Lei do Shell e Canon visual (resumo)

- **Lei Final:** `docs/architecture/APPSTAFF_VISUAL_CANON.md`. Em conflito com código ou sugestões, o Canon vence.
- **Shell:** 100dvh/100vh + overflow hidden no root; um único scroll na área central; Top Bar e Bottom Nav fixos; páginas filhas sem 100vh/minHeight 100vh/overflow auto no root.
- **Launcher:** AppRootSurface — tiles, 1 palavra por tile, estados visuais, microfeedback; sem banners, sem textos explicativos, sem dashboard.
- **Modos:** Ferramenta em foco; sem layout de portal web; sem scroll duplicado.

Contratos subordinados: APPSTAFF_APPROOT_SURFACE_CONTRACT, APPSTAFF_HOME_LAUNCHER_CONTRACT, APPSTAFF_LAUNCHER_CONTRACT, MENU_VISUAL_RUNTIME_CONTRACT (para menu).

---

## 7. Mapa e rotas — Tabela resumida

| Setor | Rotas / nós | Shell / layout |
| --- | --- | --- |
| CORE/INFRA | (sem páginas) | — |
| MERCHANT PORTAL | /, /auth/*, /bootstrap, /config/*, /admin/*, /owner/*, /manager/*, /employee/*, /op/tpv, /op/kds, /tasks, /people, /health, /alerts, /app/billing, … | ConfigLayout, ManagementAdvisor, DashboardLayout, OperationalFullscreenWrapper |
| APPSTAFF | /app/staff, /app/staff/home, /app/staff/mode/operation, turn, team, tpv, kds, tasks, alerts, /app/staff/profile | StaffAppShellLayout (após StaffAppGate) |

Mapa visual: `docs/architecture/appstaff-map.pen`, `docs/architecture/appstaff-map.html`. Regra do mapa: 1 nó = 1 página ou componente real; setas = fluxo real.

---

## 8. Contratos e referências

| Documento | Âmbito |
| --- | --- |
| APPSTAFF_VISUAL_CANON.md | Lei Final — identidade visual do AppStaff |
| APPSTAFF_APPROOT_SURFACE_CONTRACT.md | AppRootSurface — /app/staff/home não é dashboard |
| APPSTAFF_HOME_LAUNCHER_CONTRACT.md | Launcher operacional — hierarquia, anti-patterns |
| APPSTAFF_LAUNCHER_CONTRACT.md | Contrato fundacional do launcher |
| ROTAS_E_CONTRATOS.md | Índice rota → contrato |
| APPSTAFF_MAP_PEN_README.md | Mapa em três setores; regras do .pen |
| AUDITORIA_MAPA_ALINHAMENTO_2026-02-07.md | Mapeamento página → rota → ficheiro → setor |
| AUDITORIA_APPSTAFF_SAFE_MODE_2026-02-07.md | Auditoria Shell, Launcher, Modos, Gates |
| CHEFIAPP_SYSTEM_SAFE_MODE.md | Modo seguro para IA — regras de ouro |

---

## 9. Regras de ouro (não alterar sem aprovação)

- Não alterar arquitetura, rotas, entrypoints, shells, gates ou providers sem autorização explícita.
- Não criar V1/V2/V3 paralelos do mesmo app.
- Não introduzir onboarding em wizard, dashboards web disfarçados de app ou dependência obrigatória de backend para operar.
- AppStaff tem um único entry: App.tsx → AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout. Não reativar AppStaff.tsx legado como entry.
- Shell é o dono da altura e do scroll; páginas filhas não definem 100vh nem scroll próprio no root.
- Launcher é AppRootSurface — tiles, 1 palavra, sem textos explicativos.

---

*Este documento complementa a arquitetura existente e não a substitui. Para alterações de código, consultar os contratos e o Canon.*
