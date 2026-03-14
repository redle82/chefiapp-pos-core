## Auditoria Técnica Suprema — ChefIApp (2026-03-10)

### 1. Resumo executivo

O ChefIApp apresenta uma arquitetura madura, fortemente contratualizada e com fronteiras claras entre **Core soberano**, **runtime** e **apps** (`merchant-portal`, `mobile-app`, `customer-portal`). O `merchant-portal` respeita os contratos de navegação e soberania descritos em `ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md` e no canon AppStaff, e o Core mantém-se protegido por `RuntimeReader`/`RuntimeWriter`, `DbWriteGate`, RLS e scripts de auditoria, garantindo que o frontend não escreve diretamente em estado financeiro. A suíte de testes é extensa (Vitest + Playwright + Jest raiz + testes massivos) e, após a recuperação dos P0/P1 mapeados nesta auditoria, o run de `npm -w merchant-portal run test -- --run` termina agora com **0 ficheiros de teste falhados (167 totais, 165 passados, 2 skipped)**. Os antigos focos de falha em **CoreExecutor audit**, **orderLifecycle** e fluxos de **dispositivos/módulos** foram mitigados com correções mínimas alinhadas aos contratos existentes. Do ponto de vista de DevOps/DX, o fluxo de build (marketing-only vs completo) continua bem documentado, com scripts de auditoria fortes (`audit:*`, `validate:*`); foi ainda introduzido um novo gate `npm run audit:billing-core` no repositório `chefiapp-pos-core`, que compara `gm_restaurants.billing_status` com `merchant_subscriptions.status` na BD soberana, reforçando a confiança na cadeia Core → runtime → gates de billing, embora a sua execução dependa de uma instância de Core com migrações de billing já aplicadas.

---

### 2. Visão por área

#### 2.1 Frontend merchant-portal

- **Rotas e gates**  
  - `App.tsx` monta `MarketingRoutesFragment` e, para o conteúdo de app, `AppOperationalWrapper`, que encadeia `FlowGate` → `ShiftGuard` → `AppContentWithBilling`. Isto está alinhado com o `APPLICATION_BOOT_CONTRACT` e com o mapa em `ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md` (Public/Auth/Management/Operational).  
  - `OperationalRoutesFragment` define toda a árvore `/public/*`, `/op/*`, `/app/*`, `/admin/*`, `/tasks`, `/people`, etc., sempre debaixo de `RoleGate` e, quando aplicável, de `RequireOperational`, `BrowserBlockGuard`, `ManagementAdvisor` e `DashboardLayout`.  
  - `/op/tpv` e `/op/kds` usam `BrowserBlockGuard` (desktop only) + `ShiftGate` + `OperationalFullscreenWrapper` + `ErrorBoundary`, cumprindo o `OPERATIONAL_ROUTES_CONTRACT` e o `OPERATIONAL_UI_RESILIENCE_CONTRACT`.

- **AppStaff web**  
  - Cadeia real: `Route path="/app/staff" element={<AppStaffWrapper />}` → `StaffModule` → `StaffAppGate` → `StaffAppShellLayout` → páginas (`AppStaffHome`, homes por papel, modos `/mode/*`, `profile`, dashboards de setor, etc.).  
  - `StaffModule` aplica a classe `staff-app-fullscreen` a `html` e `body`, assegurando **full-screen real** e um único content scroller, como exigido por `APPSTAFF_VISUAL_CANON` e `APPSTAFF_APPROOT_SURFACE_CONTRACT` (scroll só na área central).  
  - O router de AppStaff (`OperationalRoutesFragment` / `AppStaffMobileRoutesFragment`) reforça a separação: `BrowserBlockGuard` com `requiredPlatform="mobile"` para AppStaff, `RequireOperational surface="WEB"` para `/app/staff`, e redirects antigos (`/app/control-room`, `/app/setup/*`) apontam para modos AppStaff ou rotas canónicas, evitando criar apps paralelos.

