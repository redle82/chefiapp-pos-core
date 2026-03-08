# Arquitetura Geral — ChefIApp (AS-IS)

**Status:** GUIA DE ORIENTAÇÃO + MAPA DE SOBERANIA — não é contrato
**Propósito:** Mapa completo, seguro e confiável do projeto para humanos e IA. Consolida o estado atual real (AS-IS): código, rotas, contratos, gates, testes, Core e percurso do cliente. Inclui eixos de **governança** (quem manda em quem), **contratos ativos** (🟢🟡🔴), **gates & hard stops**, **Core vs Non-Core**, **riscos AS-IS** e **estado de confiança**.
**Local:** docs/architecture/ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md
**Última atualização:** 2026-01-31

**Eixos de soberania (secções 2–15):** Governança → Percurso vs Fluxo Técnico → Gates & Hard Stops → Core vs Non-Core → Contratos Ativos → Riscos AS-IS → Estado de Confiança → **State Machine** → **Autoridade por Decisão** → **Soberania de Dados** → **Fronteira Core/Runtime/UI** → **Falhas e Recuperação** → **Ambientes/Instalação** → **Evolução Controlada (Zonas)**.

---

# 1) VISÃO GERAL

## O que é o ChefIApp

O ChefIApp é um sistema POS (Point of Sale) e gestão para restaurantes, no modelo GloriaFood / Toast / Square: a landing pública vende o produto; após signup, o proprietário cria o primeiro restaurante (bootstrap), configura no portal (cardápio, equipe, pagamentos, faturação), publica o restaurante e passa a operar TPV (caixa) e KDS (cozinha). A persistência operacional e financeira é governada por um Core (Docker/PostgREST); a autenticação é Supabase. O merchant-portal (React, Vite, porta 5175) é a aplicação web única que cobre landing, auth, portal de gestão e apps operacionais (TPV/KDS).

## Separação de camadas

