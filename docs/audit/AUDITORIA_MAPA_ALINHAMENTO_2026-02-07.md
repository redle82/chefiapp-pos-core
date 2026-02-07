# Auditoria e alinhamento máximo (sem regressão)

**Data:** 2026-02-07  
**Referência:** Mapa canónico (appstaff-map.pen, APPSTAFF_MAP_PEN_README.md). Documento/mapa usado como lente cognitiva e contrato visual, sem alteração de arquitetura.

---

## TAREFA 1 — Mapeamento real (arquitetura → mapa)

Listagem das páginas existentes no código, com caminho real, ficheiro principal, shell e setor do mapa. Apenas rotas com `element={<... />}` (excluindo apenas `<Navigate>` e `<Outlet>`). Nenhuma página nova foi criada; itens do mapa sem rota correspondente estão assinalados como "conceito futuro / não implementado".

### Resumo por setor

- **CORE/INFRA:** Nenhuma página (apenas nós técnicos no mapa: Docker Core, PostgreSQL, Migrations, gm_*, Auth/Session, Runtime Context, Feature Flags, Billing/Plans).
- **MERCHANT PORTAL:** Auth, Setup, Config, Dashboard/Admin, Operação (TPV/KDS op), Owner/Manager/Employee, Tasks, People, Health, Alerts, Billing, etc. — shells: ConfigLayout, ManagementAdvisor + DashboardLayout, OperationalFullscreenWrapper, etc.
- **APPSTAFF:** Todas as rotas sob `/app/staff` — shell único: StaffAppShellLayout (após StaffAppGate).

### Tabela de mapeamento (Tarefa 1)