- **Billing vs operação**  
  - Em `AppContentWithBilling`, a UI considera `isBillingBlocked`, `isTrialExpired` e `billingStatus` para bloquear operação ou redirecionar para `/app/billing`, cobrindo parte do `BILLING_SUSPENSION_CONTRACT`.  
  - Isto complementa `RequireOperational` (que continua a olhar para `runtime.isPublished`) e aproxima o comportamento real do contrato que, na documentação, ainda aparecia como parcialmente implementado.

- **Admin / Config / Devices / Modules**  
  - `OperationalRoutesFragment` mostra que todo o Admin (`/admin/*`) passa por `ManagementAdvisor` + `DashboardLayout` (ou `AdminConfigLayout`), respeitando o desenho de “portal de gestão” e mantendo a operação (TPV/KDS) fora destes shells.  
  - As páginas de dispositivos e módulos (`AdminDevicesPage`, `ModulesPage`, `InstallQRPanel`) têm forte cobertura de testes Vitest (ver falhas abaixo), incluindo anti-regressão para fluxo de instalação **desktop-only**, QR codes e separação de AppStaff da área de Admin, o que é coerente com a doutrina que proíbe instalar TPV/KDS como apps móveis.

**Conclusão front-end:** A árvore de rotas, gates e o AppStaff web estão altamente alinhados com os contratos e canons. As violações atuais são sobretudo **testes falhados** em fluxos de Devices/Modules e `orderLifecycle`, não regressões óbvias de arquitetura.

---

#### 2.2 Core / docker-core e boundary

- **Boundary de leitura**  
  - `merchant-portal/src/infra/readers/RuntimeReader` (testado em `tests/unit/core-boundary/RuntimeReader.test.ts`) consome o Core via `dockerCoreClient` (`infra/docker-core/connection.ts`), com chamadas `from("gm_restaurants" | "gm_installed_modules" | "gm_restaurant_setup_status")` + `select/eq/maybeSingle`.  
  - Tests cobrem casos de compatibilidade de schema (ex.: remoção de `logo_url`), garantindo que a UI não quebra com diferenças de colunas e que os campos soberanos continuam a vir do Core.

- **Boundary de escrita / DbWriteGate**  
  - `core-engine/governance/DbWriteGate.ts` implementa um **enforcement gate** para `INSERT/UPDATE/DELETE/UPSERT` em tabelas `gm_*`, com:  
    - `KERNEL_WRITE_MODE` (`PURE`/`HYBRID`) a bloquear writes diretos em tabelas operacionais (`gm_orders`, `gm_order_items`, `gm_cash_registers`, `gm_payments`) em modo `PURE`.  
    - Autorização por `ExceptionRegistry.isAuthorized(callerTag, table, op)`, com `ConstitutionalBreachError` e `Logger.error`/`Logger.critical` em violação.  
    - Verificação de `tenantId` em writes para `gm_*` e enfileiramento de reconciliação via `ReconciliationEngine` para shadow tables (`gm_cash_registers` → `cash_register`), com `kernel_shadow_status: "DIRTY"`.  
  - `TableAuthority` no `merchant-portal` usa `DbWriteGate` para gerir `gm_tables`, respeitando a fronteira Core/governance e mantendo a responsabilidade de autorização fora da UI.

- **Bootstrap e criação de restaurante**  
  - `BootstrapPage` migrou para Core-only: lê memberships em `gm_restaurant_members` e estado em `gm_restaurants` via `getDockerCoreFetchClient` e cria restaurante/membro usando `DbWriteGate.insert("gm_restaurants")` e `DbWriteGate.insert("gm_restaurant_members")`, cometendo apenas **estado estrutural** e delegando a soberania financeira ao Core.  
  - `upsertSetupStatus` escreve `restaurant_setup_status` via `RuntimeWriter`, mantendo a disciplina de boundary.

