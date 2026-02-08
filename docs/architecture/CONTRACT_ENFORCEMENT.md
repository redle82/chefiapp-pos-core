# Enforcement dos Contratos — Onde a lei está no código

**Propósito:** Mapear cada contrato ao enforcement real no repositório. Assim sabe-se onde a lei é aplicada e onde há lacunas.

**Estado Lei → Código (por contrato):** [CONTRACT_IMPLEMENTATION_STATUS.md](./CONTRACT_IMPLEMENTATION_STATUS.md) — ✅ Implementado / 🟡 Parcial / 🔴 Só lei; ficheiro+símbolo ou "ainda não implementado". Fecha o ciclo Lei → Enforcement → Código → Runtime.

**Estado do núcleo (onde estamos?):** [CORE_STATE.md](./CORE_STATE.md).

**Lei dos 4 terminais:** [CORE_FOUR_TERMINALS_INDEX.md](../contracts/CORE_FOUR_TERMINALS_INDEX.md) — Web Pública, AppStaff, KDS, TPV; sem sobreposição.

---

## 0. Soberania Financeira (CORE_FINANCIAL_SOVEREIGNTY_CONTRACT — Supreme Contract)

| Regra                                                                    | Onde está aplicada                                                                                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker Core = único Financial Core; Supabase/Firebase não são Core       | Contrato [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md); CORE*CONTRACT_INDEX §0; todos os CORE*\*\_CONTRACT.md com secção Sovereignty.   |
| Nenhum terminal calcula totais/preços/estado de pagamento/SLA localmente | Contrato; auditoria [FINANCIAL_CORE_VIOLATION_AUDIT.md](./FINANCIAL_CORE_VIOLATION_AUDIT.md) — violações classificadas (c) a migrar para Core.                               |
| Nenhuma UI persiste verdade financeira ou operacional                    | Contrato; readers/writers Core (dockerCoreClient, coreBillingApi); violações na auditoria.                                                                                   |
| Nenhum contrato omite referência ao Financial Core                       | Todos os CORE\_\*\_CONTRACT.md incluem secção "Sovereignty" subordinada a CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.                                                               |
| Validar soberania financeira antes de merge (anti-regressão)             | Script `scripts/check-financial-supabase.sh`; CI executa antes de merge. Ver [ANTI_SUPABASE_CHECKLIST.md](./ANTI_SUPABASE_CHECKLIST.md) § Check automatizado anti-regressão. |

---

## 0b. Piloto fechado (CLOSED_PILOT_CONTRACT)

| Regra                                                                                                        | Onde está aplicada                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Escopo único do piloto (1 restaurante, 1 TPV, 1 KDS, 2–5 AppStaff, 1 gateway, instalação mínima + heartbeat) | Contrato: [CLOSED_PILOT_CONTRACT.md](./CLOSED_PILOT_CONTRACT.md). Índice: CORE_CONTRACT_INDEX §0b. Enforcement: decisões de scope (humano); plano de 30 dias e fluxo instalação/heartbeat quando existirem. |
| Core Docker = única autoridade; Supabase só auth                                                             | Alinhado a DATABASE_AUTHORITY e FINANCIAL_CORE_VIOLATION_AUDIT; CoreOrdersApi e coreBillingApi quando Docker.                                                                                               |
| 30 dias sem intervenção = sucesso                                                                            | Critério de aceitação do piloto; não automatizado.                                                                                                                                                          |

---

## 0d. Runtime e rotas (CORE_RUNTIME_AND_ROUTES_CONTRACT)