| Página existente | Rota | Ficheiro principal | Shell | Setor do mapa | Observação |
| --- | --- | --- | --- | --- | --- |
| Landing | `/` | pages/Landing/LandingPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Pricing | `/pricing` | pages/Landing/PricingPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Features | `/features` | pages/Landing/FeaturesPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Demo TPV | `/app/demo-tpv` | pages/Landing/ProductFirstLandingPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Phone Login | `/auth/phone` | pages/AuthPhone/PhoneLoginPage.tsx | (nenhum) | MERCHANT PORTAL — Auth | OK |
| Verify Code | `/auth/verify` | pages/AuthPhone/VerifyCodePage.tsx | (nenhum) | MERCHANT PORTAL — Auth | OK |
| Auth Email | `/auth/email` | pages/AuthPage.tsx | (nenhum) | MERCHANT PORTAL — Auth | OK |
| Bootstrap | `/bootstrap` | pages/BootstrapPage.tsx | (nenhum) | MERCHANT PORTAL — Setup | OK |
| Setup Restaurant Minimal | `/setup/restaurant-minimal` | pages/Setup/RestaurantMinimalSetupPage.tsx | (nenhum) | MERCHANT PORTAL — Setup | OK |
| Billing Success | `/billing/success` | pages/Billing/BillingSuccessPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Help Start Local | `/help/start-local` | pages/HelpStartLocalPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Menu Catalog | `/menu` | pages/MenuCatalog/MenuCatalogPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Menu Catalog V2 | `/menu-v2` | pages/MenuCatalog/MenuCatalogPageV2.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Public Web | `/public/:slug` | pages/PublicWeb/PublicWebPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Table | `/public/:slug/mesa/:number` | pages/PublicWeb/TablePage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Customer Order Status | `/public/:slug/order/:orderId` | pages/Public/CustomerOrderStatusView.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Public KDS | `/public/:slug/kds` | pages/Public/PublicKDS.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Select Tenant | `/app/select-tenant` | pages/SelectTenantPage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| TPV Op | `/op/tpv/*` | pages/TPVMinimal/TPVMinimal.tsx | OperationalFullscreenWrapper + ShiftGate | MERCHANT PORTAL — Operação | OK |
| KDS Op | `/op/kds` | pages/KDSMinimal/KDSMinimal.tsx | OperationalFullscreenWrapper | MERCHANT PORTAL — Operação | OK |
| Op Staff / Garçom | `/op/staff`, `/garcom` | pages/AppStaff/AppStaffMobileOnlyPage.tsx | (ManagementAdvisor não aplicado) | MERCHANT PORTAL → AppStaff | OK — entrada alternativa |
| Backoffice | `/app/backoffice` | pages/Backoffice/BackofficePage.tsx | ManagementAdvisor | MERCHANT PORTAL — Admin | OK |
| Runbook Core | `/app/runbook-core` | pages/RunbookCorePage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Menu Builder | `/menu-builder` | pages/MenuBuilder/MenuBuilderMinimal.tsx | (nenhum) | MERCHANT PORTAL — Setup | OK |
| Operação | `/operacao` | pages/Operacao/OperacaoMinimal.tsx | RequireOperational | MERCHANT PORTAL — Operação | OK |
| Inventory Stock | `/inventory-stock` | pages/InventoryStock/InventoryStockMinimal.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Task System | `/task-system` | pages/TaskSystem/TaskSystemMinimal.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Shopping List | `/shopping-list` | pages/ShoppingList/ShoppingListMinimal.tsx | (nenhum) | MERCHANT PORTAL | OK |
| **AppStaff — Wrapper** | `/app/staff` | pages/AppStaff/AppStaffWrapper.tsx | (Outlet) | APPSTAFF — Entry | OK |
| **AppStaff — Home (Launcher)** | `/app/staff/home` | pages/AppStaff/pages/StaffLauncherPage.tsx | StaffAppShellLayout | APPSTAFF — Launcher | OK |
| **AppStaff — Operação** | `/app/staff/mode/operation` | pages/AppStaff/pages/OperationModePage.tsx | StaffAppShellLayout | APPSTAFF — Modos | OK |
| **AppStaff — Turno** | `/app/staff/mode/turn` | pages/AppStaff/pages/ManagerTurnoPage.tsx | StaffAppShellLayout | APPSTAFF — Modos | OK |
| **AppStaff — Equipa** | `/app/staff/mode/team` | pages/AppStaff/pages/ManagerEquipePage.tsx | StaffAppShellLayout | APPSTAFF — Modos | OK |
| **AppStaff — TPV** | `/app/staff/mode/tpv` | pages/AppStaff/pages/StaffTpvPage.tsx | StaffAppShellLayout | APPSTAFF — Modos | OK |
| **AppStaff — KDS** | `/app/staff/mode/kds` | pages/TPV/KDS/KitchenDisplay.tsx | StaffAppShellLayout | APPSTAFF — Modos | OK |
| **AppStaff — Tarefas** | `/app/staff/mode/tasks` | pages/AppStaff/pages/ManagerTarefasPage.tsx | StaffAppShellLayout | APPSTAFF — Modos | OK |
| **AppStaff — Alertas** | `/app/staff/mode/alerts` | pages/AppStaff/pages/ManagerExcecoesPage.tsx | StaffAppShellLayout | APPSTAFF — Modos | OK |
| **AppStaff — Perfil** | `/app/staff/profile` | pages/AppStaff/pages/StaffProfilePage.tsx | StaffAppShellLayout | APPSTAFF — Modos | OK |
| Employee Home | `/employee/home` | pages/Employee/HomePage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Employee Tasks | `/employee/tasks` | pages/Employee/TasksPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Employee Operation | `/employee/operation` | pages/Employee/OperationPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Employee KDS | `/employee/operation/kitchen` | pages/Employee/KDSIntelligentPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Employee Mentor | `/employee/mentor` | pages/Employee/MentorPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Manager Dashboard | `/manager/dashboard` | pages/Manager/DashboardPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Manager Central | `/manager/central` | pages/Manager/CentralPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Manager Analysis | `/manager/analysis` | pages/Manager/AnalysisPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Manager Schedule | `/manager/schedule` | pages/Manager/SchedulePage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Manager Schedule Create | `/manager/schedule/create` | pages/Manager/ScheduleCreatePage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Manager Reservations | `/manager/reservations` | pages/Manager/ReservationsPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Owner Dashboard | `/owner/dashboard` | pages/AppStaff/OwnerDashboard.tsx | ManagementAdvisor | MERCHANT PORTAL — Owner | OK |
| Owner Vision | `/owner/vision` | pages/Owner/VisionPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Owner Stock | `/owner/stock` | pages/Owner/StockRealPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Owner Simulation | `/owner/simulation` | pages/Owner/SimulationPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Owner Purchases | `/owner/purchases` | pages/Owner/PurchasesPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Admin Home | `/admin/home` | (DashboardHomePage) | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Customers | `/admin/customers` | (CustomersPage) | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Closures | `/admin/closures` | (ClosuresPage) | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Reservations | `/admin/reservations` | pages/Reservations/ReservationsDashboardPage.tsx | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Payments | `/admin/payments` | (PaymentsLayout → TransactionsPage, PayoutsPage) | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Reports Overview | `/admin/reports/overview` | (AdminReportsOverview) | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Dashboard | OK |
| Admin Reports Sales | `/admin/reports/sales` | pages/Reports/SalesByPeriodReportPage.tsx | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Reports Operations | `/admin/reports/operations` | pages/Reports/OperationalActivityReportPage.tsx | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Reports Human Performance | `/admin/reports/human-performance` | pages/Reports/GamificationImpactReportPage.tsx | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Devices | `/admin/devices` | pages/InstallPage.tsx | ManagementAdvisor + DashboardLayout | MERCHANT PORTAL — Admin | OK |
| Admin Config | `/admin/config` | (AdminConfigLayout) + subrotas | ManagementAdvisor + DashboardLayout + OnboardingProvider | MERCHANT PORTAL — Admin | OK |
| Config (Portal) | `/config` | pages/Config/ConfigLayout.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config General | `/config/general` | pages/Config/ConfigGeneralPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config Identity | `/config/identity` | pages/Config/ConfigIdentityPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config Location | `/config/location` | pages/Config/ConfigLocationPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config Ubicaciones | `/config/ubicaciones` | pages/Config/UbicacionesPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config People | `/config/people` | pages/Config/ConfigPeoplePage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK — mapa: "Cria dados que desbloqueiam AppStaff" |
| Config Schedule | `/config/schedule` | pages/Config/ConfigSchedulePage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config Payments | `/config/payments` | pages/Config/ConfigPaymentsPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config Integrations | `/config/integrations` | pages/Config/ConfigIntegrationsPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config Modules | `/config/modules` | pages/Config/ConfigModulesPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config Perception | `/config/perception` | pages/Config/ConfigPerceptionPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| Config Status | `/config/status` | pages/Config/ConfigStatusPage.tsx | ConfigLayout | MERCHANT PORTAL — Config | OK |
| System Tree | `/system-tree` | pages/SystemTree/SystemTreePage.tsx | (nenhum) | MERCHANT PORTAL | OK |
| Tasks | `/tasks` | (TaskDashboardPage) | ManagementAdvisor | MERCHANT PORTAL | OK |
| People | `/people` | pages/People/PeopleDashboardPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Health | `/health` | pages/Health/HealthDashboardPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Alerts | `/alerts` | pages/Alerts/AlertsDashboardPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Mentor | `/mentor` | pages/Mentor/MentorDashboardPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Financial | `/financial` | pages/Financial/FinancialDashboardPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Reservations | `/reservations` | pages/Reservations/ReservationsDashboardPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Groups | `/groups` | pages/Groups/GroupsDashboardPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| App Billing | `/app/billing` | pages/Billing/BillingPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| App Publish | `/app/publish` | pages/PublishPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| App Install | `/app/install` | pages/InstallPage.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| App Reports (daily, sales, etc.) | `/app/reports/*` | pages/Reports/*.tsx | ManagementAdvisor | MERCHANT PORTAL | OK |
| Core Reset | `*` (fallback) | pages/CoreReset/CoreResetPage.tsx | (nenhum) | — | OK |

**Redirects (não são páginas):** `/login`, `/signup`, `/auth`, `/forgot-password` → `/auth/phone` ou `/auth/email`; `/dashboard`, `/app/dashboard` → `/admin/reports/overview`; `/app/control-room` → `/app/staff/mode/operation`; `/app/setup/*` → menu-builder, operacao, config/people, config/schedule, config/payments, op/tpv, op/kds, inventory-stock, config; `/tpv`, `/kds`, `/op/cash` → op/tpv ou op/kds; `/admin` → `/admin/reports/overview`; etc. Observação: OK — apenas redirecionam; não criam páginas novas.

**Conceito futuro / não implementado (no mapa mas sem rota dedicada):** Notifications, Help e History como rotas diretas sob `/app/staff` (no código podem estar acessíveis via Perfil ou shell; o mapa .pen inclui nós para eles). StaffCleaningPage e StaffWaiterChecklistsPage estão importados em App.tsx mas não aparecem como rotas top-level em App.tsx — possivelmente acessíveis via launcher/tiles ou conceito futuro.

---

## TAREFA 2 — Alinhamento semântico (não técnico)

Verificação, por setor, de nome, linguagem, tipo de interação e layout base face ao setor do mapa. Sugestões limitadas a texto, hierarquia visual e remoção de ruído.

### APPSTAFF (Shell + Launcher + Modos)

- **Launcher (/app/staff/home):** O mapa exige "AppRootSurface — sem dashboard, sem texto explicativo". Se existirem títulos longos ou blocos explicativos na home, considerar reduzir a texto mínimo ou remover, mantendo apenas tiles e estado curto.
- **Modos (operation, turn, team, tpv, kds, tasks, alerts):** Nomes das páginas (ManagerTurnoPage, ManagerExcecoesPage, etc.) estão alinhados ao mapa. Sugestão: garantir que títulos de ecrã usem a mesma linguagem do mapa (ex. "Turno", "Alertas", "Tarefas") para consistência cognitiva.
- **Perfil:** Alinhar abas (Dados, Papel, Histórico, Sessão) à linguagem do contrato; evitar labels genéricos ("Configurações") que misturam com Config do Portal.

### MERCHANT PORTAL — Auth

- **Auth (phone, verify, email):** Nomes e rotas condizem. Sugestão: evitar banners de "demo" ou texto longo acima do formulário; manter foco em número/email e código.

### MERCHANT PORTAL — Config

- **Config People:** O mapa marca "Cria dados que desbloqueiam AppStaff". Sugestão: na página ou no sidebar, um texto curto tipo "Pessoas aqui desbloqueiam o check-in no App Staff" (ou equivalente) para alinhar devs e utilizadores ao valor semântico.

### MERCHANT PORTAL — Admin / Dashboard

- **Admin e Reports:** Muitas subrotas (admin/config/*, admin/payments/*, admin/reports/*). Sugestão: hierarquia visual clara (breadcrumb ou título de secção) para que "Admin" e "Dashboard" não se confundam com "Operação" ou "AppStaff" na cabeça do utilizador.
- **Owner/Manager/Employee:** Páginas sob `/owner/*`, `/manager/*`, `/employee/*` vivem no Portal (ManagementAdvisor). Sugestão: títulos de página que reflitam "Gestão" ou "Portal" quando apropriado, para não parecer app operacional (que é o AppStaff).

### Operação (TPV/KDS)

- **/op/tpv e /op/kds:** Fullscreen operacional. Sugestão: remover ou minimizar banners explicativos dentro da área de trabalho; manter apenas estado operacional (turno, dispositivo) conforme canon.

