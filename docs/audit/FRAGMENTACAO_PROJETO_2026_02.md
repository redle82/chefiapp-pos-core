# Fragmentação do projeto — 2026-02

**Objetivo:** Medir o quão fragmentado está o projeto (estrutura, rotas, contextos, domínios, documentação) e identificar focos de dispersão.

**Resumo:** Fragmentação **média-alta** em **páginas e domínios**, **alta** em **contextos/providers** e **documentação**. **Baixa** em entry points e monorepo. **Atualização 2026-02:** Rotas foram extraídas para `routes/MarketingRoutes.tsx` e `routes/OperationalRoutes.tsx`; App.tsx ficou ~218 linhas (concentração reduzida).

---

## 1. Visão geral (métricas)

| Dimensão | Métrica | Avaliação |
|----------|---------|-----------|
| **Monorepo** | 2 workspaces (merchant-portal, customer-portal) | Baixa fragmentação |
| **Entry points** | 2 (main_debug.tsx, main-marketing.tsx) | Baixa — separação intencional |
| **Rotas** | Em `routes/MarketingRoutes.tsx` + `routes/OperationalRoutes.tsx`; App.tsx monta ambos | ✅ Desfragmentado (2026-02) |
| **App.tsx** | ~218 linhas, ~24 imports | Concentração reduzida |
| **Domínios de páginas** | 40+ pastas em `pages/` + `features/admin/*` | Fragmentação média-alta |
| **Contextos/Providers** | 25+ (Auth, Tenant, Shift, Runtime, Order, Table, Staff, etc.) | Fragmentação alta |
| **Documentação** | 200+ ficheiros em docs/ (várias pastas) | Fragmentação alta |
| **Conceitos duplicados** | Vários “dashboard”, duas “landing”, duas “config” (pages vs admin) | Fragmentação conceptual |

---

## 2. Onde está fragmentado

### 2.1 Rotas e App.tsx

- **Atual (após 2026-02):** Rotas em `routes/MarketingRoutes.tsx` (público/marketing) e `routes/OperationalRoutes.tsx` (operacional); App.tsx ~218 linhas monta ambos.
- **Consequência:** Menor concentração; alterações por domínio (marketing vs operacional) nos ficheiros correspondentes.

**Fragmentação:** Reduzida. **Risco:** Mais baixo que antes.

---

### 2.2 Domínios de páginas (pages/ e features/)