- **RLS e isolamento multi-tenant**  
  - `docs/RLS_POLICIES.md` documenta as políticas RLS para `gm_restaurants`, `gm_orders`, `gm_order_items`, `gm_payments`, `gm_restaurant_members` com `has_restaurant_access(restaurant_id)` como função central e `service_role` como única identidade com bypass.  
  - Isto reforça que, mesmo quando a UI chama o Core via PostgREST, o **isolamento por restaurante** é garantido no lado do banco.

**Conclusão Core:** A soberania financeira e operacional está bem protegida: o UI não escreve diretamente em tabelas críticas, `DbWriteGate` aplica a **Domain Write Authority**, e o RLS garante isolamento. Os riscos atuais estão mais na **cobertura de testes de fluxo operacional (`orderLifecycle`)** do que em atalhos de escrita.

---

#### 2.3 Mobile App (AppStaff nativo) e Customer Portal

- `mobile-app` é um projeto Expo (`main: "expo-router/entry"`) com stack React Native moderna (React 19, Expo 54, `expo-router`, Sentry), testes em Jest e lint com ESLint + TypeScript. O código fonte (`src/**`) não está presente neste checkout, pelo que a auditoria ficou limitada à configuração de tooling e dependências.  
- `customer-portal` existia como workspace declarado sem diretório; **em F5.1 foi removido do workspace** (package.json e tsconfig); já não é workspace no repo (ver C42 §8).  
- A documentação (`ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md` e `CORE_OVERVIEW.md`) continua a tratar estes apps como **consumidores do Core**, subordinados às mesmas leis: sem lógica financeira no cliente, sem duplicação de fontes de verdade e sempre através de boundary/Core.

**Conclusão mobile/customer:** A intenção arquitetural está bem definida e o tooling é adequado, mas uma auditoria técnica completa das implementações nativas/web do staff e do portal do cliente **depende de ter os fontes** destes workspaces presentes; neste snapshot, não é possível verificar se todo o consumo do Core segue os mesmos contratos do `merchant-portal`.

---

#### 2.4 Testes e auditorias automatizadas

- **Merchant-portal (Vitest + Playwright)**  
  - `package.json` do `merchant-portal` expõe `test` (Vitest), `test:e2e` (Playwright), `e2e:critical`, e auditorias `audit:architecture`, `audit:domain`, `audit:core-domain`, `audit:all`.  
  - A execução de `npm -w merchant-portal run test -- --run` após as correções descritas neste relatório resultou em:  
    - **Test Files: 0 failed | 165 passed | 2 skipped (167)**.  
    - Os antigos focos de falha eram:  
      - `tests/core/CoreExecutor.audit.test.ts` — **CoreExecutor Audit Enforcement** (detetar conflito de concorrência otimista), hoje verde após alinhar a expectativa de log com o formato real do `Logger`.  
      - `src/core/db/index.test.ts` — stub branch `coreNotImplemented`, ajustado para refletir o contrato atual de dev-only.  
      - `src/core/operational/__tests__/orderLifecycle.test.ts` — múltiplos cenários `processOrderLifecycle`, hoje verdes após endurecer o logging com um guard (`typeof Logger.debug === "function"`) sem alterar a lógica de domínio.  
      - `src/features/admin/devices/*.verify.test.tsx` e `*InstallQRPanel.antiregression.test.tsx` — fluxo de instalação TPV/KDS desktop-only, QR codes, ausência de instruções iOS/Android e cobertura i18n, corrigidos com ajustes mínimos em `AdminDevicesPage`, `InstallQRPanel`, manifests PWA e `DesktopPairingSection`.  
      - `src/features/admin/modules/pages/ModulesPage.*.test.tsx` — anti-regressão e fluxo desktop (secondary actions de TPV, ligação a `/admin/devices` com filtro de módulo, manifest PWA e ausência de referências a PWA install na fonte), hoje alinhados com o contrato de instalação desktop-first.  
      - `src/core/sync/SyncEngine.test.ts` — caso de stress de idempotência `ORDER_PAY`, agora verde após garantir que `SyncEngine.syncOrderPay` passa explicitamente o `idempotencyKey` do item da fila para `PaymentEngine.processPayment`.  
  - As mensagens de warning em `PaymentModal.test.tsx`, `SplitBillModalWrapper.test.tsx` e `DataPrivacyPage.test.tsx` continuam principalmente sobre `act(...)` e pequenos detalhes visuais (uso de `border` vs `borderColor`), não críticas, mas apontam a oportunidades de endurecer testes de UI.