| Regra                                                                                                  | Onde está aplicada                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merchant-portal = autoridade única de runtime Web; servidor Vite; DEVE estar ativo para teste/operação | Contrato: [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md). Scripts: `scripts/supreme-stations.sh`, `scripts/supreme-e2e.sh` usam porta 5175. |
| Runtime oficial: localhost:5175, http; nenhuma outra porta no piloto                                   | Contrato; `merchant-portal/vite.config.ts` (port); E2E baseURL 5175.                                                                                                      |
| Rotas oficiais: /app, /app/billing, /app/tasks, /tpv, /kds, /, /public/:slug, /auth, /onboarding       | `merchant-portal/src/App.tsx` (Route paths). Não inferir; não criar fallback.                                                                                             |
| Rotas proibidas: /login, /admin, outra porta, fora da lista                                            | Contrato; violação = regressão arquitetural.                                                                                                                              |

---

## 0e. Terminais mobile (CORE_MOBILE_TERMINALS_CONTRACT)

| Regra                                                                                            | Onde está aplicada                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AppStaff NÃO é Web; roda apenas como app nativo (iOS/Android)                                    | Contrato: [CORE_MOBILE_TERMINALS_CONTRACT.md](./CORE_MOBILE_TERMINALS_CONTRACT.md). Rota `/garcom` no merchant-portal mostra "disponível apenas no app mobile"; app em `mobile-app/` (Expo). |
| Runtime: Expo; backend Docker Core; URL Core localhost:3001                                      | Contrato; `mobile-app/.env`, `mobile-app/services/supabase.ts` ou equivalente apontam para Core.                                                                                             |
| Comunicação: só com Core; terminais não falam entre si                                           | Contrato; mobile-app não deve chamar merchant-portal, TPV, KDS ou Web Pública; apenas Core (REST/RPC).                                                                                       |
| Papéis: Funcionário, Garçom, Gerente, Dono                                                       | Contrato; `mobile-app/context/`, role-based UI.                                                                                                                                              |
| Funcionalidades obrigatórias: Mini TPV, Mini KDS, tarefas, check-in, perfil, mural, chat técnico | Contrato; scope do piloto em CLOSED_PILOT_CONTRACT; implementação em mobile-app/app/(tabs)/.                                                                                                 |
| AppStaff NÃO faz: config, billing, hardware, lógica financeira, reconciliação, gateways          | Contrato; essas funções só em Web / Command Center.                                                                                                                                          |
| Se não estiver no contrato, NÃO EXISTE; violação = regressão                                     | Contrato; IA, dev e testes não inferem nem simulam fora do contrato.                                                                                                                         |

---

## 0f. AppStaff iOS UI/UX (CORE_APPSTAFF_IOS_UIUX_CONTRACT)

| Regra                                                                                        | Onde está aplicada                                                                                                                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI legacy = sem DS + sem Core como única fonte; não serve                                    | Contrato: [CORE_APPSTAFF_IOS_UIUX_CONTRACT.md](./CORE_APPSTAFF_IOS_UIUX_CONTRACT.md). UI canónica = tokens core-design-system + comunicação só com Docker Core. |
| AppStaff iOS DEVE usar tokens do core-design-system (cores, tipografia, espaçamento, radius) | Contrato; `mobile-app/` deve importar de core-design-system ou mapeamento documentado; proibido cor/font-size hardcoded em StyleSheets de UI.                   |
| AppStaff iOS comunica apenas com Docker Core (localhost:3001)                                | Contrato; alinhado a CORE_MOBILE_TERMINALS_CONTRACT; chamadas de rede em mobile-app só para Core.                                                               |
| Migração de ecrãs legacy para UI canónica obrigatória                                        | Contrato; ecrãs sem DS listados como legacy (ex.: DESIGN_SYSTEM_COVERAGE ou APPSTAFF_UIUX_MIGRATION); novo código não pode introduzir UI legacy.                |

---

## 1. UI Operacional (CORE_OPERATIONAL_UI_CONTRACT)

| Regra                         | Onde está aplicada                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell impõe contexto e layout | `merchant-portal/src/core/operational/OperationalShell.tsx`                                                                                                 |
| Painéis usam PanelRoot        | `merchant-portal/src/core/operational/PanelRoot.tsx`; todos os módulos em `DashboardPortal.tsx` → `ActiveModuleContent` envolvem conteúdo em `<PanelRoot>`. |
| Dashboard usa Shell           | `merchant-portal/src/pages/Dashboard/DashboardPortal.tsx`: `<OperationalShell context={operationalContext} fill>`.                                          |
| Painel de menu dentro do OS   | `merchant-portal/src/pages/MenuBuilder/MenuBuilderPanel.tsx` (usa PanelRoot + MenuBuilderCore variant panel).                                               |