| Camada | O que cobre | Onde vive |
|--------|-------------|-----------|
| **PUBLIC** | Landing, pricing, features, demo. Sem Runtime nem Core. | Rotas `/`, `/pricing`, `/features`, `/demo` (fora de AppWithRuntime). |
| **AUTH** | Login, signup, forgot-password. Destino pós-auth: dashboard ou bootstrap/select-tenant. | `/auth`, `/signup`→`/auth?mode=signup`, `/login`→`/auth`. |
| **MANAGEMENT** | Portal de gestão: dashboard, config, billing, publish, install, backoffice, perfis (employee/manager/owner), tasks, people, health, etc. | Rotas dentro de `AppWithRuntime` + `RoleGate`: `/dashboard`, `/config/*`, `/app/billing`, `/app/publish`, `/app/install`, `/menu-builder`, `/operacao`, etc. |
| **OPERATIONAL** | TPV, KDS, caixa, staff web. Protegidos por RequireOperational (isPublished). | `/op/tpv`, `/op/kds`, `/op/cash`, `/op/staff`. |
| **CORE** | Fonte de verdade financeira e operacional. Docker/PostgREST; tabelas gm_restaurants, gm_restaurant_members, installed_modules, etc. | docker-core; boundary no merchant-portal: RuntimeReader, RuntimeWriter, DbWriteGate. |
| **INFRA** | Runtime, providers (RestaurantRuntime, Shift, Role, Tenant), gates (RoleGate, RequireOperational, ShiftGuard). | App.tsx: RestaurantRuntimeProvider → ShiftProvider → RoleProvider → TenantProvider → ShiftGuard → Routes. |
| **TESTS** | E2E (Playwright), unit (Vitest). | merchant-portal/tests/e2e/*.spec.ts, merchant-portal/src/**/*.test.ts(x), merchant-portal/tests/core/*.test.ts. |

## Frase-guia

**"Landing vende, Portal configura, Operação executa, Core governa."**

---

# 2) GOVERNANÇA DO SISTEMA (quem manda em quem)

Hierarquia de poder. A UI nunca governa — só reflete estados.

| Nível | O que governa | Onde vive | Regra |
|-------|----------------|-----------|--------|
| **Core (Docker/PostgREST)** | Soberania financeira e operacional. Fonte de verdade para pedidos, totais, estado do restaurante (gm_restaurants, gm_restaurant_members, installed_modules, etc.). | docker-core; boundary: RuntimeReader, RuntimeWriter, DbWriteGate | Nada no frontend sobrepõe o Core. |
| **Runtime (RestaurantRuntimeContext)** | Espelho do Core no frontend: restaurant_id, isPublished, lifecycle, setup_status. | merchant-portal/context/RestaurantRuntimeContext.tsx | Lê/escreve via boundary; não inventa estado. |
| **Gates (bloqueiam ou não)** | Decidem quem acede a que rota. | App.tsx (RoleGate, RequireOperational); FlowGate em código mas **não montado** | UI nunca decide sozinha; gates aplicam contratos. |
| **RequireOperational** | Bloqueia TPV/KDS se `!runtime.isPublished`. | Envolve /op/tpv, /op/kds em App.tsx | Billing ainda não bloqueia (parcial). |
| **RoleGate** | Bloqueia por papel (role). Redireciona staff para /garcom, outros para /dashboard. | Envolve todas as rotas de gestão e operação (exceto /bootstrap, /app/select-tenant). | Define quem acede a que path. |
| **FlowGate** | Conceitual: 0 tenants → select-tenant/bootstrap; 1 → auto-select; N → select-tenant. Hard-stop: /app/* não monta sem tenant selado. | Existe em código (FlowGate.tsx); **não está montado** em App.tsx. Comportamento real hoje: TenantContext + SelectTenantPage. | — |
| **UI** | Nunca governa. Só reflete estados (runtime, tenant, role). | Todas as páginas | Billing nunca bloqueia portal; só operação (quando implementado). |

---

# 3) PERCURSO DO CLIENTE vs FLUXO TÉCNICO REAL

Dois ramos paralelos: o que o cliente vive (mental/comercial) vs o que realmente acontece no código (rotas e gates).

| 👤 Percurso do Cliente (mental/comercial) | ⚙️ Fluxo Técnico Real (rotas e gates) |
|-------------------------------------------|--------------------------------------|
| Landing | `/` (PUBLIC) |
| Signup | `/signup` → `/auth?mode=signup` |
| Login | `/auth` |
| Criar primeiro restaurante | `/bootstrap` (BootstrapPage; insert gm_restaurants + owner) |
| Escolher restaurante (se N) | `/app/select-tenant` (0→/bootstrap, 1→auto, N→lista) |
| Configurar (dashboard, config, menu) | `/dashboard`, `/config/*`, `/menu-builder` (RoleGate) |
| Pagar / assinatura | `/app/billing` (RoleGate + ManagementAdvisor) |
| Publicar | `/app/publish` (RoleGate; isPublished = true) |
| Operar (caixa, cozinha) | `/op/tpv`, `/op/kds` (RoleGate + RequireOperational) |

---

# 4) GATES & HARD STOPS (bloqueios duros)

O que acontece se algo não estiver pronto. Gates são primeira classe.

| Gate / mecanismo | O que bloqueia | Condição | Ação se falhar |
|------------------|----------------|----------|----------------|
| **RoleGate** | Acesso a rotas por papel | Papel não permitido para o path | Redireciona (ex.: staff → /garcom, outros → /dashboard). |
| **RequireOperational** | TPV e KDS | `!runtime.isPublished` | Mostra "Sistema não operacional" + link para /dashboard; filhos não renderizados. |
| **Billing** | Operação (TPV/KDS) quando past_due ou suspended | — | **Ainda não bloqueia** (🟡 preparado; BILLING_SUSPENSION_CONTRACT parcial). |
| **Tenant Resolution** | Acesso a /app/* sem tenant selado | 0 tenants → 1 tenant → N tenants | 0 → redirect /bootstrap; 1 → auto-select + /dashboard; N → /app/select-tenant até escolha. |
| **CoreResetPage** | Rota não reconhecida (catch-all dentro RoleGate) | Path sem rota definida | Fallback de erro estrutural; página neutra de reset. |

---

# 5) CORE / SOBERANO vs NON-CORE (não mexer vs pode mudar)

| 🧱 CORE / SOBERANO (não mexer sem contrato) | 🧩 NON-CORE (pode mudar sem quebrar soberania) |
|--------------------------------------------|-----------------------------------------------|
| Docker Core (PostgREST, schema, migrations) | Instalação do TPV/KDS como "app" (PWA, link, fullscreen) |
| RuntimeReader / RuntimeWriter (boundary) | UI da landing (copy, layout) |
| Estados financeiros e imutabilidade de pedidos | Wizards de onboarding (ManagementAdvisor, banners) |
| gm_restaurants, gm_restaurant_members, installed_modules | ManagementAdvisor (banners, checklists) |
| CORE_FINANCIAL_SOVEREIGNTY_CONTRACT | Rotas de demo, pricing, features |

---

# 6) CONTRATOS ATIVOS (estado de aplicação)

Sistema jurídico do software. 🟢 aplicado | 🟡 aplicado parcialmente | 🔴 previsto / não aplicado.

| Contrato | O que governa | Estado |
|----------|----------------|--------|
| CORE_RUNTIME_AND_ROUTES_CONTRACT | Runtime 5175, rotas oficiais, host/porta | 🟢 aplicado |
| CAMINHO_DO_CLIENTE | Fluxo produto: landing → signup → portal → billing → publish → operação | 🟢 aplicado |
| CORE_FINANCIAL_SOVEREIGNTY_CONTRACT | Docker Core soberano; Supabase não é Core | 🟢 aplicado |
| RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT | /bootstrap; criação 1º restaurante + owner | 🟢 aplicado |
| TENANT_SELECTION_CONTRACT | /app/select-tenant; 0/1/N tenants | 🟢 aplicado |
| PORTAL_MANAGEMENT_CONTRACT | /app/*; gestão; nunca bloqueia | 🟢 aplicado |
| OPERATIONAL_ROUTES_CONTRACT | /op/tpv, /op/kds, /op/cash, /op/staff | 🟢 aplicado |
| OPERATIONAL_GATES_CONTRACT | published para TPV/KDS | 🟢 aplicado (só isPublished; billing futuro) |
| BILLING_SUSPENSION_CONTRACT | Estados billing; bloqueio operação quando past_due/suspended | 🟡 parcial (gate não aplica billing ainda) |
| APPLICATION_BOOT_CONTRACT | Modos PUBLIC / AUTH / MANAGEMENT / OPERATIONAL | 🟢 aplicado |
| APP_STAFF_MOBILE_CONTRACT | Staff mobile only; web /op/staff se existir | 🟡 parcial |
| PILOT_MODE_RUNTIME_CONTRACT | Modo piloto: estado no Runtime/UI; não escreve no Core; pode localStorage. | 🟢 aplicado |
| MENU_FALLBACK_CONTRACT | Fallback menu: Core primeiro; em rede falhada usa local; nunca promove local a Core. | 🟢 aplicado |
| OPERATIONAL_UI_RESILIENCE_CONTRACT | ErrorBoundary em /op/; mensagens neutras; nunca ecrã branco. | 🟢 aplicado |
| ORDER_ORIGIN_CLASSIFICATION | order_origin pilot \| real; semântica oficial; Core pode filtrar/reportar. | 🟡 parcial |

---

# 7) RISCOS AS-IS (por quê e impacto)

| Risco | Por quê | Impacto |
|-------|---------|--------|
| FlowGate existe mas não está montado | Lógica de tenant/redirect vive em TenantContext + SelectTenantPage; FlowGate.tsx não está na árvore de App.tsx | Possível inconsistência entre doc (FlowGate) e código (TenantContext); risco de duplicar lógica ao integrar FlowGate. |
| Billing não bloqueia operação ainda | RequireOperational só verifica isPublished; não lê billingStatus | Cliente com past_due/suspended pode aceder a TPV/KDS até implementação. |
| Publish E2E "after publish" em skip | Cenários "após publicar" em publish-to-operational.spec.ts estão em skip | Sem cobertura E2E para fluxo completo publicar → abrir TPV/KDS. |
| Auth E2E depende de Supabase real | create-first-restaurant.spec.ts usa signup real | Testes E2E exigem backend e credenciais; CI frágil sem fixture. |
| MANAGEMENT com pouca cobertura de teste | BillingPage, PublishPage, DashboardPortal, Config sem testes dedicados | Regressões em portal menos protegidas. |

---

# 8) ESTADO DE CONFIANÇA DO SISTEMA (resumo executivo)

| 🟢 Sistema confiável para | 🟡 Sistema parcial para | 🔴 Não cobre ainda |
|---------------------------|--------------------------|---------------------|
| Criar restaurante (bootstrap + owner) | Billing enforcement (bloqueio por past_due/suspended) | Billing → bloqueio operacional real |
| Publicar (isPublished = true) | Multi-tenant complexo (N restaurantes) | App staff mobile real (canal principal) |
| Operar TPV/KDS após publicar | CI automatizado (E2E com auth real) | Recovery flows complexos |
| Evitar operação antes do publish (RequireOperational) | Testes críticos (vários a passar; billing TDD em skip) | — |

---

# 9) EIXO DE ESTADO (STATE MACHINE EXPLÍCITA)

Estados formais do restaurante que governam rotas e gates. Referência: [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md), [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md).

## Estados do restaurante (lifecycle)

| Estado | Significado | ✅ Rotas permitidas | ❌ Rotas bloqueadas | 🔒 Gate responsável |
|--------|-------------|---------------------|----------------------|----------------------|
| **created** | Restaurante criado (bootstrap); ainda em configuração | /bootstrap, /app/select-tenant, /dashboard, /config/*, /app/billing, /app/publish | /op/tpv, /op/kds | RequireOperational (!isPublished) |
| **configured** | Identidade mínima existe; utilizador vinculado | Portal (dashboard, config, menu, billing, publish) | /op/tpv, /op/kds até published | RequireOperational |
| **published** | isPublished = true; publicado explicitamente | Portal + /op/tpv, /op/kds | — (operacional exige turno aberto para caixa) | RequireOperational libera; CASH_REGISTER exige operational |
| **operational** | Turno aberto (caixa aberta) | Portal + TPV/KDS + pedidos/pagamentos | — | CASH_REGISTER_LIFECYCLE |

## Estados de billing (governam operação quando aplicado)

| Estado | Significado | Efeito hoje |
|--------|-------------|-------------|
| trial / active | Permitido operar | RequireOperational **não** lê billing ainda; só isPublished. |
| past_due / suspended | Deveria bloquear operação | 🟡 Preparado (BILLING_SUSPENSION_CONTRACT); gate ainda não aplica. |

---

# 10) AUTORIDADE POR DECISÃO (quem decide o quê)

Quem tem autoridade final sobre cada decisão. Nenhuma IA deve inferir — está aqui.

| Decisão | Autoridade técnica | Onde vive |
|---------|--------------------|-----------|
| Criar restaurante | Frontend (BootstrapPage) via boundary | INSERT gm_restaurants + gm_restaurant_members (owner); DbWriteGate / Supabase conforme implementação |
| Publicar restaurante | Frontend + Core write | PublishPage chama setRestaurantStatus / persist; Core persiste isPublished |
| Operar TPV/KDS | RequireOperational + Runtime | Gate lê runtime.isPublished; Runtime espelha Core |
| Bloquear por billing | Core (futuro) | RequireOperational ainda não lê billingStatus; quando implementado, Core é fonte de billing |
| Resolver tenant | TenantContext (hoje) / FlowGate (desenhado) | TenantContext + SelectTenantPage; FlowGate.tsx existe mas não montado |
| Redirecionar por papel | RoleGate | App.tsx; bloqueia por role (staff → /garcom, etc.) |
| Escrita em gm_restaurants, installed_modules, setup_status | Core (via boundary) ou BootstrapPage (criação inicial) | RuntimeWriter / DbWriteGate; BootstrapPage única exceção para criação 1º restaurante |

---

# 11) SOBERANIA DE DADOS (DATA SOVEREIGNTY MAP)

Onde cada dado é escrito, lido e quem não pode escrever. Referência: Core schema, boundary (RuntimeReader, RuntimeWriter, DbWriteGate).

| Dado / tabela | Onde é escrito | Onde é lido | Quem não pode escrever | Mutável / imutável |
|---------------|----------------|-------------|-------------------------|---------------------|
| **gm_restaurants** | BootstrapPage (criação 1º); Core/boundary (atualizações, e.g. isPublished) | RuntimeReader, TenantContext (memberships), SelectTenantPage | UI direta (só via boundary) | Mutável (estado do restaurante) |
| **gm_restaurant_members** | BootstrapPage (owner); Core/boundary (novos membros) | TenantContext, TenantResolver, SelectTenantPage | UI direta | Mutável |
| **installed_modules** | Core/boundary (RuntimeWriter.insertInstalledModule) | RuntimeReader, RestaurantRuntimeContext | UI nunca escreve diretamente | Mutável |
| **restaurant_setup_status** | Core/boundary (RuntimeWriter.upsertSetupStatus) | RuntimeReader, RestaurantRuntimeContext | UI nunca escreve diretamente | Mutável |
| **orders** (Core) | Core (TPV/KDS, pedidos) | Core, leitura via boundary se existir | Frontend nunca escreve pedidos operacionais no Core sem boundary | Imutável após fechamento (conforme contrato) |
| **payments** (Core) | Core | Core, relatórios | Frontend nunca escreve pagamentos no Core | Imutável (conforme contrato) |
| **shifts** (turnos) | Core / ShiftContext conforme implementação | ShiftGuard, Runtime | UI não abre/fecha turno sem boundary | Mutável (estado do turno) |

---

# 12) FRONTEIRA CORE / RUNTIME / UI (visual)

Regras que nenhum dev nem IA pode violar.

| Camada | Papel | Regra |
|--------|--------|--------|
| **CORE** | Fonte de verdade; imutável para pedidos/pagamentos após fechamento | Nada no frontend sobrepõe o Core. Escrita só via boundary (RuntimeWriter, DbWriteGate). |
| **Runtime (RestaurantRuntimeContext)** | Espelho do Core no frontend | Lê/escreve **só** via boundary. Nunca inventa estado (ex.: isPublished vem do Core). |
| **UI (páginas, componentes)** | Reflexo do estado | Nunca muda estado financeiro diretamente. Nunca escreve em gm_restaurants, orders, payments sem boundary. |
| **Gates** | Aplicam contratos; bloqueiam ou liberam rotas | Nunca fazem write. Só leem (runtime, tenant, role) e redirecionam ou renderizam filhos. |

**Exemplos explícitos:** UI nunca muda estado financeiro. Runtime nunca inventa estado. Gates nunca fazem write.

**Contenção 48h:** [PILOT_MODE_RUNTIME_CONTRACT.md](./PILOT_MODE_RUNTIME_CONTRACT.md) (estado piloto fora do Core), [MENU_FALLBACK_CONTRACT.md](./MENU_FALLBACK_CONTRACT.md) (fallback local só quando Core falha), [OPERATIONAL_UI_RESILIENCE_CONTRACT.md](./OPERATIONAL_UI_RESILIENCE_CONTRACT.md) (ErrorBoundary e mensagens neutras em /op/).

---

# 13) FALHAS E RECUPERAÇÃO (caminhos de falha)

O que acontece quando algo falha. Sistemas são definidos pela falha controlada.

| Cenário | O que acontece | Mecanismo |
|---------|----------------|-----------|
| Tenant não resolve (0 tenants, timeout, erro) | Redirect /bootstrap ou /app/select-tenant; SelectTenantPage 0 → /bootstrap | TenantContext + SelectTenantPage |
| Runtime falha ou Core lento | runtime.loading = true; RequireOperational mostra "Verificando estado operacional..." | RestaurantRuntimeContext, RequireOperational |
| Rota não reconhecida (path sem match) | CoreResetPage (catch-all dentro RoleGate); página neutra de reset | App.tsx path="*" → CoreResetPage |
| Acesso a /op/tpv ou /op/kds sem published | RequireOperational bloqueia; "Sistema não operacional" + link /dashboard | RequireOperational |
| Billing entra em past_due no meio do turno | Hoje: **não bloqueia** (gate não aplica billing). Futuro: bloquear operação conforme BILLING_SUSPENSION_CONTRACT | RequireOperational (futuro) |
| Core não responde (rede) | UI usa fallback (menu/TPV/KDS conforme MENU_FALLBACK_CONTRACT e OPERATIONAL_UI_RESILIENCE_CONTRACT); nunca polui Core. | menuPilotFallback, ErrorBoundary, toUserMessage |
| Crash em componente /op/ | ErrorBoundary mostra fallback neutro (OPERATIONAL_UI_RESILIENCE_CONTRACT). | App.tsx ErrorBoundary em /op/tpv, /op/kds |

**O que nunca deve acontecer:** Operar TPV/KDS sem isPublished (bloqueado por RequireOperational). UI escrever em Core sem boundary. Gates fazer write.

**Estados "zombie" / read-only:** Não documentados como comportamento garantido no AS-IS; recovery complexo fica fora do escopo deste mapa (ver secção "O que deliberadamente NÃO está no mapa").

---

# 14) AMBIENTES / INSTALAÇÃO FÍSICA

Onde o sistema corre. Detalhe de instalação: [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) ou guia operacional (fora do AS-IS geral).

| Ambiente | Uso | Suportado AS-IS |
|----------|-----|------------------|
| **Web (portal)** | Landing, auth, dashboard, config, billing, publish | ✅ Sim |
| **Desktop Caixa (TPV fullscreen)** | /op/tpv em browser (ou PWA/shortcut) | ✅ Sim (Web App; fullscreen wrapper) |
| **Cozinha (KDS fullscreen)** | /op/kds em browser | ✅ Sim (Web App; fullscreen wrapper) |
| **Mobile staff** | Canal primário conceitual (APP_STAFF_MOBILE_CONTRACT); rotas /op/staff, /garcom | 🟡 Parcial (web; app nativo fora do escopo) |
| **O que não é suportado** | Instalação nativa iOS/Android TPV/KDS; kiosk dedicado; offline total | Documentado noutros contratos |

---

# 15) EVOLUÇÃO CONTROLADA (zonas: o que pode mudar vs proibido)

O que pode evoluir livremente, o que exige contrato novo, o que nunca deve mudar.

| Zona | O que inclui | Regra |
|------|----------------|--------|
| **Zona livre** | UI da landing, copy, wizards de onboarding, ManagementAdvisor (banners, checklists), rotas de demo/pricing/features | Pode mudar sem contrato novo. Não quebra soberania. |
| **Zona sensível** | Gates (RoleGate, RequireOperational), TenantContext, billing (quando implementado), SelectTenantPage, BootstrapPage (fluxo) | Exige contrato ou ADR para mudar. Testes críticos protegem. |
| **Zona soberana** | Core (Docker, schema, gm_restaurants, gm_restaurant_members, installed_modules, orders, payments), RuntimeReader/RuntimeWriter, CORE_FINANCIAL_SOVEREIGNTY_CONTRACT | Nunca mudar sem contrato. Migrations e boundary são a única interface. |

---

# 16) FLUXO COMPLETO DO CLIENTE (END-TO-END)

Passo a passo, alinhado a [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md).

1. **Landing (/)** — O visitante aterra em `/`. Página pública: não carrega Runtime nem Core. CTAs: "Entrar em operação" → `/signup`, "Já tenho conta" → `/auth`, "Ver demonstração" → `/demo`.

2. **Auth (/auth, /signup)** — `/signup` redireciona para `/auth?mode=signup`. O utilizador preenche email e palavra-passe e cria conta (Supabase Auth). Login em `/auth`. Não se cria restaurante nesta etapa.

3. **Pós-login** — Destino pretendido: portal (`/app/dashboard`). Como o utilizador pode ainda não ter tenant (restaurante), a resolução de tenant (TenantContext + redirecionamentos) encaminha: 0 restaurantes → bootstrap ou select-tenant; 1 restaurante → auto-select e dashboard; >1 → página de seleção.

4. **Bootstrap (/bootstrap)** — Se o utilizador não tiver nenhum restaurante, é encaminhado para `/bootstrap`. A BootstrapPage cria o primeiro registo em `gm_restaurants` e o membro owner em `gm_restaurant_members` (via boundary/DbWriteGate). Em seguida redireciona para `/app/dashboard` (ou `/dashboard`).

5. **Seleção de tenant (/app/select-tenant)** — Três casos: 0 tenants → redirect para `/bootstrap`; 1 tenant → auto-seleção e redirect para `/dashboard`; >1 → lista "Seus Restaurantes" e, após escolha, redirect para `/dashboard`. Persistência do tenant ativo via TenantContext/localStorage.

6. **Portal de gestão (/app\*)** — No dashboard o cliente acede a configuração (`/config/*`), cardápio (`/menu-builder`), operação (`/operacao`), perfis (employee/manager/owner), tasks, people, health, etc. O portal não bloqueia por billing; aconselha via ManagementAdvisor (banners/checklists).

7. **Billing (/app/billing)** — O cliente escolhe plano, adiciona cartão e inicia assinatura. Estados (billingStatus): trial, active, past_due, suspended. Billing nunca bloqueia configuração; pode bloquear operação (TPV/KDS) quando past_due ou suspended — hoje RequireOperational **não** aplica ainda esse bloqueio (apenas isPublished).

8. **Publicação (/app/publish)** — O cliente clica em "Publicar restaurante". Efeito: `isPublished = true`, o que libera acesso a TPV, KDS e presença online. Antes disso, a operação é bloqueada com mensagem "Sistema não operacional".

9. **Operação (/op/tpv, /op/kds)** — Com restaurante publicado, `/op/tpv` e `/op/kds` são desbloqueadas pelo RequireOperational. TPV no caixa e KDS na cozinha, em fullscreen (OperationalFullscreenWrapper). Instalação como Web App é NON-CORE (contratos de instalação operacional).

10. **Staff mobile (conceitual)** — O staff (garçom, cozinha, sala) usa app móvel (iOS/Android), não a web. As rotas `/op/staff`, `/garcom`, `/garcom/mesa/:tableId` expõem AppStaffMobileOnlyPage (web); o contrato APP_STAFF_MOBILE_CONTRACT define canal principal mobile.

---

# 17) MAPA DE ROTAS (AS-IS)

Tabela: Camada, Rota, Objetivo, Gate aplicado, Estado.
Apenas rotas que existem no código (App.tsx) e em ROTAS_E_CONTRATOS.

| Camada | Rota | Objetivo | Gate aplicado | Estado |
|--------|------|----------|----------------|--------|
| PUBLIC | `/` | Landing; CTAs signup/auth/demo | — | ✅ fechado |
| PUBLIC | `/pricing` | Página de preços | — | ✅ fechado |
| PUBLIC | `/features` | Página de funcionalidades | — | ✅ fechado |
| PUBLIC | `/demo` | Demonstração | — | ✅ fechado |
| PUBLIC | `/login` | Redirect → `/auth` | — | ✅ fechado |
| PUBLIC | `/signup` | Redirect → `/auth?mode=signup` | — | ✅ fechado |
| PUBLIC | `/forgot-password` | Redirect → `/auth` | — | ✅ fechado |
| PUBLIC | `/auth` | Login e signup (AuthPage) | — | ✅ fechado |
| PUBLIC | `/billing/success` | Callback pós-pagamento | — | ✅ fechado |
| PUBLIC | `/onboarding`, `/onboarding/:section` | Redirect → `/app/dashboard` | — | ✅ fechado |
| AUTH/MANAGEMENT | `/bootstrap` | Criação do primeiro restaurante + owner; destino dashboard | Nenhum (fora RoleGate) | 🟡 frágil |
| AUTH/MANAGEMENT | `/app/select-tenant` | Seleção de tenant (0→/bootstrap, 1→auto, >1→lista) | Nenhum (fora RoleGate) | 🟡 frágil |
| MANAGEMENT | `/app/dashboard` | Redirect → `/dashboard` | RoleGate | ✅ fechado |
| MANAGEMENT | `/dashboard` | Hub principal (DashboardPortal) | RoleGate | ✅ fechado |
| MANAGEMENT | `/app/billing` | Planos, assinatura (BillingPage) | RoleGate + ManagementAdvisor | ✅ fechado |
| MANAGEMENT | `/app/publish` | Publicar restaurante (PublishPage) | RoleGate + ManagementAdvisor | ✅ fechado |
| MANAGEMENT | `/app/install` | Instalar TPV/KDS (InstallPage) | RoleGate + ManagementAdvisor | ✅ fechado |
| MANAGEMENT | `/app/backoffice` | Backoffice | RoleGate + ManagementAdvisor | 🟡 frágil |
| MANAGEMENT | `/app/setup/*` | Redirects para menu-builder, operacao, config, op/* | RoleGate | ✅ fechado |
| MANAGEMENT | `/config`, `/config/*` | Configuração (ConfigLayout + Config*Page) | RoleGate | ✅ fechado |
| MANAGEMENT | `/menu-builder` | Cardápio (MenuBuilderMinimal) | RoleGate | ✅ fechado |
| MANAGEMENT | `/operacao` | Operação (OperacaoMinimal) | RoleGate + RequireOperational | 🟡 frágil |
| MANAGEMENT | `/employee/*`, `/manager/*`, `/owner/*` | Perfis e dashboards por papel | RoleGate + ManagementAdvisor | 🟡 frágil |
| MANAGEMENT | `/tasks`, `/people`, `/health`, `/alerts`, etc. | Dashboards de domínio | RoleGate + ManagementAdvisor | 🟡 frágil |
| MANAGEMENT | `/system-tree` | Árvore do sistema | RoleGate | 🟡 frágil |
| OPERATIONAL | `/op/tpv` | TPV (caixa) | RoleGate + RequireOperational | ✅ fechado |
| OPERATIONAL | `/op/kds` | KDS (cozinha) | RoleGate + RequireOperational | ✅ fechado |
| OPERATIONAL | `/op/cash` | Redirect → `/op/tpv` | RoleGate | ✅ fechado |
| OPERATIONAL | `/op/staff` | AppStaff web | RoleGate | 🟡 frágil |
| OPERATIONAL | `/tpv`, `/kds-minimal` | Redirects → `/op/tpv`, `/op/kds` | RoleGate | ✅ fechado |
| PUBLIC (restaurante) | `/public/:slug` | Site do restaurante | — (dentro AppWithRuntime) | ✅ fechado |
| PUBLIC (restaurante) | `/public/:slug/mesa/:number`, `/public/:slug/order/:orderId`, `/public/:slug/kds` | Mesa, ordem, KDS público | — | ✅ fechado |
| — | `/r/:slug` | Não implementado (canónico em CAMINHO_DO_CLIENTE; implementação usa `/public/:slug`) | — | 🔴 fragmentado |
| — | Catch-all (dentro RoleGate) | CoreResetPage (rota não reconhecida) | RoleGate | ✅ fechado |

**Legenda estado:** ✅ fechado = estável e alinhado a contrato; 🟡 frágil = depende de providers/gates ou sem testes suficientes; 🔴 fragmentado = não implementado ou inconsistente.

---

# 18) GATES E CONTROLO DE FLUXO (detalhe por gate)

Explicação clara de cada gate. Referência: [GATES_FLUXO_CRIACAO_E_OPERACAO.md](./GATES_FLUXO_CRIACAO_E_OPERACAO.md).

## RequireApp

- **Onde:** Componente em `merchant-portal/src/components/auth/RequireApp.tsx`. **Não está montado na árvore de App.tsx** (existe em código; referenciado noutros ficheiros/comentários).
- **O que faz (quando usado):** Garante sessão válida (Supabase) e tenant selecionado (localStorage `chefiapp_restaurant_id`). Se não houver sessão → redirect `/login`. Se não houver tenant → redirect `/bootstrap`.
- **Onde atuaria:** Em rotas que exigissem "app completo" (dashboard, settings, onboarding, tpv). Hoje o controlo de tenant e redirecionamento é feito por TenantContext e SelectTenantPage (e, no código de FlowGate, pela lógica desenhada para quando FlowGate estiver ativo).

## RoleGate

- **Onde:** Montado em App.tsx: `<Route element={<RoleGate />}>` envolve todas as rotas de gestão e operação (dashboard, config, /app/*, /op/*, etc.). Não envolve `/bootstrap`, `/app/select-tenant` nem rotas públicas.
- **O que faz:** Controlo por papel (role). Redireciona conforme o papel do utilizador (ex.: staff para /garcom, outros para /dashboard). Define quem acede a que path dentro do portal.
- **O que bloqueia:** Acesso a rotas protegidas se o papel não for permitido para esse path.

## FlowGate

- **Onde:** Código em `merchant-portal/src/core/flow/FlowGate.tsx`. **Não está montado na árvore de App.tsx** — existe em código e é referenciado em FLOW_CORE.md e documentação como "Executor"; a árvore atual usa TenantProvider + RoleGate sem FlowGate.
- **Comportamento desenhado (quando ativo):** Utilizador sem tenant selado → 0 tenants: redirect `/app/select-tenant` (SelectTenantPage envia 0 → `/bootstrap`); 1 tenant: auto-select e acesso `/app/*`; >1 tenants: redirect `/app/select-tenant` até escolha. Rotas isentas: `/bootstrap`, `/app/select-tenant`. Nenhuma rota `/app/*` (exceto isentas) monta sem tenantId + restaurantId selados (Sovereign Hard-Stop).
- **Estado real AS-IS:** A lógica de redirecionamento para bootstrap/select-tenant vive em TenantContext e em SelectTenantPage; não no FlowGate montado, porque FlowGate não está na árvore.

## RequireOperational

- **Onde:** Montado em App.tsx, envolvendo as rotas `/op/tpv`, `/op/kds`, `/operacao`, `/tpv-test`, etc. Ficheiro: `merchant-portal/src/components/operational/RequireOperational.tsx`.
- **O que faz:** Garante que o restaurante está publicado antes de permitir acesso a TPV/KDS. Se `runtime.loading` → mostra "Verificando estado operacional...". Se `!runtime.isPublished` → bloqueia: mostra "Sistema não operacional" e link para `/dashboard`; filhos não renderizados. Se `runtime.isPublished === true` → libera e renderiza filhos (TPV/KDS).
- **O que bloqueia:** Acesso a /op/tpv e /op/kds quando `isPublished === false`.
- **Preparado para o futuro:** O componente **não** lê `billingStatus`. O BILLING_SUSPENSION_CONTRACT prevê bloqueio quando `past_due` ou `suspended`; essa verificação está preparada para implementação futura (testes TDD em RequireOperationalBilling.test.tsx em skip até lá).

---

# 19) CORE E FRONTEIRAS

## O que é o CORE

- Fonte de verdade financeira e operacional. Governa pedidos, totais, pagamentos, reconciliação, estado do restaurante (installed_modules, restaurant_setup_status, gm_restaurants, gm_restaurant_members, etc.).
- **Onde vive:** Docker (PostgREST); schema e migrations definidos. Acesso a partir do merchant-portal via **core-boundary**: RuntimeReader, RuntimeWriter, RestaurantReader, DbWriteGate, dockerCoreClient (connection.ts). Supabase é usado para **auth** e, em partes do fluxo, para dados (ex.: BootstrapPage pode usar Supabase para gm_restaurants/gm_restaurant_members conforme implementação).

## O que NÃO é CORE

- Landing, auth UI, portal de gestão (UI), gates de navegação (RoleGate, RequireOperational), TenantContext, ManagementAdvisor. Instalação de TPV/KDS como Web App é NON-CORE (contratos operacionais de instalação).

## O que está fechado e não deve ser tocado sem contrato

- Esquema e migrations do docker-core; soberania financeira (CORE_FINANCIAL_SOVEREIGNTY_CONTRACT).
- Boundary de leitura/escrita (RuntimeReader, RuntimeWriter) para estado do restaurante e módulos. Criação de restaurante (INSERT gm_restaurants + owner) é feita no cliente (BootstrapPage) via boundary/DbWriteGate; não existe RPC "create_restaurant" no Core.

---

# 20) CONTRATOS EXISTENTES (tabela completa)

Tabela: Nome do contrato, Camada, O que governa, Estado.
Fontes: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md), [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md).

| Nome do contrato | Camada | O que governa | Estado |
|------------------|--------|---------------|--------|
| CORE_RUNTIME_AND_ROUTES_CONTRACT | INFRA | Runtime 5175, rotas oficiais, host/porta | ativo |
| CAMINHO_DO_CLIENTE | Produto | Fluxo: landing → signup → portal → billing → publish → operação | ativo |
| PUBLIC_SITE_CONTRACT | PUBLIC | Rotas públicas; sem Runtime/Core | ativo |
| AUTH_AND_ENTRY_CONTRACT | AUTH | Login/signup → destino dashboard | ativo |
| RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT | AUTH/MANAGEMENT | /bootstrap; criação 1º restaurante + owner | ativo |
| TENANT_SELECTION_CONTRACT | AUTH/MANAGEMENT | /app/select-tenant; 0/1/N tenants | ativo |
| PORTAL_MANAGEMENT_CONTRACT | MANAGEMENT | /app/*; gestão; nunca bloqueia | ativo |
| RESTAURANT_LIFECYCLE_CONTRACT | MANAGEMENT | configured / published / operational | ativo |
| BILLING_SUSPENSION_CONTRACT | MANAGEMENT/OPERATIONAL | Estados billing; bloqueio operação quando past_due/suspended | parcial (gate não aplica billing ainda) |
| CORE_BILLING_AND_PAYMENTS_CONTRACT | MANAGEMENT | /app/billing, /billing/success | ativo |
| OPERATIONAL_ROUTES_CONTRACT | OPERATIONAL | /op/tpv, /op/kds, /op/cash, /op/staff | ativo |
| OPERATIONAL_GATES_CONTRACT | OPERATIONAL | published para TPV/KDS | ativo (só isPublished; billing futuro) |
| OPERATIONAL_INSTALLATION_CONTRACT, OPERATIONAL_APP_MODE_CONTRACT, OPERATIONAL_INSTALL_FLOW_CONTRACT | OPERATIONAL | Instalação Web App TPV/KDS (NON-CORE) | ativo |
| CORE_TPV_BEHAVIOUR_CONTRACT, CORE_KDS_CONTRACT | CORE/OPERATIONAL | Comportamento TPV/KDS | ativo |
| CORE_PUBLIC_WEB_CONTRACT | PUBLIC (restaurante) | /public/:slug (site do restaurante) | ativo |
| CORE_FINANCIAL_SOVEREIGNTY_CONTRACT | CORE | Docker Core soberano; Supabase não é Core | ativo |
| APPLICATION_BOOT_CONTRACT | INFRA | Modos PUBLIC / AUTH / MANAGEMENT / OPERATIONAL | ativo |
| MANAGEMENT_ADVISOR_CONTRACT, READY_TO_PUBLISH_CHECKLIST | MANAGEMENT | Banners/checklists; não bloqueia | ativo |
| APP_STAFF_MOBILE_CONTRACT | OPERATIONAL | Staff mobile only; web /op/staff se existir | parcial |

**Legenda estado:** ativo = em uso e aplicado; parcial = em uso mas com parte não implementada (ex.: billing no gate); futuro = preparado em doc/teste mas não implementado.

---

# 21) TESTES (ESTADO REAL)

Mapeamento do que existe. Referências explícitas aos testes críticos.

## E2E (Playwright)

| Ficheiro | Escopo | Estado |
|----------|--------|--------|
| **tests/e2e/create-first-restaurant.spec.ts** | Signup → bootstrap → dashboard; não mostrar CoreResetPage | ✅ Crítico; a passar |
| **tests/e2e/publish-to-operational.spec.ts** | Bloqueio /op/tpv e /op/kds sem publicar; cenários "após publicar" em skip | ✅ Parcial (bloqueio coberto; pós-publicar em skip) |
| tests/e2e/sovereign-navigation.spec.ts | Navegação soberana | Existente |
| tests/e2e/sovereign-tpv.spec.ts | TPV soberano | Existente |
| tests/e2e/immutable_shift_check.spec.ts | Turno imutável | Existente |
| tests/e2e/supreme_chaos_saturday.spec.ts | Chaos | Existente |
| src/tests/canon.spec.ts | Nervous system, /app/staff | Existente |
| e2e/* (route_walkthrough, antigravity, human_audit, etc.) | Vários walkthroughs | Existente |

## Unit (Vitest)

| Ficheiro | Escopo | Estado |
|----------|--------|--------|
| **src/pages/SelectTenantPage.test.tsx** | SelectTenantPage (0/1/N tenants): loading, redirect /bootstrap, switchTenant+navigate, "Seus Restaurantes" | ✅ Crítico; a passar |
| **src/components/operational/RequireOperationalBilling.test.tsx** | RequireOperational: loading, bloqueio quando !isPublished, liberação quando isPublished; 2 cenários billing (past_due, suspended) em **skip** (TDD futuro) | ✅ Crítico; a passar (billing em skip) |
| **src/core/tenant/TenantResolver.test.ts** | resolveTenant (NO_TENANTS, RESOLVED, NEEDS_SELECTION, UNAUTHORIZED), validateTenantAccess, hasPermission | ✅ Crítico; a passar |
| src/core/flow/OperationGate.test.tsx | OperationGate (estado operacional) | Existente |
| src/core/flow/CoreFlow.test.ts | CoreFlow (resolução de rota) | Existente |
| src/core/roles/rolePermissions.test.ts, normalizePath.test.ts | Permissões e paths | Existente |
| src/components/config/ConfigSidebar.test.tsx | ConfigSidebar | Existente |
| src/pages/TPV/KDS/KDS.test.tsx | KDS | Existente |
| src/core/events/CoreExecutorInventory.test.ts, tests/core/CoreExecutor*.test.ts | CoreExecutor | Existente |
| Outros (DashboardService, SyncEngine, HungerEngine, RecipeMapping, HardeningP0, LegalSeal, EventStore, MetabolicEngine, contract.spec.ts, zombie-task.spec.ts) | Vários domínios | Existente |

## Testes críticos já a passar

- **create-first-restaurant.spec.ts** — E2E criação 1º restaurante; não mostrar CoreResetPage.
- **SelectTenantPage.test.tsx** — Unit SelectTenantPage (0/1/N).
- **RequireOperationalBilling.test.tsx** — Unit RequireOperational (loading, isPublished); cenários de billing em skip.
- **TenantResolver.test.ts** — Unit TenantResolver (resolveTenant, validateTenantAccess, hasPermission).
- **publish-to-operational.spec.ts** — E2E bloqueio /op/tpv e /op/kds sem publicar; cenários "após publicar" em skip.

## Testes em skip (TDD futuro)

- RequireOperationalBilling.test.tsx: "blocks when isPublished true but billingStatus is past_due"; "blocks when isPublished true but billingStatus is suspended".
- publish-to-operational.spec.ts: "após publicar: /op/tpv exibe TPV"; "após publicar: /op/kds exibe KDS".

---

# 22) ESTADO DO SISTEMA (sólidas vs frágeis)

## Áreas sólidas (não mexer sem contrato)

- **PUBLIC (Landing):** Rotas estáveis; sem Runtime/Core; PUBLIC_SITE_CONTRACT cumprido.
- **OPERATIONAL (/op):** Rotas /op/tpv e /op/kds fechadas; RequireOperational estável (isPublished); TPV/KDS com wrapper fullscreen; contratos OPERATIONAL_* e CORE_TPV/KDS alinhados.
- **CORE (docker-core):** Esquema e migrations; boundary claro (RuntimeReader, RuntimeWriter, DbWriteGate); soberania financeira documentada.
- **Auth + bootstrap + select-tenant:** Rotas `/bootstrap` e `/app/select-tenant` existem e fecham o fluxo de criação e seleção; contratos RESTAURANT_CREATION_AND_BOOTSTRAP e TENANT_SELECTION indexados.

## Áreas frágeis (atenção especial)

- **MANAGEMENT (/app):** Muitas rotas e páginas; dependência de TenantProvider + RoleGate; testes escassos para BillingPage, PublishPage, DashboardPortal, Config.
- **INFRA (Providers/Gates):** FlowGate existe em código mas **não está na árvore** de App.tsx; RequireApp não está montado em App.tsx. Lógica de redirecionamento para bootstrap/select-tenant vive em TenantContext e SelectTenantPage.
- **Billing no gate:** RequireOperational não aplica BILLING_SUSPENSION_CONTRACT (não bloqueia por past_due/suspended); testes TDD em skip.
- **TESTS:** Cobertura fragmentada; domínios críticos (auth UI, billing UI, publish UI, fluxo E2E pós-publicar) com poucos ou nenhum teste dedicado.

---

# 23) O QUE ESTE DOCUMENTO NÃO É

- **Não é contrato.** Não substitui contratos existentes. Qualquer regra de comportamento, rota ou gate deve ser confirmada nos contratos (CORE_CONTRACT_INDEX, ROTAS_E_CONTRATOS) e nos ficheiros de contrato listados.
- **Não é plano futuro.** Não descreve roadmaps, features por fazer nem refactors desejados; descreve apenas o estado atual (AS-IS).
- **Não é refactor.** Não prescreve alterações de código nem de estrutura.
- **Não muda comportamento.** Este documento é apenas leitura; não altera o funcionamento do sistema.
- **Serve apenas como mapa de orientação e alinhamento** para humanos e IA: entender todo o ChefIApp numa leitura, sem precisar abrir o código.

### O que deliberadamente NÃO está no mapa (outras camadas)

Estas não são falhas do documento; são camadas acima ou ao lado do AS-IS arquitetural. Incluí-las aqui poluiria o mapa e diluiria a soberania.

| O que não está aqui | Onde vive (ou viveria) |
|--------------------|-------------------------|
| **ADR (decisões arquiteturais)** — Por que FlowGate não está montado? Por que billing não bloqueia portal? Por que bootstrap cria restaurante no frontend? | ADR / histórico de decisões (outro documento). |
| **State machine do restaurante** — draft / configured / published; billing trial / active / past_due / suspended; operational allowed / blocked. Diagrama único de estados e transições. | Ex.: RESTAURANT_STATE_MACHINE.md (não AS-IS geral). |
| **Mapa de dados** — Tabelas ↔ domínios (gm_restaurants, gm_restaurant_members, installed_modules, shifts, orders, payments). | Modelo de dados / Core schema (outro nível). |
| **Mapa de instalação física** — Desktop / iPad / kiosk; Safari “Add to Home Screen”, Chrome app shortcut; iOS vs Windows vs Android. | OPERATIONAL_INSTALLATION_GUIDE ou equivalente (não arquitetura). |
| **Observabilidade / falhas** — O que loga? O que alerta? Onde quebra silenciosamente? Como debugar produção? | Operational excellence (não AS-IS arquitetural). |

---

## Referências rápidas

| Documento | Uso |
|-----------|-----|
| [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) | Fluxo do cliente (contrato produto) |
| [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) | Índice rota → contrato |
| [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) | Índice geral de contratos |
| [GATES_FLUXO_CRIACAO_E_OPERACAO.md](./GATES_FLUXO_CRIACAO_E_OPERACAO.md) | Comportamento atual dos gates (bootstrap, tenant, RequireOperational) |
| [MAPA_MENTAL_ESTADO_ATUAL_AS_IS.md](../audit/MAPA_MENTAL_ESTADO_ATUAL_AS_IS.md) | Mapa mental por camada (detalhe) |
| [CHECKLIST_VERIFICACAO_CRIACAO_RESTAURANTE.md](../audit/CHECKLIST_VERIFICACAO_CRIACAO_RESTAURANTE.md) | Checklist do fluxo de criação de restaurante |
| [DIAGRAMAS_SOBERANIA_CHEFIAPP.md](./DIAGRAMAS_SOBERANIA_CHEFIAPP.md) | Diagramas Mermaid: state machine, autoridade, fronteira Core/Runtime/UI |
| [AUDITOR_MUDANCAS_SOBERANIA.md](./AUDITOR_MUDANCAS_SOBERANIA.md) | Verificar se uma PR viola algum eixo: checklist + `scripts/auditor-soberania.sh` |