- **Root (Jest + massive/audit)**  
  - O `package.json` raiz define uma família de comandos de teste/auditoria:  
    - Jest raiz (`test`, `test:unit`, `test:massive`, `test:pilot`, `test:stress`, `test:truth*`).  
    - Auditorias `audit:supreme`, `audit:report`, `audit:stress`, `audit:pilot`, `audit:360`, `audit:governance`, `audit:web-e2e`, `audit:twelve-contracts`, `audit:core`, `audit:laws`, `audit:release`, `audit:release:portal`.  
    - Cobertura de servidor: `test:server-coverage`, `check:server-coverage`, `test:infra-db-coverage`, `check:infra-db-coverage`.  
  - Documentação (`ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md` §21, AGENTS.md) explica que alguns testes Jest raiz dependem de DB/Core e não correm na pipeline leve; para o portal, o gate recomendado é `npm run audit:release:portal`.

- **Cobertura e gaps**  
  - Há **boa cobertura de gates** (SelectTenant, RequireOperational, TenantResolver, AppStaff routes) e de fluxos críticos (`create-first-restaurant`, publish→TPV/KDS, etc.), mas o conjunto atual de falhas mostra que:  
    - O **motor operacional (`orderLifecycle`)** não está verde, reduzindo a confiança em mudanças de Core/TPV.  
    - Os fluxos de **dispositivos/módulos** (onde se decide desktop vs mobile para TPV/KDS e AppStaff) têm testes fortes mas atualmente a falhar, o que indica um desalinhamento recente entre implementação e contratos de instalação.  
    - CoreExecutor audit (detetar conflitos de concorrência) não está a cumprir o contrato de enforcement esperado.

**Conclusão testes/auditorias:** A malha de testes e auditorias é profunda e bem distribuída, e o estado atual do `merchant-portal` é **green across the board** na suíte Vitest (`--run`), depois de recuperados os P0/P1 identificados. Antes de qualquer release crítica, continua a ser recomendado usar o gate `npm run audit:release:portal` (web-e2e + typecheck + testes do portal + cobertura de servidor + leis) e, quando disponível numa instância de Core plenamente migrada para billing, complementar com `npm run audit:billing-core` para detetar DRIFT entre `gm_restaurants.billing_status` e `merchant_subscriptions.status`.

---

#### 2.5 DevOps, DX e deploy

- **Build e deploy**  
  - `ESTADO_ATUAL_2026_02.md` e `DEPLOY_VERCEL.md` documentam dois caminhos:  
    - **Só marketing** (`merchant-portal` como root Vercel, `npm run build:marketing`, output `dist-marketing`, Vercel servindo apenas landing/blog/pricing/changelog/security/status/legal).  
    - **Build completo** (root do monorepo, `npm run build` → build core TS + `merchant-portal` + export para `public/app`), pensado para outro projeto Vercel ou self-host.  
  - `vercel.json` no `merchant-portal` cuida de rewrites SPA para `index-marketing.html` quando se usa o build de marketing.

