# ChefIApp OS — Entrega e Estado dos Contratos

**Data:** 2026-01-28  
**Missão:** Sistema operacional com terminais especializados, todos governados por contratos explícitos com o Core soberano. Nada existe sem contrato; nada mistura responsabilidades; nenhum terminal fala directo a outro sem passar pelo Core.

---

## 1. Lista de contratos existentes (referência)

| Contrato | Localização | Papel |
|----------|-------------|--------|
| CORE_CONTRACT_INDEX | docs/architecture/CORE_CONTRACT_INDEX.md | Índice único dos contratos |
| CORE_OS_LAYERS | docs/architecture/CORE_OS_LAYERS.md | 9 camadas do OS |
| CORE_DECISION_LOG | docs/architecture/CORE_DECISION_LOG.md | Decisões datadas |
| CORE_PUBLIC_WEB_CONTRACT | docs/contracts/CORE_PUBLIC_WEB_CONTRACT.md | Web Pública (GloriaFood) |
| CORE_FOUR_TERMINALS_INDEX | docs/contracts/CORE_FOUR_TERMINALS_INDEX.md | Índice dos 4 terminais |
| CORE_APPSTAFF_CONTRACT | docs/architecture/CORE_APPSTAFF_CONTRACT.md | AppStaff (mobile only) |
| CORE_KDS_CONTRACT | docs/architecture/CORE_KDS_CONTRACT.md | KDS (cozinha) |
| CORE_TPV_BEHAVIOUR_CONTRACT | docs/architecture/CORE_TPV_BEHAVIOUR_CONTRACT.md | TPV (caixa) |
| CORE_OPERATIONAL_UI_CONTRACT | docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md | Shell, PanelRoot, OUC |
| CORE_LANDING_ROUTES_CONTRACT | docs/architecture/CORE_LANDING_ROUTES_CONTRACT.md | Rotas landing |
| CORE_OPERATIONAL_COMMUNICATION_CONTRACT | docs/architecture/CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md | Chat técnico, alertas |
| CORE_TASK_EXECUTION_CONTRACT | docs/architecture/CORE_TASK_EXECUTION_CONTRACT.md | Tarefas: mostrar, executar, reportar |
| CORE_TASK_SYSTEM_CONTRACT | docs/architecture/CORE_TASK_SYSTEM_CONTRACT.md | Sistema de tarefas (quem cria, onde aparecem, SLA) |
| CORE_WEB_COMMAND_CENTER_CONTRACT | docs/architecture/CORE_WEB_COMMAND_CENTER_CONTRACT.md | Command Center (SystemTree + WorkTree) |
| CONTRACT_ENFORCEMENT | docs/architecture/CONTRACT_ENFORCEMENT.md | Mapeamento contrato → código |
| Outros (Time/Turn, Identity, Awareness, Financial Visibility, Print, Offline, Failure Model, Leis invisíveis, etc.) | docs/architecture/*.md | Ver CORE_CONTRACT_INDEX |

---

## 2. Contratos criados nesta sessão

| Contrato | Descrição |
|----------|-----------|
| **CORE_WEB_COMMAND_CENTER_CONTRACT.md** | Tela única: SystemTree (Core, AppStaff, KDS, TPV, Web Pública, Impressão, Offline, Billing) + WorkTree (Tarefas, Turnos, Alertas, Pedidos, Cozinha, Caixa, Incidentes); painel central; selecionar nó não muda página; Web orquestra, não executa. |
| **CORE_TASK_SYSTEM_CONTRACT.md** | Tarefas criadas na Web ou AppStaff (gerente/dono); staff apenas executa; tarefas ligadas a pedidos ou operacionais; aparecem no AppStaff e no KDS (se cozinha); SLA e prioridade = Core. KDS ⇄ tarefas. |

Registados em CORE_CONTRACT_INDEX, CORE_DECISION_LOG e CONTRACT_ENFORCEMENT.

---

## 3. Pontos cobertos em código

| Área | Onde | Contrato |
|------|------|----------|
| Web Pública (menu, pedido, status, mesa QR) | merchant-portal/src/pages/PublicWeb, Public/ | CORE_PUBLIC_WEB_CONTRACT |
| Web sem links para rotas internas (dashboard, TPV, KDS, garcom) | Auditado: PublicWeb/ e Public/ | CORE_PUBLIC_WEB_CONTRACT |
| AppStaff = mobile only (web mostra "Disponível no app") | App.tsx, DashboardPortal, mobile-app/app/_layout.tsx | CORE_APPSTAFF_CONTRACT |
| Dashboard: activeModule, painel central, árvore | DashboardPortal.tsx, OperationalShell, PanelRoot | CORE_OPERATIONAL_UI_CONTRACT, CORE_WEB_COMMAND_CENTER_CONTRACT (parcial) |
| Tarefas: criação fora do cliente (TaskPanel não gera) | TaskPanel; criação por Core/gerente/dono | CORE_TASK_EXECUTION_CONTRACT, CORE_TASK_SYSTEM_CONTRACT |
| KDS: Core manda estado; KDS mostra e confirma | KDSMinimal, MiniKDSMinimal, OrderReader | CORE_KDS_CONTRACT |
| TPV: Core manda pedidos/totais; TPV executa | TPVMinimal, MiniTPVMinimal | CORE_TPV_BEHAVIOUR_CONTRACT |
| Failure Model em código (acceptable/degradation/critical) | FailureClassifier, KernelContext.executeSafe, SyncEngine, OrderProcessingService, CashRegister, etc. | CORE_FAILURE_MODEL |
| Landing rotas e botões | App.tsx, Hero, Footer, FAQ, etc. | CORE_LANDING_ROUTES_CONTRACT |
| Billing /app/billing | BillingPage, PaymentGuard | BILLING_FLOW |

---

## 4. Pontos ainda mockados ou a alinhar (explícito)

| Área | Estado | Contrato |
|------|--------|----------|
| Command Center: árvore completa SystemTree + WorkTree (todos os nós visíveis) | Estrutura Dashboard + activeModule existe; árvore lateral pode não listar todos os nós do contrato (Core, AppStaff, KDS, TPV, Web Pública, Impressão, Offline, Billing + Tarefas, Turnos, Alertas, Pedidos, Cozinha, Caixa, Incidentes) | CORE_WEB_COMMAND_CENTER_CONTRACT |
| Tarefas operacionais no KDS (ex.: "Limpar fritadeira" criada na Web → aparece no KDS) | Contrato definido; enforcement a evoluir (KDS mostrar tarefas não-pedido) | CORE_TASK_SYSTEM_CONTRACT, CORE_KDS_CONTRACT |
| Impressão (driver, fila, API) | Documento CORE_PRINT_CONTRACT; código quando cliente real | CORE_PRINT_CONTRACT |
| Offline (fila, sync, UI de estado) | Parcial: SyncEngine, dead_letter; experiência completa a evoluir | CORE_OFFLINE_CONTRACT |
| Governança operacional por papel (quem vê o quê quando algo dá errado) | Contrato fechado; enforcement em código a evoluir | CORE_OPERATIONAL_GOVERNANCE_CONTRACT |
| Chat técnico (mensagens contextuais, auditáveis) | Contrato CORE_OPERATIONAL_COMMUNICATION_CONTRACT; implementação a evoluir | CORE_OPERATIONAL_COMMUNICATION_CONTRACT |

---

## 5. Garantia

| Garantia | Estado |
|----------|--------|
| **Web abre no navegador** | ✅ merchant-portal; rotas públicas (landing, Web Pública) e operacionais (dashboard) conforme contratos. |
| **AppStaff abre no iOS/Android** | ✅ mobile-app (Expo); `npm run ios` / `npm run android`; bloqueio no web (mensagem "Disponível apenas no app mobile"). |
| **KDS e TPV são instaláveis** | ✅ KDSMinimal e TPVMinimal no merchant-portal (web); botões "Instalar KDS" / "Instalar TPV" e estado do terminal conforme Command Center contract; instalação real (PWA ou app dedicado) conforme roadmap. |
| **Core governa tudo** | ✅ Kernel, EventExecutor, readers/writers; terminais chamam Core; sem comunicação directa terminal→terminal; contratos e CONTRACT_ENFORCEMENT documentam onde a lei está no código. |

---

**Nada fora disso deve existir.** Alterações que violem os contratos devem ser bloqueadas ou documentadas como exceção no CORE_DECISION_LOG.