Nenhuma sugestão de novas rotas, providers, contexts ou duplicação de telas.

---

## TAREFA 3 — O que este mapa NÃO pode fazer

- **Este mapa não define rotas.** As rotas são definidas exclusivamente em `App.tsx` (e eventualmente em routers aninhados). O mapa descreve e documenta; não substitui a árvore de rotas.
- **Este mapa não cria entrypoints.** O entrypoint do AppStaff é e continua a ser `Route path="/app/staff" element={<AppStaffWrapper />}`. O mapa não altera nem duplica entrypoints.
- **Este mapa não decide providers.** StaffProvider, OperatorSessionProvider, RestaurantRuntimeContext, RoleGate, ShiftGate, etc., são decisões da arquitetura. O mapa não os introduz nem remove.
- **Este mapa não controla o fluxo de renderização.** A ordem AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout → páginas é fixa no código. O mapa não reordena nem substitui esse fluxo.
- **Este mapa não substitui contratos técnicos.** APPSTAFF_VISUAL_CANON, APPSTAFF_HOME_LAUNCHER_CONTRACT, STAFF_SESSION_LOCATION_CONTRACT, etc., continuam a ser a fonte de verdade para comportamento e layout. O mapa é uma lente de alinhamento e onboarding.
- **Este mapa não implementa funcionalidades.** Não adiciona páginas, não implementa features; apenas mapeia e nomeia o que já existe.