---

## 2. Landing — Rotas e botões (CORE_LANDING_ROUTES_CONTRACT)

| Regra                                                                        | Onde está aplicada                                                                                                                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Rotas públicas `/`, `/auth`, `/demo`, `/onboarding`                          | `merchant-portal/src/App.tsx`: Route path="/", path="/auth" (Navigate to /onboarding), path="/demo", path="/onboarding" e path="/onboarding/:section". |
| Botões Hero: Entrar, Ver demonstração, WhatsApp, Já tenho conta              | `merchant-portal/src/pages/Landing/components/Hero.tsx`: to="/auth", to="/demo", href={WHATSAPP_URL}, to="/auth".                                      |
| Botões Footer: Começar, Ver demonstração, WhatsApp, Já tenho conta, Dúvidas? | `merchant-portal/src/pages/Landing/components/Footer.tsx`: to="/auth", to="/demo", href={WHATSAPP_URL}, mailto:{CONTACT_EMAIL}.                        |
| Demonstration: Abrir Portal                                                  | `merchant-portal/src/pages/Landing/components/Demonstration.tsx`: to="/auth".                                                                          |
| HowItWorks: passo 01 (Demo ao vivo)                                          | `merchant-portal/src/pages/Landing/components/HowItWorks.tsx`: Link to="/demo" no passo 01.                                                            |
| FAQ: Falar connosco                                                          | `merchant-portal/src/pages/Landing/components/FAQ.tsx`: mailto:{CONTACT_EMAIL}.                                                                        |

Contrato: [CORE_LANDING_ROUTES_CONTRACT.md](./CORE_LANDING_ROUTES_CONTRACT.md). Alterar destinos ou rotas só após actualizar o contrato.

---

## 2a. Web Operacional — Command Center (CORE_WEB_COMMAND_CENTER_CONTRACT)

| Regra                                                                                  | Onde está aplicada                                                                                                                       |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Tela única: SystemTree + WorkTree + painel central; selecionar nó não muda página      | DashboardPortal: activeModule, TreeSection (SystemTree/WorkTree), ActiveModuleContent como painel central; uma rota (ex.: `/dashboard`). |
| Web orquestra (cria, configura, observa); não executa tarefa física, preparo nem caixa | Comportamento por contrato; painéis delegam ao Core; TPV/KDS/AppStaff são terminais instalados ou mobile.                                |
| SystemTree: Core, AppStaff, KDS, TPV, Web Pública, Impressão, Offline, Billing         | DashboardPortal / árvore lateral: nós visíveis conforme CORE_WEB_COMMAND_CENTER_CONTRACT; botões Instalar KDS/TPV, Ver página pública.   |
| WorkTree: Tarefas, Turnos, Alertas, Pedidos, Cozinha, Caixa, Incidentes                | DashboardPortal: nós WorkTree; painel central renderiza módulo (TaskDashboard, Cozinha read-only, etc.).                                 |

Contrato: [CORE_WEB_COMMAND_CENTER_CONTRACT.md](./CORE_WEB_COMMAND_CENTER_CONTRACT.md). Enforcement parcial: estrutura Dashboard + activeModule existe; árvore completa SystemTree/WorkTree a alinhar ao contrato.

---

## 2b. Web Pública — GloriaFood (CORE_PUBLIC_WEB_CONTRACT)