**pages/** — muitas áreas distintas:

- Alerts, AppStaff (com sub-páginas, dashboards, views, apps, homes), Auth, AuthPhone, Backoffice, Billing, Blog, Changelog, Config, ControlRoom, CoreReset, Employee, Health, Install, KDSMinimal, Landing, LandingV2, Legal, Manager, MenuBuilder, MenuCatalog, Onboarding, Operacao, Owner, People, Public, PublicWeb, Purchases, Reports, Security, Setup, Status, SystemTree, TaskSystem, Tasks, TPV, TPVMinimal, Waiter, WizardPage, etc.

**features/admin/** — outra árvore de “admin”:

- config (muitas páginas: General, Ubicaciones, SoftwareTpv, Delivery, etc.), catalog (Products, Modifiers, Combos, etc.), payments (Transactions, Payouts), observability, reservas, customers, closures, subscription, etc.

**Consequência:** Muitos “cantos” do produto (Owner, Manager, Employee, Reports, Config, Admin config, etc.). Parte é inevitável (produto grande); parte pode ser sobreposição (ex.: Config em pages/ vs config em features/admin/).

**Fragmentação:** **Média-alta** — muitos domínios e sub-domínios.

---

### 2.3 Contextos e providers

Existem **muitos** contextos/providers:

- Auth (AuthProvider, useCoreAuth)
- Tenant (TenantContext, TenantResolver)
- Runtime (RestaurantRuntimeContext)
- Shift (ShiftContext)
- Global UI (GlobalUIStateProvider)
- Onboarding (OnboardingProvider)
- Landing i18n (LandingLocaleProvider)
- Roles (RoleProvider, RoleContext)
- Stripe (StripeTerminalContext)
- Context Engine (ContextEngineProvider)
- TPV: Order (OrderContextReal), Table (TableContext), Offline (OfflineOrderContext), Loyalty (LoyaltyProvider)
- AppStaff: Staff (StaffContext), OperatorSession, StaffRole
- Training (TrainingContext)
- Lifecycle (LifecycleStateContext)
- SystemTree (SystemTreeContext)
- Feature flags (FeatureFlagContext)
- Pulse (PulseProvider)
- Operational (OperationalContext)
- Plan (PlanContext)
- SystemGuardian, GMBridge, Public (PublicMenuContext, CartContext)
- Kernel (KernelContext — DORMANT)

**Consequência:** Estado e “quem fornece o quê” estão espalhados por muitos contextos. Quem mexe em fluxos que cruzam auth + tenant + runtime + shift precisa de vários ficheiros e mental model grande.

**Fragmentação:** **Alta** — muitos eixos de estado.

---

### 2.4 Conceitos duplicados ou sobrepostos

| Conceito | Onde aparece | Observação |
|----------|--------------|------------|
| **Landing** | Landing (antiga), LandingV2 (canónica), ProductFirstLandingPage | Duas “landings” + trial; antiga marcada LEGACY. |
| **Dashboard** | OwnerDashboard, ManagerDashboard, AlertsDashboardPage, HealthDashboardPage, PurchasesDashboardPage, ControlRoomPage, OwnerDashboardWithMapLayout, SectorDashboards (vários), TaskDashboardPage, PeopleDashboardPage, Manager/DashboardPage, DashboardHomePage (admin) | Muitas noções de “dashboard” (dono, gerente, setor, tarefas, pessoas, admin). |
| **Config** | pages/Config/* (ConfigGeneralPage, ConfigIdentityPage, etc.) + features/admin/config/* (GeneralConfigPage, UbicacionesConfigPage, etc.) | Duas árvores de “configuração” (portal vs backoffice/admin). |
| **Menu** | MenuBuilder, MenuBuilderMinimal, MenuCatalogPage, MenuCatalogPageV2 | Dois “menu” (builder vs catálogo) e duas versões de catálogo. |
| **TPV** | TPV (full), TPVMinimal, TPVTrialPage, StaffTpvPage, MiniPOS, MiniTPVMinimal | Várias superfícies TPV (completo, mínimo, trial, staff, mini). |

**Fragmentação:** **Conceptual média** — mesmo conceito (dashboard, config, TPV) aparece em vários formatos/contextos.

---

### 2.5 Documentação (docs/)

- **Pastas principais:** audit, architecture, compliance, contracts, design, implementation, insforge, ops, routes, strategy, archive, Business, etc.
- **Volume:** Centenas de ficheiros .md.
- **Consequência:** Difícil saber “onde está o contrato de X” ou “qual é o doc de referência para Y” sem índices (DOC_INDEX, ESTADO_ATUAL).

**Fragmentação:** **Alta** — muita documentação espalhada por muitas pastas. DOC_INDEX e ESTADO_ATUAL_2026_02 reduzem o impacto.

---

## 3. Onde NÃO está fragmentado

- **Monorepo:** Poucos workspaces; build e scripts concentrados.
- **Entry points:** Dois (app completo vs marketing) por decisão clara.
- **Core/backend:** Um Core (Docker); sem múltiplos backends em uso (Supabase removido do runtime).
- **Contratos:** LEGACY_CODE_BLACKLIST, contratos em docs/architecture e docs/contracts dão âncora.
- **Landing canónica:** Uma LandingV2; o resto está marcado como legado ou variante.

---

## 4. Índice de fragmentação (resumo)

| Área | Nível | Comentário |
|------|--------|------------|
| Repo / workspaces | Baixo | 2 packages, estrutura clara. |
| Entry points | Baixo | 2 entradas, propósito definido. |
| Rotas | Concentrado | Tudo em App.tsx; fragmentação baixa, complexidade alta. |
| Páginas / domínios | Médio-alto | Muitas áreas (pages/ + features/admin). |
| Contextos / estado | Alto | Muitos providers/contextos. |
| Conceitos (dashboard, config, TPV) | Médio | Várias incarnações do mesmo conceito. |
| Documentação | Alto | Muitos ficheiros e pastas; índices ajudam. |

**Conclusão:** O projeto está **moderadamente a muito fragmentado** em **domínios de UI**, **estado (contextos)** e **docs**. Está **pouco fragmentado** em repo, entry points e backend. O maior ponto único de concentração é **App.tsx** (rotas + imports).

---

## 5. Recomendações (opcional)

1. **App.tsx:** Extrair rotas por domínio para ficheiros (ex.: `routes/PublicRoutes.tsx`, `routes/AppRoutes.tsx`, `routes/ConfigRoutes.tsx`) e importar em App.tsx — reduz tamanho e conflitos; mantém um só sítio onde “montar” a árvore.
2. **Contextos:** Não obrigatório refatorar já; quando houver tempo, documentar “quem usa o quê” (ex.: diagrama ou tabela Auth → Tenant → Runtime → Shift) e considerar agrupar providers por “camada” (auth, tenant, operational, TPV) em wrappers, sem mudar comportamento.
3. **Documentação:** Manter DOC_INDEX e ESTADO_ATUAL como portas de entrada; ao criar novos docs, registá-los no índice.
4. **Conceitos duplicados:** Aceitar por agora (dashboard para dono vs gerente vs setor são diferentes). Unificar só se houver requisito claro (ex.: “um único dashboard admin”).

---

**Data:** 2026-02  
**Próxima revisão:** Após extração de rotas ou sprint de consolidação de estado.