**Responsabilidade que continua na arquitetura:** `App.tsx`, `StaffAppGate`, `StaffAppShellLayout`, guards (RoleGate, ShiftGate, RequireOperational), layouts (ConfigLayout, DashboardLayout, ManagementAdvisor), e toda a lógica de gates e redirecionamentos.

---

## TAREFA 4 — Benefício prático imediato

### Em que este documento ajuda hoje

1. **Onboarding de devs:** Ver rapidamente onde vive cada ecrã (Portal vs AppStaff), qual o shell e qual o setor do mapa, sem alterar código.
2. **Alinhamento com IA:** Dar contexto estruturado (rotas, ficheiros, setores) para prompts e revisões sem sugerir refatoração indevida.
3. **Revisão de UI:** Conferir nomes e linguagem face ao mapa (Operação, Pessoas, Config, Admin) e reduzir deriva semântica.
4. **Prevenção de regressões visuais:** Lembrar que AppStaff tem Shell único, Launcher sem "dashboard" explicativo e modos com nomes estáveis; qualquer mudança que quebre isso pode ser confrontada com este documento.

### Em que não deve ser usado

1. **Decisões técnicas:** Escolha de providers, estado global, guards ou estratégia de rotas deve basear-se na arquitetura e nos contratos, não no mapa.
2. **Refatoração estrutural:** Não usar o mapa para propor V2, novo shell, ou reorganização de rotas.
3. **Mudanças de fluxo:** Entrada (Portal → AppStaff), ordem dos gates (Location → Contract → Worker) e navegação dentro do Shell são definidas no código; o mapa não é autoridade para as alterar.