| Regra                                                                               | Onde está aplicada                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rotas `/public/:slug`, `/public/:slug/mesa/:number`, `/public/:slug/order/:orderId` | `merchant-portal/src/App.tsx`: Route path="/public/:slug" (PublicWebPage), path="/public/:slug/mesa/:number" (TablePage), path="/public/:slug/order/:orderId" (CustomerOrderStatusView).                          |
| Página/menu do restaurante; pedido online; checkout; status (somente leitura)       | `merchant-portal/src/pages/PublicWeb/PublicWebPage.tsx`, `TablePage.tsx`; `merchant-portal/src/pages/Public/CustomerOrderStatusView.tsx`.                                                                         |
| Web Pública não acede rotas internas (dashboard, TPV, KDS, garcom, config)          | **Auditado:** páginas em `PublicWeb/` e `Public/` não contêm links para `/dashboard`, `/tpv`, `/kds-minimal`, `/garcom`, `/config`. Contrato proíbe linkar; nova funcionalidade em Public deve manter esta regra. |
| Sem login, sem staff, sem métricas internas                                         | PublicWebPage e TablePage não usam RoleGate nem rotas protegidas; apenas readers/writers do Core (menu, pedido, restaurante).                                                                                     |

Contrato: [CORE_PUBLIC_WEB_CONTRACT.md](../contracts/CORE_PUBLIC_WEB_CONTRACT.md). Índice dos 4 terminais: [CORE_FOUR_TERMINALS_INDEX.md](../contracts/CORE_FOUR_TERMINALS_INDEX.md).

---

## 2c. Sistema de Tarefas (CORE_TASK_SYSTEM_CONTRACT)

| Regra                                                                                    | Onde está aplicada                                                                                                   |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Tarefas criadas na Web ou AppStaff (gerente/dono); staff apenas executa                  | CORE_TASK_EXECUTION_CONTRACT: TaskPanel não gera tarefas; criação via Command Center ou mobile (gerente/dono).       |
| Tarefas ligadas a pedidos ou operacionais; aparecem no AppStaff e no KDS (se cozinha)    | TaskReader, OrderReader; KDS mostra fila e tarefas de cozinha; AppStaff mostra tarefas atribuídas.                   |
| SLA e prioridade definidos pelo Core                                                     | Core/backend expõe; UI mostra; não calcula.                                                                          |
| KDS ⇄ tarefas: tarefa criada na Web pode aparecer no KDS; confirmação no KDS ou AppStaff | Contrato cruzado CORE_KDS_CONTRACT + CORE_TASK_SYSTEM_CONTRACT; enforcement a evoluir (tarefas operacionais no KDS). |

Contrato: [CORE_TASK_SYSTEM_CONTRACT.md](./CORE_TASK_SYSTEM_CONTRACT.md). Subcontrato execução: [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md).

---

## 3. AppStaff (CORE_APPSTAFF_CONTRACT + subcontratos)

**Plataforma:** AppStaff = Mobile Only (iOS/Android). O terminal real está em `mobile-app` (Expo). No merchant-portal (web) não se renderiza o terminal.

| Regra                                                  | Onde está aplicada                                                                                                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rotas `/garcom`, `/garcom/mesa/:tableId` no web        | `merchant-portal/src/pages/AppStaff/AppStaffMobileOnlyPage.tsx` — mensagem «Disponível apenas no app mobile»; rota protegida por RoleGate.                        |
| AppStaff não roda no navegador (mobile-app)            | `mobile-app/app/_layout.tsx`: quando `Platform.OS === 'web'` renderiza ecrã de bloqueio «Disponível apenas no app mobile (iOS e Android)»; nunca renderiza a app. |
| Terminal staff (check-in, tarefas, mini KDS, mini TPV) | `mobile-app/` (Expo): `npm run ios` / `npm run android`; tabs staff, kitchen, orders, tables, etc.                                                                |
| Dashboard: painel AppStaff                             | DashboardPortal mostra `AppStaffMobileOnlyPage` no caso `appstaff`; não renderiza AppStaffMinimal.                                                                |
| Tarefas (ler, confirmar, executar; criação no Core)    | `merchant-portal`: TaskPanel em KDSMinimal (desktop); `mobile-app`: lógica de tarefas no terminal mobile.                                                         |
| Auditoria vs contratos                                 | `docs/architecture/APPSTAFF_AUDIT_VS_CONTRACTS.md`.                                                                                                               |