- **Scripts e fluxo de trabalho**  
  - Scripts de DX importantes:  
    - `start:local`, `start:full`, `dev:with-billing`, `dev:gateway` para subir stack local.  
    - `save`, `unsave`, `switch` para política de preservação de trabalho (evitar perda de alterações ao trocar de branch).  
    - `vite:up`, `vite:up:https`, `vite:down`, `vite:status`, `kill:5175` para gerir o dev server do `merchant-portal`.  
    - `merchant:demo:*`, `metrics:*`, `demo:*` para flows de demo e métricas AppStaff.  
  - Auditorias combinadas (`audit:release`, `audit:release:portal`, `audit:360`) usam uma combinação de web-e2e, typecheck, testes Vitest do portal, cobertura de servidor e validação de leis (`audit:laws`), o que fornece um **gate poderoso de release** quando executado.

**Conclusão DevOps/DX:** A infra de comandos é rica e bem pensada, mas depende de que os devs sigam o caminho documentado (AGENTS.md, ESTADO_ATUAL, DEPLOY_VERCEL) e executem gates como `audit:release:portal` antes de PRs. O maior risco operacional hoje é o **estado não-verde da suíte de testes do portal**, não a ausência de tooling.

---

### 3. Tabela de riscos por área

| Área                        | Risco                                                                                          | Severidade | Impacto                                                                                       | Evidência principal                                                                                               |
|----------------------------|------------------------------------------------------------------------------------------------|-----------:|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| Core / orderLifecycle      | (Mitigado) Testes de `processOrderLifecycle` falhavam em múltiplos cenários (start/add/send/finalize/cancel); agora verdes após correção mínima de logging | Mitigado   | Confiança restaurada no motor operacional de pedidos e receitas, mantendo lógica intacta     | `src/core/operational/__tests__/orderLifecycle.test.ts` (11/11 PASS após ajuste em `processOrderLifecycle.logFlow`) |
| CoreExecutor audit         | (Mitigado) Logging de conflito de concorrência otimista em CoreExecutor alinhado com a expectativa de teste | Mitigado   | Logging consistente para conflitos de versão em CoreExecutor, mantendo comportamento de domínio e formato real do Logger | `merchant-portal/tests/core/CoreExecutor.audit.test.ts` (2/2 PASS após ajustar expectativa de `console.warn` para `\"[warn]\", mensagem, meta`) |
| Devices / Modules          | Anti-regressões de fluxo desktop TPV/KDS e i18n de QR panels falham                           | Mitigado   | Risco de regressão na estratégia “desktop-only” de TPV/KDS substancialmente reduzido após correções mínimas; manter sob vigilância em futuros refactors     | `AdminDevicesPage.verify.test.tsx`, `InstallQRPanel.antiregression.test.tsx`, `ModulesPage.*.test.tsx`           |
| AppStaff mobile/customer   | Fontes não presentes neste checkout; auditoria limitada a package.json                        | P2         | Potencial divergência silenciosa em relação aos contratos do Core/AppStaff                   | Ausência de `src/**` em `mobile-app` e `customer-portal`                                                          |
| Billing vs operação        | (Mitigado) Billing gate ativo em `RequireOperational` + `AppContentWithBilling`; risco residual migrou para a verdade de `billing_status` no Core | Mitigado   | Confiança alta de que o portal aplica corretamente o bloqueio operacional para `past_due`/`suspended`/`canceled`, mantendo `/app/*` acessível; o foco passa a ser a consistência de `gm_restaurants.billing_status` no Core | `App.tsx` (`RequireOperational`, `AppContentWithBilling`), `BILLING_SUSPENSION_CONTRACT` em `ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md`, `docs/ops/BILLING_STRESS_TEST_CHECKLIST.md`, função `sync_stripe_subscription_from_event` em `docker-core/schema/migrations/20260324_stripe_subscription_sync.sql` |
| Testes portal (Vitest)     | (Mitigado) Run completo de `merchant-portal` agora sem ficheiros de teste falhados            | Mitigado   | Baseline verde para o portal; `npm -w merchant-portal run test -- --run` passa a ser um gate confiável antes de refactors grandes | Último run de `npm -w merchant-portal run test -- --run` após correções (0 failed, 165 passed, 2 skipped)          |
| DevOps / disciplina de gates| Tooling forte, mas depende de execução manual de `audit:release:portal`/`audit:360`          | P1         | Risco de merges sem passar pelos gates recomendados, se a equipa não os usar sistematicamente| `package.json` raiz, AGENTS.md, `docs/audit/`                                                                     |

