# Boundary Contexts — ChefIApp

**Propósito:** Documento único que mapeia **contextos de fronteira** (quem lê/escreve o quê e onde) e liga aos contratos CORE*, MENU*, operacionais e de UI.  
**Público:** Dev, arquitetura.  
**Referência:** [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) · [ARCHITECTURE_OVERVIEW](../ARCHITECTURE_OVERVIEW.md)

---

## 1. Definição

**Boundary** = fronteira entre camadas onde há leitura/escrita autorizada. Nada no frontend ultrapassa o boundary sem contrato; o Core (Docker) é a única fonte de verdade para dados financeiros e operacionais.

---

## 2. Contextos por domínio

| Contexto / Boundary | O que governa | Contrato(s) | Onde no código (referência) |
|--------------------|---------------|-------------|-----------------------------|
| **Core (Docker)** | Persistência soberana: gm_restaurants, gm_restaurant_members, installed_modules, orders, payments, shifts | [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md), [CORE_RECONCILIATION_CONTRACT](./CORE_RECONCILIATION_CONTRACT.md) | docker-core; core-boundary |
| **Runtime** | Espelho do Core no frontend: restaurant_id, isPublished, lifecycle, setup_status | [CORE_RUNTIME_AND_ROUTES_CONTRACT](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md), [APPLICATION_BOOT_CONTRACT](./APPLICATION_BOOT_CONTRACT.md) | RestaurantRuntimeContext, RuntimeReader, RuntimeWriter |
| **Menu / Produtos** | Categorias, produtos; leitura/escrita via Core; fallback local em falha de rede | [MENU_FALLBACK_CONTRACT](./MENU_FALLBACK_CONTRACT.md), B1 contenção | ProductReader, RestaurantReader, MenuWriter; menuPilotFallback |
| **TPV / Pedidos** | Criação de pedidos, totais; Core primeiro; fallback/estado degradado em falha | [CORE_TPV_BEHAVIOUR_CONTRACT](./CORE_TPV_BEHAVIOUR_CONTRACT.md), [OPERATIONAL_UI_RESILIENCE_CONTRACT](./OPERATIONAL_UI_RESILIENCE_CONTRACT.md), B2 | OrderWriter, create_order_atomic; ErrorBoundary /op/tpv |
| **KDS** | Leitura de pedidos ativos, confirmação de estados; Core primeiro; fallback em falha | [CORE_KDS_CONTRACT](./CORE_KDS_CONTRACT.md), [OPERATIONAL_UI_RESILIENCE_CONTRACT](./OPERATIONAL_UI_RESILIENCE_CONTRACT.md), B4 | OrderReader, readActiveOrders; ErrorBoundary /op/kds |
| **Tenant / Identidade** | Resolução de tenant (0/1/N restaurantes), seleção, bootstrap | [TENANT_SELECTION_CONTRACT](./TENANT_SELECTION_CONTRACT.md), [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT](./RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md) | TenantContext, SelectTenantPage, BootstrapPage |
| **Billing** | Estados trial/active/past_due/suspended; gate operacional (futuro) | [BILLING_SUSPENSION_CONTRACT](./BILLING_SUSPENSION_CONTRACT.md), [CORE_BILLING_AND_PAYMENTS_CONTRACT](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) | RequireOperational (billingStatus pendente), BillingPage |
| **Tarefas** | Leitura/escrita de tarefas; Core como autoridade | [CORE_TASK_SYSTEM_CONTRACT](./CORE_TASK_SYSTEM_CONTRACT.md), [CORE_TASK_EXECUTION_CONTRACT](./CORE_TASK_EXECUTION_CONTRACT.md) | TaskReader, TaskPanel |
| **UI operacional** | Shell, painéis, Command Center; nunca escreve direto no Core | [CORE_OPERATIONAL_UI_CONTRACT](./CORE_OPERATIONAL_UI_CONTRACT.md), [CORE_WEB_COMMAND_CENTER_CONTRACT](./CORE_WEB_COMMAND_CENTER_CONTRACT.md) | OperationalShell, PanelRoot, DashboardPortal |
| **Auth** | Login, signup; destino pós-auth | [AUTH_AND_ENTRY_CONTRACT](./AUTH_AND_ENTRY_CONTRACT.md), [SESSION_RESUME_CONTRACT](./SESSION_RESUME_CONTRACT.md) | AuthPage, Supabase Auth |

---

## 3. Regras de fronteira

- **UI nunca escreve** em gm_restaurants, orders, payments sem passar pelo boundary (RuntimeWriter, DbWriteGate, RPC).
- **Runtime nunca inventa** estado (ex.: isPublished vem do Core).
- **Gates só leem** (runtime, tenant, role) e redirecionam ou renderizam; não fazem write.
- **Fallback local** (menu, piloto) nunca é promovido automaticamente a Core; ver [MENU_FALLBACK_CONTRACT](./MENU_FALLBACK_CONTRACT.md) e [OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md).

---

## 4. Índice rápido de contratos por sigla

| Sigla / Área | Contratos principais |
|--------------|------------------------|
| **CORE*** | CORE_FINANCIAL_SOVEREIGNTY, CORE_RUNTIME_AND_ROUTES, CORE_TPV_BEHAVIOUR, CORE_KDS_CONTRACT, CORE_TASK_SYSTEM, CORE_OPERATIONAL_UI, CORE_WEB_COMMAND_CENTER, CORE_BILLING_AND_PAYMENTS, CORE_RECONCILIATION, etc. — ver [CORE_CONTRACT_INDEX](./CORE_CONTRACT_INDEX.md) |
| **MENU*** | MENU_FALLBACK_CONTRACT; MENU_CONTRACT; ProductReader/MenuWriter boundary |
| **OPERATIONAL*** | OPERATIONAL_ROUTES_CONTRACT, OPERATIONAL_GATES_CONTRACT, OPERATIONAL_UI_RESILIENCE_CONTRACT, OPERATIONAL_INSTALLATION_CONTRACT |
| **BOOTSTRAP / TENANT** | RESTAURANT_CREATION_AND_BOOTSTRAP, TENANT_SELECTION, BOOTSTRAP_CONTRACT |

---

*Documento vivo. Novos contextos ou boundaries devem ser indexados aqui e no CORE_CONTRACT_INDEX.*