---

## 4. Banco / Domínio (DATABASE_AUTHORITY, MENU_CONTRACT)

| Regra                      | Onde está aplicada                                                                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migrações como autoridade  | `supabase/migrations/`; `docker-core/schema/migrations/`.                                                                                                                                                                                      |
| Leitura de menu/produtos   | Readers em `merchant-portal/src/core-boundary/readers/` (RestaurantReader, etc.).                                                                                                                                                              |
| Fonte de verdade no Core   | Kernel/EventStore; UI não escreve domínio directo.                                                                                                                                                                                             |
| **Produção = Docker Core** | [DATABASE_AUTHORITY.md](./DATABASE_AUTHORITY.md) § "PRODUÇÃO / PILOT: CORE = DOCKER CORE". Supabase transicional apenas para auth/sessão e leituras não financeiras documentadas.                                                              |
| **Sovereignty gate**       | `scripts/sovereignty-gate.sh`: falha se OrderEngine, WebOrderingService, OrderProjection ou SyncEngine usarem `supabase.rpc('create_order_atomic')` em vez de `CoreOrdersApi.createOrderAtomic`. Executado no CI (`.github/workflows/ci.yml`). |

---

## 5. Billing e Pagamentos (CORE_BILLING_AND_PAYMENTS_CONTRACT)

**NO SUPABASE.** Billing é soberania do Core (Docker + Postgres). UI só consome Core API.

| Regra                                 | Onde está aplicada                                                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contrato formal                       | [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md): Core nunca processa; SaaS vs restaurante; multi-gateway; **NO SUPABASE**.            |
| Core API (Docker-native)              | GET/POST `/core/billing/config` (billing_configs); POST `/core/billing/saas/portal` (Stripe URL). Implementação: `coreBillingApi.ts`; BillingBroker chama Core apenas. |
| Rota `/app/billing` (SaaS)            | `App.tsx`; `BillingPage.tsx` → BillingBroker chama Core RPC create_saas_portal_session / create_checkout_session.                                                      |
| PaymentGuard Safe Harbor              | `/app/billing` incluído nas rotas permitidas. **Contaminação:** PaymentGuard lê `billing_status` via Supabase; alvo = Core (gm_restaurants ou GET billing/status).     |
| Command Center: painel Billing        | SystemTree → nó Billing; `BillingConfigPanel`: load/save via Core API (`getBillingConfig` / `setBillingConfig`).                                                       |
| TPV: cobrança só se autorizado        | Antes de cobrança: chamar Core para verificar billing config; se disabled → bloquear (contrato; enforcement em TPV quando houver integração real).                     |
| Sem dados de cartão no Core           | Nenhum componente Core ou UI guarda PAN/CVC; apenas referências e estado.                                                                                              |
| **Contaminação Supabase (a remover)** | `PaymentGuard.tsx`: supabase.from("gm_restaurants").select("billing_status") → passar a ler do Core. `FlowGate.tsx`: idem. BillingBroker já migrado para Core API.     |

---

## 6. Multi-tenant / Kernel (TENANCY_KERNEL_CONTRACT, KERNEL_EXECUTION_MODEL)

| Regra                    | Onde está aplicada                                                          |
| ------------------------ | --------------------------------------------------------------------------- |
| Execução por tenant      | Kernel, EventExecutor, Repo, EventStore (código Core).                      |
| Readers com restaurantId | TaskReader, OrderReader, RuntimeReader, etc., todos scoped por restaurante. |

---

## 7. KDS (CORE_KDS_CONTRACT)

| Regra                                                   | Onde está aplicada                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Core manda estado/prioridade/SLA; KDS mostra e confirma | KDSMinimal, MiniKDSMinimal; leitura via OrderReader, OrderItems; sem fila/prioridade local. |

---