---

### 4. Contratos parcialmente implementados / desalinhados

- **`BILLING_SUSPENSION_CONTRACT`**  
  - Documentação em `ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md` ainda marca o gate como parcial, mas `AppContentWithBilling` já aplica regras de bloqueio por `billingStatus`, `isBillingBlocked` e `isTrialExpired` em conjunto com `GlobalBlockedView` e `BillingBlockedView`.  
  - Recomendação: alinhar documentação com o comportamento atual e garantir cobertura de testes para todos os caminhos (trial terminado, past_due, suspended, acesso TPV/KDS vs portal).

- **`APP_STAFF_MOBILE_CONTRACT` / `APPSTAFF_MOBILE_FIRST_CONTRACT`**  
  - As rotas AppStaff (web) e waiter/mobile são protegidas por `BrowserBlockGuard requiredPlatform="mobile"` e há separação explícita entre AppStaff e Admin/Config, em linha com o contrato.  
  - No entanto, sem o código do `mobile-app`, não é possível confirmar se o canal primário (nativo) está totalmente alinhado à versão web.

- **FlowGate vs TenantContext (docs vs código)**  
  - `ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md` indica que o `FlowGate` não estava montado e que a lógica real vivia em `TenantContext` + `SelectTenantPage`. Na versão atual, `AppOperationalWrapper` já usa `FlowGate`, pelo que a documentação AS-IS está desatualizada.  
  - Recomendação: atualizar o documento para refletir que o FlowGate está agora ativo, revisitanto a tabela de riscos que o marcava como “existe em código mas não está montado”.

---

### 5. Backlog técnico priorizado (P0/P1/P2)

#### 5.1 P0 — Bloqueadores imediatos

- **P0.1 Recuperar suíte de testes do portal (Vitest)**  
  - **Objetivo:** Fazer `npm -w merchant-portal run test -- --run` passar com 0 ficheiros falhados.  
  - **Foco:**  
    - `src/core/operational/__tests__/orderLifecycle.test.ts` — rever implementação de `processOrderLifecycle` e fixtures para garantir que asserções de estado (DRAFT/SENT/COMPLETED, stock, receitas, múltiplos pedidos) refletem o modelo atual.  
    - `tests/core/CoreExecutor.audit.test.ts` — garantir que conflitos de concorrência são detetados e sinalizados conforme esperado.  
    - `src/features/admin/devices/*.test.tsx` e `src/features/admin/modules/*.test.tsx` — alinhar implementação de Devices/Modules com os contratos de instalação desktop-only e i18n, ou, se os contratos mudaram, atualizar os testes e os docs de forma coerente.

- **P0.2 Validar `audit:release:portal` como gate estável**  
  - **Objetivo:** Conseguir executar `npm run audit:release:portal` em ambiente de desenvolvimento sem falhas intermitentes, usando-o como gate antes de PRs e releases.  
  - **Passos:**  
    - Corrigir os testes acima.  
    - Documentar tempo típico de execução e pré-requisitos (Core up, sem necessidade de DB externo para estes checks).

#### 5.2 P1 — Endurecimento estrutural

- **P1.1 Atualizar documentação AS-IS vs realidade**  
  - Alinhar `ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md` com o estado atual: FlowGate montado, billing gate parcialmente implementado em AppContentWithBilling, esclarecendo o que ainda é futuro (ex.: billing fully sovereign no Core).  