---

## TAREFA 5 — Output final

### 5.1 Tabela final (resumo)

A tabela completa de mapeamento está na **Tarefa 1**. Resumo por setor:

| Setor do mapa | Quantidade (aprox.) | Shell(s) |
| --- | --- | --- |
| CORE/INFRA | 0 páginas | — |
| MERCHANT PORTAL | ~80+ rotas/páginas | ConfigLayout, ManagementAdvisor, DashboardLayout, OperationalFullscreenWrapper, nenhum |
| APPSTAFF | 10 rotas (home + 7 modos + profile + wrapper) | StaffAppShellLayout (após StaffAppGate) |

### 5.2 Ajustes recomendados (sem quebrar nada)

1. **AppStaff Home:** Reduzir ou remover texto explicativo longo; manter tiles e estado curto (canon: AppRootSurface sem dashboard).
2. **AppStaff modos:** Alinhar títulos de ecrã à linguagem do mapa (Turno, Alertas, Tarefas, Operação, etc.).
3. **Config People:** Adicionar frase curta na UI ou no sidebar: "Pessoas aqui desbloqueiam o check-in no App Staff" (ou equivalente).
4. **Auth:** Evitar banners ou blocos de texto longos acima do formulário; manter foco em input e código.
5. **Admin/Dashboard:** Reforçar hierarquia visual (breadcrumb ou título de secção) para distinguir de Operação e AppStaff.
6. **Owner/Manager/Employee (Portal):** Usar títulos que indiquem contexto "Gestão/Portal" quando útil, para não confundir com app operacional.
7. **/op/tpv e /op/kds:** Minimizar ruído (banners, explicações) na área de trabalho; manter apenas estado operacional.

### 5.3 Frase de validação

**Este documento complementa a arquitetura existente e não a substitui.**