## 8. TPV (CORE_TPV_BEHAVIOUR_CONTRACT)

| Regra                                                 | Onde está aplicada                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| Core manda pedidos/totais/desconto/fecho; TPV executa | TPVMinimal, MiniTPVMinimal; criação/edição via Core/API; leitura via readers. |

---

## 9. Impressão (CORE_PRINT_CONTRACT)

| Regra                     | Onde está aplicada                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| Quem manda / quem obedece | **Documento criado.** Enforcement em código (driver, fila, API) a implementar quando houver cliente real. |

---

## 10. Offline (CORE_OFFLINE_CONTRACT)

| Regra                             | Onde está aplicada                                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quem manda / fila / o que mostrar | **Documento criado.** Enforcement em código (service worker, fila, UI de estado) a implementar quando rodar em ambiente instável.                                                   |
| Fila: critical → dead_letter      | `merchant-portal/src/core/sync/SyncEngine.ts`: em `processItem` usa `classifyFailure`; critical vai para dead_letter; aceitável/degradation retry com backoff (CORE_FAILURE_MODEL). |

---

## 11. Design System Contract (CORE_DESIGN_SYSTEM_CONTRACT)

| Regra                                                               | Onde está aplicada                                                                                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------- | ----------- | ---------------------------------------------- |
| Tokens globais (imutáveis) — fonte única                            | `core-design-system/tokens.ts`, `typography.ts`, `spacing.ts`, `tokens.css`; merchant-portal e mobile-app devem consumir estes tokens.           |
| Nenhum terminal: cor hardcoded, font-size arbitrário, layout global | Contrato formal; lint/check a evoluir.                                                                                                           |
| Onde DS não toca = bug/débito/contrato/violação                     | CORE_DESIGN_SYSTEM_CONTRACT; Design System Coverage Map a evoluir.                                                                               |
| Componentes e estados contratuais                                   | Listas em `core-design-system/components` e `states`; implementação em merchant-portal e mobile-app.                                             |
| Design System Coverage Map                                          | [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md): tabela Área/Tela                                                                       | Terminal | Usa DS? | O que falta | Tipo. Se não usa DS → tem que estar na tabela. |
| Enforcement Loop (A, B, C)                                          | [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md): Coverage Map, regra de build (soft), autoridade (Core? Contrato? DS?). |

Contrato: [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md). Prompt unificação: [PROMPT_DESIGN_SYSTEM_UNIFICATION.md](./PROMPT_DESIGN_SYSTEM_UNIFICATION.md).

---

## 11b. Design System — Política (CORE_DESIGN_IMPLEMENTATION_POLICY)

| Regra                                       | Onde está aplicada                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| DS = implementação subordinada; Shell manda | Nenhum componente trata o DS como “contrato”; Shell aplica VPC em OperationalShell. Política documentada; violação = erro conceitual. |

---

## 12. Modelo de Falha (CORE_FAILURE_MODEL)