- **P1.2 Consolidar testes de billing vs operação**  
  - Adicionar/ativar testes que cubram todas as combinações relevantes: `isPublished` vs `billingStatus` (trial/active/past_due/suspended) e rotas (`/op/tpv`, `/op/kds`, `/app/billing`, `/dashboard`, `/app/staff/*`).  
  - Garantir que `RequireOperational` + `AppContentWithBilling` juntos cumprem o `BILLING_SUSPENSION_CONTRACT` e o `OPERATIONAL_GATES_CONTRACT`.

- **P1.3 Documentar estado dos workspaces `mobile-app` e `customer-portal`**  
  - Explicitar, num doc curto em `docs/architecture/` ou `docs/audit/`, se estes workspaces estão:  
    - No mesmo monorepo noutro local,  
    - Em repositórios separados,  
    - Ou congelados / não em uso.  
  - Incluir instruções de onde correr testes e qual é o contrato mínimo de integração com o Core.

#### 5.3 P2 — Polimento e DX

- **P2.1 Reduzir warnings de lint e testes ruidosos**  
  - Endereçar warnings recorrentes de `any`, `react-hooks/exhaustive-deps`, `react-refresh/only-export-components` e mensagens de `act(...)` nas suites de TPV/Config, para reduzir ruído e facilitar a deteção de problemas reais.  

- **P2.2 Guia operacional de comandos recomendados**  
  - Criar (ou atualizar) um pequeno guia em `docs/ops/` com uma tabela “Para X, corre Y”, listando comandos canónicos: `start:local`, `dev:with-billing`, `audit:release:portal`, `audit:360`, `validate:single-entry`, etc., para diminuir a curva de aprendizagem de novos devs.

---

### 6. Conclusão

O ChefIApp mantém uma **arquitetura de Core soberano** muito bem definida, com fronteiras claras, contratos explícitos e um portal (`merchant-portal`) que, apesar de grande, está fortemente alinhado a esses contratos — especialmente no que toca a AppStaff, TPV/KDS e separação entre gestão e operação. Após estas iterações, os P0 de **Devices/Modules/QR**, de **orderLifecycle** e de **CoreExecutor audit** foram mitigados: os testes focados de Devices/Modules (`AdminDevicesPage.verify.test.tsx`, `InstallQRPanel.antiregression.test.tsx`, `ModulesPage.antiregression.test.tsx`, `ModulesPage.desktop-flow.test.tsx`) voltaram a verde com correções mínimas em `useFormatLocale`, `InstallQRPanel`, `ModulesPage`, `DesktopPairingSection` e criação dos manifests em `public/app/`, os 11 cenários de `processOrderLifecycle` voltaram a passar após um ajuste defensivo no logging (`logFlow` passou a verificar `typeof Logger.debug === \"function\"` para não falhar em ambientes de teste onde o mock não implementa `debug`), e os testes de **CoreExecutor audit** foram alinhados ao formato real de logging do `Logger` (esperando agora `\"[warn]\", mensagem, meta` em vez de um `console.warn` simplificado). O módulo `mobileActivationService` está hoje representado por uma implementação de referência em `tests/server/mobileActivationService.ts`, coerente com a ficha técnica de AppStaff mobile (`APPSTAFF_MOBILE_TECH_SHEET.md`) e com o contrato de erros (`INVALID_PIN`, `TOKEN_EXPIRED`, `TOKEN_ALREADY_USED`, `TOKEN_REVOKED`, `RATE_LIMITED`), mas continua marcado como harness de teste, não fonte produtiva — a integração real vive no gateway `/mobile/activate` descrito na ficha técnica e será alvo de iteração própria. A maior fonte de risco técnico hoje não é arquitetura nova ou violações óbvias de soberania, mas sim a disciplina operacional: garantir que o run completo de testes do portal (`--run`) e o gate `audit:release:portal` são usados consistentemente antes de refactors e releases; ao consolidar esse hábito e alinhar a documentação AS-IS com o comportamento real, o projeto mantém um estado de **alta confiança operacional** em que a arquitetura, o Core e as apps caminham em conjunto.