| Regra                                                                                       | Onde está aplicada                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classes de falha (aceitável, degradação, crítica); Core manda; UI não esconde falha crítica | `merchant-portal/src/core/errors/FailureClassifier.ts`: `classifyFailure()` → `acceptable` \| `degradation` \| `critical`.                                                                                                                                                                                                                                  |
| executeSafe expõe failureClass para a UI                                                    | `merchant-portal/src/core/kernel/KernelContext.tsx`: em catch chama `classifyFailure(err)` e retorna `failureClass` e `classifiedReason`; quando kernel não está READY retorna `failureClass: 'degradation'`. UI deve usar para retry vs bloquear vs alertar (não reclassificar).                                                                           |
| UI mostra falha crítica, não esconde                                                        | `merchant-portal/src/cinematic/context/ProductContext.tsx`: usa `executeSafe` em `addProduct`; em `failureClass === 'critical'` define `lastError` (mensagem via `getErrorMessage`); expõe `lastError` e `clearLastError`. Cenas que usam addProduct: `Scene4Beverages.tsx` e `Scene5Cuisine.tsx` renderizam `lastError` com `role="alert"` e botão fechar. |
| Fila offline: critical → dead_letter, não retry infinito                                    | `merchant-portal/src/core/sync/SyncEngine.ts`: em `processItem` catch chama `classifyFailure(err)`; se `failureClass === 'critical'` move item para dead_letter imediatamente; aceitável/degradation mantém retry com backoff até MAX_RETRIES.                                                                                                              |
| OrderProcessingService aceita executeSafe e propaga failureClass                            | `merchant-portal/src/core/services/OrderProcessingService.ts`: `acceptRequest(requestId, restaurantId, kernel, executeSafe?)`; se `executeSafe` fornecido usa-o; em `!res.ok` lança Error com `getErrorMessage(res.error)` e `err.failureClass = res.failureClass` para o caller decidir retry vs bloquear.                                                 |
| CashRegister (abrir/fechar caixa) aceita executeSafe e propaga failureClass                 | `merchant-portal/src/core/tpv/CashRegister.ts`: `OpenCashRegisterInput` e `CloseCashRegisterInput` têm `executeSafe?: ExecuteSafeFn`; em open/close usa executeSafe quando fornecido; em `!res.ok` lança Error com mensagem e `err.failureClass`.                                                                                                           |
| MenuBootstrapService (injectPreset) aceita executeSafe e propaga failureClass               | `merchant-portal/src/core/menu/MenuBootstrapService.ts`: `injectPreset(restaurantId, presetKey, kernel, context?, executeSafe?)`; no loop de criação de produtos usa executeSafe quando fornecido; em `!res.ok` lança Error com mensagem e `err.failureClass`.                                                                                              |
| OrderContextReal (abrir/fechar caixa via RPC) classifica erros e expõe failureClass         | `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`: em `openCashRegister` e `closeCashRegister` (RPC directo), no catch chama `classifyFailure(err)` e anexa `err.failureClass` e `err.classifiedReason` antes de relançar.                                                                                                                       |
| TPV usa failureClass nas mensagens de abrir/fechar caixa                                    | `merchant-portal/src/pages/TPV/TPV.tsx`: nos catch de OpenCashRegisterModal e CloseCashRegisterModal, se `err.failureClass === 'degradation'` mostra "Problema de rede. Tente novamente em instantes."; se `'acceptable'` mostra mensagem + "Pode tentar novamente."; caso contrário mostra a mensagem do erro.                                             |

---

## 14. Hierarquia de Verdade (CORE_TRUTH_HIERARCHY)

| Regra                                                                                       | Onde está aplicada                                                                                                           |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Camadas (instantânea, eventual, histórica, percebida); Core expõe; UI não resolve conflitos | Readers/Kernel expõem estado; UI mostra "sincronizando" ou "último estado conhecido" conforme Core. Implementação a evoluir. |

---

## 15. Governação do Tempo (CORE_TIME_GOVERNANCE_CONTRACT)

| Regra                                                                                             | Onde está aplicada                                                                                                          |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| SLA, tempo máximo de decisão/espera, o que vira incidente; UI não inventa "atrasado" ou "urgente" | Métricas de atraso (ex.: 15 min em CORE_OPERATIONAL_AWARENESS); KDS/TPV/SLA definidos no Core. Valores concretos a evoluir. |

---

## 16. Consciência do Sistema (CORE_SYSTEM_AWARENESS_MODEL)

| Regra                                                                                       | Onde está aplicada                                                                                                  |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| O que é monitorizado, quando está "cego"; UI não mostra dados como actuais quando há atraso | Indicadores de frescura ("dados há X s", "sem dados há N min"); heartbeat/polling no Core. Implementação a evoluir. |

---

## 17. Override e Autoridade (CORE_OVERRIDE_AND_AUTHORITY_CONTRACT)

| Regra                                                                                          | Onde está aplicada                                                                                                |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Papéis e níveis (operar, configurar, suspender, forçar exceção); UI só expõe acções permitidas | RoleGate, guards, RBAC; botões de override apenas quando Core expor e papel tiver permissão. Audit log a evoluir. |

---

## 18. Evolução e Compatibilidade (CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT)

| Regra                                                                                           | Onde está aplicada                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Versão mínima, legado, feature flags, modo antigo vs novo; UI não assume campos não contratados | Versioning de API, flags por tenant/papel; avisos de depreciação respeitados. Implementação a evoluir. |

---

## 19. Silêncio e Ruído (CORE_SILENCE_AND_NOISE_POLICY)

| Regra                                                                                                    | Onde está aplicada                                                                                  |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Limiares: quando não alertar vs quando alertar; UI não dispara alerta abaixo do limiar nem esconde acima | Toasts, notificações, log de incidente; valores N/M/K definidos pelo Core. Implementação a evoluir. |

---

## 20. Governança Operacional Viva (CORE_OPERATIONAL_GOVERNANCE_CONTRACT)

| Regra                                                                                   | Onde está aplicada                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quem vê o quê (staff / gerente / dono); quando vira incidente; quando o sistema se cala | Contrato definido; enforcement em código a evoluir (notificações por papel, listas de incidentes, visibilidade conforme papel). AppStaff e dashboards devem passar a expor apenas o que o Core define para cada papel. |

---

---

## 21. Contratos de soberania operacional (Instalação, Identidade, Heartbeat, Reconciliação, Retenção)

| Contrato                                      | Onde está aplicada                                                                                                                                                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CORE_INSTALLATION_AND_PROVISIONING_CONTRACT   | Contrato: [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md). Enforcement em código a evoluir quando houver fluxo de provisionamento/registro de terminal no cliente.         |
| CORE_IDENTITY_AND_TRUST_CONTRACT              | Contrato: [CORE_IDENTITY_AND_TRUST_CONTRACT.md](./CORE_IDENTITY_AND_TRUST_CONTRACT.md). Enforcement quando houver validação de identidade/chave de terminal no Core e no cliente.                                             |
| CORE_HEARTBEAT_AND_LIVENESS_CONTRACT          | Contrato: [CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md](./CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md). Enforcement quando Command Center ou terminais enviarem/consumirem heartbeat; estado online/offline via Core.                 |
| CORE_RECONCILIATION_CONTRACT                  | Contrato: [CORE_RECONCILIATION_CONTRACT.md](./CORE_RECONCILIATION_CONTRACT.md). Jobs de reconciliação no Core; cliente não executa reconciliação. Enforcement em docker-core e em UI (apenas leitura de estado reconciliado). |
| CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT | Contrato: [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md). Políticas no Core; migrações e constraints; UI não purga nem altera imutáveis. Enforcement a evoluir.       |
| BOOTSTRAP_KERNEL                              | Documento: [BOOTSTRAP_KERNEL.md](./BOOTSTRAP_KERNEL.md). SYSTEM_STATE e estado ao arranque; enforcement em BootstrapKernel/init quando existir no código.                                                                     |

**Documentos em docs/contracts (referência técnica; indexados em CORE_CONTRACT_INDEX §7):** [DOMAIN_WRITE_AUTHORITY_CONTRACT.md](../contracts/DOMAIN_WRITE_AUTHORITY_CONTRACT.md), [EVENTS_AND_STREAMS.md](../contracts/EVENTS_AND_STREAMS.md), [EXECUTION_CONTEXT_CONTRACT.md](../contracts/EXECUTION_CONTEXT_CONTRACT.md), [EXECUTION_FENCE_CONTRACT.md](../contracts/EXECUTION_FENCE_CONTRACT.md), [STATUS_CONTRACT.md](../contracts/STATUS_CONTRACT.md). Enforcement conforme referências no código (ex.: TENANCY_KERNEL_CONTRACT → EXECUTION_CONTEXT_CONTRACT).

---

**Atualizar este ficheiro** quando houver novo enforcement (guards, wrappers, APIs) ligado a um contrato.
