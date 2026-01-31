# Índice de Contratos Core — ChefIApp

**Propósito:** Memória institucional. O Cursor (e qualquer agente) não tem histórico de conversa; **arquivo > conversa**. Este índice é a referência única para "o que está decidido" no Core.

**Modelo mental (2 páginas):** [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) — hierarquia real (Kernel → Core → Contratos → Terminais), Kernel vs Core (Kernel = intocável; Core evolui), Bootstrap, instalação como soberania, tempo/verdade. "O Core decide. O Kernel garante. Os contratos autorizam. Os terminais executam."

**Uso:** Em todo prompt que altere UI operacional, AppStaff, tarefas, turno, finanças ou comunicação, referenciar explicitamente: `@docs/architecture/CORE_CONTRACT_INDEX.md` e o contrato específico da tarefa.

---

## 0. Contrato Supremo — Soberania Financeira (Root of Authority)

| Documento                                                                          | Uma linha                                                                                                                                                                                                                                                                                           | Quando usar                                                                              |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) | **Supreme Contract / Root of Authority.** O Docker Core é o Financial Core soberano. Única fonte de verdade para estado financeiro, pedidos, totais, pagamentos, reconciliação, SLA e autoridade operacional. Supabase/Firebase/BaaS NÃO são Core. Todos os contratos e terminais são subordinados. | Qualquer decisão que toque em finanças, persistência, BaaS, ou hierarquia de autoridade. |
| [CORE_RECONCILIATION_CONTRACT.md](./CORE_RECONCILIATION_CONTRACT.md)               | Reconciliação financeira e operacional: apenas o Core executa; escopo (pagamentos, caixa, pedidos); accionamento, divergência e recuperação; terminais/UI não reconciliam.                                                                                                                          | Jobs de reconciliação, filas, comparação de totais, recuperação de estado.               |

Todos os contratos CORE\_\* declaram subordinação a este contrato. Nenhuma regra, estado ou execução noutro contrato sobrepõe o Docker Financial Core.

**Auditoria de violações:** [FINANCIAL_CORE_VIOLATION_AUDIT.md](./FINANCIAL_CORE_VIOLATION_AUDIT.md) — Supabase/Firebase e lógica financeira no cliente; classificação legacy / technical debt / architectural violation.

---

## 0a. Lei dos 4 terminais (soberania)

| Terminal                        | Onde                              | Contrato                                                                | Papel           |
| ------------------------------- | --------------------------------- | ----------------------------------------------------------------------- | --------------- |
| 🌍 **Web Pública** (GloriaFood) | Navegador, `/public/*`            | [CORE_PUBLIC_WEB_CONTRACT.md](../contracts/CORE_PUBLIC_WEB_CONTRACT.md) | Vende           |
| 📱 **AppStaff**                 | `/mobile-app` (Expo, iOS/Android) | [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md)                | Trabalha        |
| 🍳 **KDS**                      | App instalado (cozinha)           | [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md)                          | Executa cozinha |
| 🖥 **TPV**                       | App instalado (caixa)             | [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md)      | Executa caixa   |

**Índice completo dos 4 terminais:** [CORE_FOUR_TERMINALS_INDEX.md](../contracts/CORE_FOUR_TERMINALS_INDEX.md) — sem sobreposição; Core governa tudo.

**Entrega ChefIApp OS (contratos, coberto, mockado, garantia):** [CHEFIAPP_OS_DELIVERY.md](./CHEFIAPP_OS_DELIVERY.md).

**Estado do núcleo (onde estamos?):** [CORE_STATE.md](./CORE_STATE.md) — núcleo fechado, 7 leis documentadas, Failure Model em código, parciais, callers executeSafe, próximo passo.

**Mapa do território (9 camadas OS):** [CORE_OS_LAYERS.md](./CORE_OS_LAYERS.md) — Kernel, Contratos, Runtime, Terminais, Governança, Observabilidade, Autonomia, Evolução, Ecossistema; comparação com Toast, Lightspeed, ServiceNow, Palantir.

---

## 0b. Piloto fechado (escopo por lei)

| Documento                                              | Uma linha                                                                                                                                                                                                                                                      | Quando usar                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [CLOSED_PILOT_CONTRACT.md](./CLOSED_PILOT_CONTRACT.md) | **Pilot Law.** Único escopo válido do piloto: 1 restaurante, 1 TPV, 1 KDS, 2–5 AppStaff, 1 gateway, instalação mínima + heartbeat; Core Docker = autoridade; Supabase só auth; 30 dias sem intervenção = sucesso. Tudo fora do contrato não é feito no piloto. | Decisões de scope, plano de 30 dias, fluxo instalação/heartbeat, "está fechado?" vs "fora do piloto". |

**Regra:** Se algo não está no Closed Pilot Contract, não faz parte do piloto. Se está, tem que funcionar.

---

## 0c. Fecho do Piloto (Contratos Operacionais Mínimos)

Estes contratos formalizam o estado "v0" permitido para encerrar o piloto legalmente.

| Documento                                                                        | Uma linha                                                                                      | Quando usar                                       |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [INSTALLATION_MINIMAL_CONTRACT.md](./INSTALLATION_MINIMAL_CONTRACT.md)           | **Minimal Install.** Escopo: 1 Core, 1 TPV, 1 KDS, N AppStaff; manual; falha = invisível.      | Validar se uma instalação está conforme o piloto. |
| [HEARTBEAT_MINIMAL_CONTRACT.md](./HEARTBEAT_MINIMAL_CONTRACT.md)                 | **Minimal Heartbeat.** Ping simples; 30s intervalo / 90s timeout; UI binária (Online/Offline). | Implementar ou verificar status de conectividade. |
| [TERMINAL_IDENTITY_MINIMAL_CONTRACT.md](./TERMINAL_IDENTITY_MINIMAL_CONTRACT.md) | **Minimal Identity.** ID estático; trust on first use; sem criptografia complexa.              | Configurar identificação de TPV e KDS.            |
| [OPERATIONAL_READINESS_DECLARATION.md](./OPERATIONAL_READINESS_DECLARATION.md)   | **Pilot Ready.** Declaração formal de aptidão baseada em auditoria e breakdown; aceita riscos. | Checkout final para autorizar o go-live real.     |

---

## 0c. Fecho do Piloto (Contratos Operacionais Mínimos)

Estes contratos formalizam o estado "v0" permitido para encerrar o piloto legalmente.

| Documento                                                                        | Uma linha                                                                                      | Quando usar                                       |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| [INSTALLATION_MINIMAL_CONTRACT.md](./INSTALLATION_MINIMAL_CONTRACT.md)           | **Minimal Install.** Escopo: 1 Core, 1 TPV, 1 KDS, N AppStaff; manual; falha = invisível.      | Validar se uma instalação está conforme o piloto. |
| [HEARTBEAT_MINIMAL_CONTRACT.md](./HEARTBEAT_MINIMAL_CONTRACT.md)                 | **Minimal Heartbeat.** Ping simples; 30s intervalo / 90s timeout; UI binária (Online/Offline). | Implementar ou verificar status de conectividade. |
| [TERMINAL_IDENTITY_MINIMAL_CONTRACT.md](./TERMINAL_IDENTITY_MINIMAL_CONTRACT.md) | **Minimal Identity.** ID estático; trust on first use; sem criptografia complexa.              | Configurar identificação de TPV e KDS.            |
| [OPERATIONAL_READINESS_DECLARATION.md](./OPERATIONAL_READINESS_DECLARATION.md)   | **Pilot Ready.** Declaração formal de aptidão baseada em auditoria e breakdown; aceita riscos. | Checkout final para autorizar o go-live real.     |

## 0d. Runtime e rotas (piloto)

| Documento                                                                    | Uma linha                                                                                                                                                                                                                                                                          | Quando usar                                                                                        |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)                             | **Caminho do cliente (GloriaFood/Toast/Square).** Visão produto: Landing vende → Signup → Portal configura → Billing → Publicar → Operação (/op/tpv, /op/kds). CTAs: /signup, /auth, /demo. Nada se mistura.                                                                        | Fluxo do cliente, vendas, onboarding, decisões de produto.                                        |
| [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md)                             | **Rota → Contrato.** Índice canónico: toda a rota oficial mapeada para o contrato MD que a governa. Rotas de marketing, auth, portal, operação, web pública.                                                                  | Saber qual contrato governa cada rota; não inferir rotas nem contratos fora do índice.             |
| [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) | **Runtime + Rotas.** Sem servidor ativo o sistema não existe; sem rota aqui a rota não existe. Merchant-portal = autoridade Web; localhost:5175; rotas oficiais (/app, /op/tpv, /op/kds, /public/:slug, /auth, /signup, /onboarding); rotas proibidas (/admin, outra porta). Ver CAMINHO_DO_CLIENTE para fluxo. | Scripts, testes, IA: host/porta/rota; abrir TPV/KDS/Command Center; validar URLs.                  |
| [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md)               | **Boot por camada (GloriaFood/LastApp).** AppBootMode = PUBLIC \| AUTH \| MANAGEMENT \| OPERATIONAL \| STAFF_MOBILE. Define o que inicializa e o que NÃO inicializa; quais contexts são carregados. Landing funciona offline.                                                                 | Boot, isolamento por camada, separação Público / Auth / Gestão / Operação / Staff Mobile.          |
| [CORE_IMMUTABLE_SHIFT_CONTRACT.md](./CORE_IMMUTABLE_SHIFT_CONTRACT.md)       | **(NEW)** Enforces code version locking during active operational shifts.                                                                                                                                                                                                          | Decisões sobre deploy, atualizações de código durante turno, garantia de estabilidade operacional. |

---

## 0d4. Contenção 48h / Piloto (Runtime e UI)

| Documento                                             | Uma linha                                                                                | Quando usar                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [PILOT_MODE_RUNTIME_CONTRACT.md](./PILOT_MODE_RUNTIME_CONTRACT.md) | Modo piloto: não escreve no Core; pode persistir em localStorage; invisível ao Core.      | Decisões sobre pilot, fallback, localStorage.              |
| [MENU_FALLBACK_CONTRACT.md](./MENU_FALLBACK_CONTRACT.md)             | Fallback menu: Core primeiro; em rede falhada usa local; nunca promove local a Core.     | Menu Builder, ProductReader, MenuWriter, B1.               |
| [OPERATIONAL_UI_RESILIENCE_CONTRACT.md](./OPERATIONAL_UI_RESILIENCE_CONTRACT.md) | UI operacional: ErrorBoundary em /op/; mensagens neutras; nunca ecrã branco.             | TPV, KDS, ErrorBoundary, toUserMessage, B2/B4.             |
| [ORDER_ORIGIN_CLASSIFICATION.md](./ORDER_ORIGIN_CLASSIFICATION.md)   | order_origin pilot \| real; semântica oficial; Core pode filtrar/reportar.                | Pedidos, relatórios, filtros por origem.                   |

---

## 0d2. Arquitetura de rotas — modelo GloriaFood / LastApp (3 mundos, 1 sistema)

**Diagrama visual:** [ROUTES_AND_BOOT_DIAGRAM.md](./ROUTES_AND_BOOT_DIAGRAM.md) — mapa mental dos 3 mundos + 5 boot modes.

| Documento                                                                      | Uma linha                                                                                                                                                                                                 | Quando usar                                                                 |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [PAGE_TYPES_AND_TEMPLATES_CONTRACT.md](./PAGE_TYPES_AND_TEMPLATES_CONTRACT.md) | **Tipos de página e templates (DNA do produto).** Define os 5 arquétipos (Landing, Auth, Portal, Operacional, Staff), escolha de template por camada, anti-padrões e regra: "o papel da página define o template." | Escolha de templates, revisão UX, decisões de design, geração assistida por IA, onboarding devs/designers. |
| [TEMPLATE_SELECTION_CONTRACT.md](./TEMPLATE_SELECTION_CONTRACT.md)             | **Seleção canónica de templates.** Fixa as opções por camada (Landing: Shadcn Landing / Easy Template 5; Auth: blocos Shadcn; Portal: Modernize/MatDash; TPV/KDS: custom UI). Ref. [docs/design/HTMLREV_TEMPLATES_BY_LAYER.md](../design/HTMLREV_TEMPLATES_BY_LAYER.md). | Implementação de nova página, redesign, consistência com HTMLrev.          |
| [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md)                           | **Site público.** Rotas /, /pricing, /features, /demo, /login, /signup. NÃO carrega Runtime nem Core. Landing funciona offline.                                                                          | Camada pública, marketing, site do sistema.                                 |
| [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md)                     | **Auth e entrada.** Login/signup → sempre /app/dashboard. Sem onboarding gate; login nunca redireciona para TPV.                                                                                          | Login, cadastro, destino pós-auth.                                          |
| [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](./RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md) | **Criação do primeiro restaurante.** Rota /bootstrap; BootstrapPage cria gm_restaurants + owner; destino /app/dashboard.                                                                                  | Criação restaurante, bootstrap, owner.                                      |
| [TENANT_SELECTION_CONTRACT.md](./TENANT_SELECTION_CONTRACT.md)                 | **Seleção de tenant.** Rota /app/select-tenant; casos 0 → /bootstrap, 1 → auto + /dashboard, >1 → lista; persistência tenant.                                                                           | Multi-tenant, seleção restaurante.                                           |
| [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)               | **Portal de gestão.** /app/dashboard, /app/restaurant, /app/menu, etc. Nunca bloqueia; usa banners/checklists.                                                                                            | Rotas de gestão, cockpit, configuração.                                    |
| [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md)         | **Ciclo de vida do restaurante.** configured / published / operational. Governa o que está acessível; gates obedecem a este contrato.                                                                    | Lifecycle, fases GloriaFood, gates por estado.                             |
| [MANAGEMENT_ADVISOR_CONTRACT.md](./MANAGEMENT_ADVISOR_CONTRACT.md)             | **Advisor de gestão.** Banners/checklists no portal; nunca bloqueia acesso.                                                                                                                               | Banners não publicado, checklist, orientação sem gate.                     |
| [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md)            | **Rotas operacionais.** /op/tpv, /op/kds, /op/cash, /op/staff. Gates obrigatórios (published, operational).                                                                                                          | TPV, KDS, caixa, gates operacionais.                                       |
| [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md)               | **Gates operacionais.** published === true para TPV/KDS; operational === true para caixa. Fallback: redirect para /app/dashboard.                                                                           | RequireOperational, enforcement, bloqueio de operação.                    |
| [CASH_REGISTER_LIFECYCLE_CONTRACT.md](./CASH_REGISTER_LIFECYCLE_CONTRACT.md)   | **Ciclo do caixa.** /op/cash exige operational === true (turno aberto).                                                                                                                                    | Caixa, turno aberto, gate operational.                                     |
| [APP_STAFF_MOBILE_CONTRACT.md](./APP_STAFF_MOBILE_CONTRACT.md)                | **AppStaff mobile only.** Rotas /staff/*; nunca acessível no web; nunca rota default nem destino pós-login web.                                                                                           | Staff mobile, rotas internas app, separação web/mobile.                    |
| [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md)            | **Billing e suspensão.** Estados trial/active/past_due/suspended; quando bloquear operação; recuperação. Billing nunca bloqueia portal.                                                                     | Gates de billing em /op/*; mensagens de regularização.                      |
| [DESKTOP_DISTRIBUTION_CONTRACT.md](./DESKTOP_DISTRIBUTION_CONTRACT.md)        | **Distribuição desktop.** PWA e Electron para TPV/KDS; manifest; atualizações; política de versão.                                                                                                         | Empacotar /op/tpv e /op/kds para desktop.                                  |
| [READY_TO_PUBLISH_CHECKLIST.md](./READY_TO_PUBLISH_CHECKLIST.md)             | **Checklist ready to publish.** Lista operativa (identidade, menu, billing, etc.) para o cliente publicar com confiança; advisor, não gate.                                                                  | Onboarding, /app/publish, vendas.                                           |
| [CUSTOMER_JOURNEY_MAP.md](./CUSTOMER_JOURNEY_MAP.md)                          | **Mapa do fluxo do cliente.** Diagrama ASCII Landing → Signup → Portal → Billing → Publish → Operação.                                                                                                        | Vendas, onboarding, comunicação.                                            |

**Regra suprema:** Nenhuma rota decide sozinha. Toda rota obedece a um contrato. Índice rota → contrato: [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md).

---

## 0d3. Instalação operacional (Web App Instalável, NON-CORE)

Contratos gerais; não tocam no Core; regulam instalação, acesso e execução do TPV/KDS no desktop via Browser App Mode (sem Electron, sem PWA complexo).

| Documento                                                                        | Uma linha                                                                                                                                 | Quando usar                                                                 |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md)   | **Web App Operacional Instalável.** Definição; não é Electron/PWA/store; rotas /op/tpv, /op/kds; regras uma rota = um app; pré-condições; fora de escopo (offline, drivers). | Instalação e execução TPV/KDS no desktop.                                   |
| [OPERATIONAL_APP_MODE_CONTRACT.md](./OPERATIONAL_APP_MODE_CONTRACT.md)           | **Browser App Mode.** Definição formal; suporte Chrome/Edge/Safari; requisitos viewport/fullscreen; elegibilidade; o que não automatizar; UX esperado. | Requisitos técnicos e UX da instalação.                                     |
| [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md)   | **Fluxo de instalação.** Dashboard → /app/install → abrir /op/tpv ou /op/kds → instalar via browser; papel do portal; estados (disponível, bloqueado); mensagens canónicas. | Fluxo passo a passo e estados de bloqueio.                                  |

---

## 0e. Terminais mobile (iOS / Android)

| Documento                                                                | Uma linha                                                                                                                                                                                                                                                                                       | Quando usar                                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [CORE_MOBILE_TERMINALS_CONTRACT.md](./CORE_MOBILE_TERMINALS_CONTRACT.md) | **Mobile Terminals.** AppStaff NÃO é Web; roda apenas como app nativo (iOS/Android). Runtime: Expo; backend Docker Core (localhost:3001). Comunicação: só com Core; terminais não falam entre si. Papéis, funcionalidades obrigatórias e proibições definidos. Se não estiver aqui, NÃO EXISTE. | AppStaff, mobile-app, testes mobile, IA: não inferir Web; não simular fora do contrato. |

---

## 1. Contratos AppStaff (terminal humano do OS — subordinados ao Financial Core)

| Documento                                                                                          | Uma linha                                                                                                        | Quando usar                                                                                 |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md)                                           | Lei macro: AppStaff é terminal do OS; quatro perguntas; seis subcontratos.                                       | Qualquer alteração em `/garcom`, AppStaffMinimal, StaffContext, check-in, dashboards staff. |
| [CORE_APPSTAFF_IDENTITY_CONTRACT.md](./CORE_APPSTAFF_IDENTITY_CONTRACT.md)                         | Quem é este humano; fonte = Core/sessão; exceção dev documentada.                                                | Identidade, restaurantId, perfil, papel.                                                    |
| [CORE_TIME_AND_TURN_CONTRACT.md](./CORE_TIME_AND_TURN_CONTRACT.md)                                 | Estado de turno; check-in/check-out; último check-in; QR (quando Core suportar).                                 | Check-in no Minimal, "Em turno", "Sair de turno", TabIsolated turn state.                   |
| [CORE_TASK_SYSTEM_CONTRACT.md](./CORE_TASK_SYSTEM_CONTRACT.md)                                     | Sistema de tarefas: quem cria (Web/AppStaff gerente/dono); onde aparecem (AppStaff, KDS); SLA/prioridade = Core. | Command Center painel Tarefas, KDS tarefas cozinha, delegação por cargo.                    |
| [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md)                               | Tarefas: quem cria = Core/gerente/dono; terminal mostra/confirma/executa/reporta.                                | TaskPanel, geração de tarefas, acknowledge, resolve.                                        |
| [CORE_OPERATIONAL_AWARENESS_CONTRACT.md](./CORE_OPERATIONAL_AWARENESS_CONTRACT.md)                 | Consciência operacional: mini KDS, mini TPV, métricas (atrasos, fila, pressão).                                  | MiniKDSMinimal, MiniTPVMinimal, bloco Atrasados/Fila/Pressão.                               |
| [CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md](./CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md) | Staff vê ticket médio do turno; gerente vê resumo/desvios; "ver, não controlar".                                 | Placeholder ou dados reais de turno no Minimal.                                             |
| [CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md](./CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md)         | Alertas, notificações, comentário em tarefa, resposta a alerta (sem chat livre).                                 | Badge Tarefas, toasts, futuros comentários/alertas.                                         |
| [CORE_APPSTAFF_IOS_UIUX_CONTRACT.md](./CORE_APPSTAFF_IOS_UIUX_CONTRACT.md)                       | UI/UX canónica do AppStaff iOS: só DS + Docker Core; UI legacy não serve; migração obrigatória.                 | mobile-app UI, tokens core-design-system, Core como única fonte; distinguir legacy vs canónico. |

**Auditoria vs contratos:** [APPSTAFF_AUDIT_VS_CONTRACTS.md](./APPSTAFF_AUDIT_VS_CONTRACTS.md) — snapshot do que existe/viola/ausente no Minimal.

---

## 2. Contratos de UI operacional (Shell, painéis, Command Center)

| Documento                                                                      | Uma linha                                                                                                                                                                        | Quando usar                                                                                    |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------- | ----------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md)           | Contexto obrigatório; layout imposto pelo Shell; painéis usam PanelRoot; `data-chefiapp-os`.                                                                                     | Dashboard, OperationalShell, PanelRoot, qualquer painel dentro do OS (MenuBuilderPanel, etc.). |
| [CORE_WEB_COMMAND_CENTER_CONTRACT.md](./CORE_WEB_COMMAND_CENTER_CONTRACT.md)   | Tela única: SystemTree + WorkTree (esquerda), painel central (direita); selecionar nó não muda página; Web orquestra, não executa.                                               | Command Center, Dashboard como árvore (Core, AppStaff, KDS, TPV, Tarefas, Cozinha, Caixa).     |
| [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md)             | **Operational Control Plane Tree:** Kernel/Core como estado (RUNNING, OK, Mode), não como nós irmãos dos terminais; Terminals / Operations / Commerce; System Tree vs Work Tree. | Qualquer UI "System Tree" ou Command Center; não misturar fundação com periféricos.            |
| [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md)             | DS = contrato visual transversal; Core decide, Contratos autorizam, DS revela; onde DS não toca = bug/débito/contrato/violação; tokens em core-design-system.                    | Tokens, componentes, estados visuais; cobertura DS; proibição cor hardcoded.                   |
| [DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md](./DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md) | Unificação perceptiva: estados globais (loading, empty, error, blocked, pilot), tons emocionais, transições sem teletransporte; Portal/TPV/KDS "respirem junto". Mapa de implementação: [GLOBAL_UI_STATE_MAP.md](../product/GLOBAL_UI_STATE_MAP.md). | Estados globais, GlobalUIState, componentes globais (GlobalLoadingView, etc.), toUserMessage, transições Portal → TPV → KDS; copy canónico. |
| [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md)     | Princípios Restaurant OS 2026: dark default, estados universais, tempo visível, tap 44–48px, hierarquia brutal, silêncio visual; "Why waiter mental models".                     | Upgrade DS; ergonomia cognitiva; aplicação em Command Center, AppStaff, KDS, TPV.              |
| [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md)                       | Tabela Área/Tela                                                                                                                                                                 | Terminal                                                                                       | Usa DS? | O que falta | Tipo. Se não usa DS → tem que estar na tabela; "não" = ticket de arquitetura. | Auditoria UI; unificação total; ver [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md) e [PROMPT_DESIGN_SYSTEM_UNIFICATION.md](./PROMPT_DESIGN_SYSTEM_UNIFICATION.md). |
| [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md)       | Mecanismos A (Coverage Map), B (regra de build soft), C (autoridade: Core? Contrato? DS?).                                                                                       | Forçar a realidade a obedecer ao contrato do DS.                                               |
| [CORE_DESIGN_IMPLEMENTATION_POLICY.md](./CORE_DESIGN_IMPLEMENTATION_POLICY.md) | Design System = **implementação subordinada** ao OUC; não define layout/fundo/hierarquia; fornece componentes, espaçamento, estados. O Shell manda, não o DS.                    | Tokens, componentes UI, estilos; quando alguém tratar o DS como “fonte de verdade”.            |
| [CORE_LANDING_ROUTES_CONTRACT.md](./CORE_LANDING_ROUTES_CONTRACT.md)           | Rotas públicas da landing (`/`, `/auth`, `/demo`, `/onboarding`); mapeamento botões → destino; único ponto de entrada auth; não alterar sem contrato.                            | Qualquer alteração em botões/links da Landing ou em rotas públicas de entrada.                 |

---

## 3. Topologia, execução e Bootstrap

| Documento                                                    | Uma linha                                                                                                                                             | Quando usar                                                                              |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [CORE_EXECUTION_TOPOLOGY.md](./CORE_EXECUTION_TOPOLOGY.md)   | Quem executa o quê: Kernel → Executor → Repo/EventStore; UI só chama; readers vs writers.                                                             | Alterações em Kernel, Executor, readers, writers, fluxo de dados.                        |
| [KERNEL_EXECUTION_MODEL.md](./KERNEL_EXECUTION_MODEL.md)     | Pipeline Kernel.execute(); EventExecutor; StreamId; anti-looping.                                                                                     | Alterações no Core/Kernel, eventos, projeções.                                           |
| [BOOTSTRAP_KERNEL.md](./BOOTSTRAP_KERNEL.md)                 | Auto-consciência do sistema: SYSTEM_STATE, Surfaces Registry, guards; output do Bootstrap.                                                            | Estado do Kernel ao arranque; Command Center "Sistema a inicializar".                    |
| [BOOTSTRAP_CONTRACT.md](./BOOTSTRAP_CONTRACT.md)             | Ritual de nascimento: INIT → BOOTING → RUNNING; tenant root, contratos, guards; o que deve existir antes de RUNNING.                                  | Arranque do sistema; mensagem "Sistema a inicializar"; alterações ao fluxo de bootstrap. |
| [SYSTEM_TREE_VS_EXECUTION.md](./SYSTEM_TREE_VS_EXECUTION.md) | Mapa ASCII: pilha de execução (Kernel → Core → Contratos → Terminais) vs Operational Control Plane Tree (estado + Terminals + Operations + Commerce). | Referência visual para Command Center e para documentos de arquitetura.                  |

---

## 3b. Instalação, identidade, heartbeat e dados (soberania operacional)

| Documento                                                                                              | Uma linha                                                                                                                                                                                        | Quando usar                                                                               |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md)     | Instalação = acto de soberania: provisionamento, identidade, chave de confiança, registro no Core, permissão, invalidação; Core é autoridade; terminais não operam como instalados sem registro. | Provisionamento, registro de terminal, autorização ou invalidação de dispositivo.         |
| [CORE_IDENTITY_AND_TRUST_CONTRACT.md](./CORE_IDENTITY_AND_TRUST_CONTRACT.md)                           | Identidade de terminais (dispositivo/superfície) e chaves de confiança: Core é autoridade; terminal apresenta identificador e chave; Core valida; revogação.                                     | Credenciais de terminal, validação de dispositivo, chaves de confiança.                   |
| [CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md](./CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md)                   | Heartbeat e liveness: Core é autoridade para estado online/offline; terminal envia heartbeat; Core define timeout; UI reflecte apenas estado exposto pelo Core.                                  | Health check, heartbeat, timeout, exibição "terminal online/offline".                     |
| [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) | Retenção e imutabilidade: Core define políticas para dados financeiros e de auditoria; dados imutáveis não podem ser alterados ou apagados; terminais/UI não purgam nem alteram.                 | Políticas de retenção, purge, histórico, imutabilidade de registos financeiros/auditoria. |

**Auditoria de contratos referenciados:** [CONTRACT_AUDIT_REFERENCED.md](./CONTRACT_AUDIT_REFERENCED.md) — tabela de referências vs existência em disco; contratos proibidos (TERMINAL_REGISTRATION, CORE_PAYMENT_RECONCILIATION).

**Reconciliação final (estado contract-complete):** [CONTRACT_RECONCILIATION_FINAL.md](./CONTRACT_RECONCILIATION_FINAL.md) — ZERO missing, ZERO empty, ZERO implicit assumptions; Referenced == Exists == Written == Indexed == Enforced.

---

## 4. Cobertura por área (varredura)

| Documento                                                | Uma linha                                                                                                                                                              | Quando usar                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [CORE_CONTRACT_COVERAGE.md](./CORE_CONTRACT_COVERAGE.md) | Tabela por área: Existe contrato? (sim/não/parcial), arquivo, prioridade, observações. Lista do que falta fechar (impressão, offline, web pública, notificações push). | Antes de alterar uma área; para saber o que está governado e o que é resíduo histórico. |

---

## 5. Decisões registadas (log)

| Documento                                      | Uma linha                                           | Quando usar                                                           |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| [CORE_DECISION_LOG.md](./CORE_DECISION_LOG.md) | Log datado: decisão, contrato relacionado, impacto. | Antes de implementar: ver se já foi decidido; após decisão: registar. |

---

## 6. Billing e Pagamentos (monetização soberana)

| Documento                                                                        | Uma linha                                                                                                                                           | Quando usar                                                                    |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) | Core nunca processa pagamento; SaaS billing (ChefIApp) vs restaurant billing (cliente final); multi-gateway (Stripe, SumUp, Pix); TPV/Web/AppStaff. | Billing SaaS, pagamentos restaurante, gateways, Command Center painel Billing. |
| [BILLING_FLOW.md](./BILLING_FLOW.md)                                             | Stripe Checkout/Portal; env vars; rota `/app/billing`.                                                                                              | Fluxo de subscrição SaaS (complementar ao contrato).                           |

---

## 7. Outros contratos de domínio (referência)

| Documento                                                          | Uma linha                                                                   |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| [DATABASE_AUTHORITY.md](./DATABASE_AUTHORITY.md)                   | Regras do banco; migrações; fonte de verdade.                               |
| [MENU_CONTRACT.md](./MENU_CONTRACT.md)                             | Menu; categorias; produtos.                                                 |
| [TPV_INSTALLATION_CONTRACT.md](./TPV_INSTALLATION_CONTRACT.md)     | TPV; instalação; hardware.                                                  |
| [TENANCY_KERNEL_CONTRACT.md](./TENANCY_KERNEL_CONTRACT.md)         | Multi-tenant; Kernel por tenant.                                            |
| [CORE_PRINT_CONTRACT.md](./CORE_PRINT_CONTRACT.md)                 | Impressão: Core manda; UI pede e mostra estado; falha.                      |
| [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md)             | Offline: Core define fila, sync, o que mostrar; UI obedece.                 |
| [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md)                     | KDS: Core manda estado/prioridade/SLA; KDS mostra e confirma.               |
| [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md) | TPV (comportamento): Core manda pedidos/totais/desconto/fecho; TPV executa. |

**Documentos em docs/contracts (referência técnica; existem em disco e estão indexados):**

| Documento                                                                             | Uma linha                                                                     |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [DOMAIN_WRITE_AUTHORITY_CONTRACT.md](../contracts/DOMAIN_WRITE_AUTHORITY_CONTRACT.md) | Autoridade de escrita por domínio.                                            |
| [EVENTS_AND_STREAMS.md](../contracts/EVENTS_AND_STREAMS.md)                           | Event Store, streams, nomenclatura de eventos.                                |
| [EXECUTION_CONTEXT_CONTRACT.md](../contracts/EXECUTION_CONTEXT_CONTRACT.md)           | Contexto de execução e fronteiras (referenciado por TENANCY_KERNEL_CONTRACT). |
| [EXECUTION_FENCE_CONTRACT.md](../contracts/EXECUTION_FENCE_CONTRACT.md)               | Cercas de execução.                                                           |
| [STATUS_CONTRACT.md](../contracts/STATUS_CONTRACT.md)                                 | Contrato de status do sistema.                                                |

---

## 8. Leis invisíveis (mapa + contratos fechados)

| Documento                                                                                      | Uma linha                                                                                                                       | Quando usar                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [CORE_INVISIBLE_LAWS_INDEX.md](./CORE_INVISIBLE_LAWS_INDEX.md)                                 | Mapa das 7 dimensões (falha, verdade, tempo, consciência, autoridade, evolução, silêncio). Referência para os contratos abaixo. | Saber o que existe em sistemas maduros.                                                     |
| [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md)                                               | Falha como cidadã de primeira classe: classes (aceitável, degradação, crítica); o que acontece automaticamente; quem manda.     | Toda decisão sobre falha, retry, bloqueio, alerta.                                          |
| [CORE_TRUTH_HIERARCHY.md](./CORE_TRUTH_HIERARCHY.md)                                           | Camadas de verdade (instantânea, eventual, histórica, percebida); Core define qual vale; UI não resolve conflitos sozinha.      | Estado, cache, conflitos de sincronização, "último estado conhecido".                       |
| [CORE_TIME_GOVERNANCE_CONTRACT.md](./CORE_TIME_GOVERNANCE_CONTRACT.md)                         | Tempo como recurso governado: SLA, tempo máximo de decisão/espera, o que vira incidente; UI não inventa "urgente".              | Atrasos, prazos, prioridade por tempo, métricas de atraso.                                  |
| [CORE_SYSTEM_AWARENESS_MODEL.md](./CORE_SYSTEM_AWARENESS_MODEL.md)                             | O sistema sabe o que monitoriza, o que não monitoriza, quando está "cego"; UI não finge visibilidade.                           | Dashboards, frescura de dados, "sem dados há X min".                                        |
| [CORE_OVERRIDE_AND_AUTHORITY_CONTRACT.md](./CORE_OVERRIDE_AND_AUTHORITY_CONTRACT.md)           | Quem pode operar, configurar, suspender regras, forçar exceção; UI não inventa bypass nem "modo admin".                         | Permissões, override, auditoria, papéis.                                                    |
| [CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT.md](./CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT.md) | Versão mínima, comportamento legado, feature flags, modo antigo vs novo; Core governa transições.                               | API versioning, depreciação, flags, upgrades.                                               |
| [CORE_SILENCE_AND_NOISE_POLICY.md](./CORE_SILENCE_AND_NOISE_POLICY.md)                         | Quando NÃO alertar vs quando alertar; limiares; UI não inventa "sempre notificar" nem esconde acima do limiar.                  | Alertas, toasts, log de incidente, ruído isolado.                                           |
| [CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md](./CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md)           | Governança operacional viva: quem vê o quê quando algo dá errado; quando vira incidente; quando o sistema se cala.              | Visibilidade por papel (staff/gerente/dono), escalação, notificações, listas de incidentes. |

---

## 9. Enforcement (onde a lei está no código)

| Documento                                                                | Uma linha                                                                                                                  | Quando usar                                                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md)                     | Mapeamento contrato → ficheiro/componente que aplica a regra.                                                              | Auditar cumprimento; saber onde alterar quando o contrato mudar.                             |
| [CONTRACT_IMPLEMENTATION_STATUS.md](./CONTRACT_IMPLEMENTATION_STATUS.md) | Estado Lei → Código: por contrato, ✅ Implementado / 🟡 Parcial / 🔴 Só lei; ficheiro+símbolo ou "ainda não implementado". | Saber o que está no runtime vs só na lei; fechar ciclo Lei → Enforcement → Código → Runtime. |

---

## 10. Template de prompt

| Documento                                  | Uma linha                                                                                                              | Quando usar                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [PROMPT_STANDARD.md](./PROMPT_STANDARD.md) | Blocos "Context" + "Task" para copiar para o início do prompt; variantes por tipo de tarefa (AppStaff, UI, topologia). | **Todo** prompt que altere Core, AppStaff, UI operacional, tarefas, turno, finanças ou comunicação. |

---

## 10b. Outros documentos em docs/architecture (referência — indexados para contract-gate)

Estes documentos existem em disco e estão listados aqui para cumprir a regra: todo o .md em docs/architecture e docs/contracts deve estar referenciado no índice. Material de apoio ou referência; não são contratos Core.

| Documento                                                                | Tipo                                                                               |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)                       | Este índice.                                                                       |
| [CONTRACT_CREATION_PROTOCOL.md](./CONTRACT_CREATION_PROTOCOL.md)         | Protocolo de criação de contratos; regras para referenciar, indexar e enforcement. |
| [APPSTAFF_2.0_EXECUTIVE_SUMMARY.md](./APPSTAFF_2.0_EXECUTIVE_SUMMARY.md) | Referência AppStaff.                                                               |
| [APPSTAFF_RECONSTRUCAO.md](./APPSTAFF_RECONSTRUCAO.md)                   | Referência AppStaff.                                                               |
| [APPSTAFF_SYNC_MAP.md](./APPSTAFF_SYNC_MAP.md)                           | Referência AppStaff.                                                               |
| [ARCHITECTURE_CANON.md](./ARCHITECTURE_CANON.md)                         | Referência arquitectura.                                                           |
| [ARCHITECTURE_DECISION_RECORDS.md](./ARCHITECTURE_DECISION_RECORDS.md)   | Referência ADRs.                                                                   |
| [ARCHITECTURE_GUARD.md](./ARCHITECTURE_GUARD.md)                         | Referência guardas.                                                                |
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)                   | Referência overview.                                                               |
| [BEVERAGE_CANON.md](./BEVERAGE_CANON.md)                                 | Referência bebidas.                                                                |
| [BOOT_CHAIN.md](./BOOT_CHAIN.md)                                         | Referência boot.                                                                   |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)                             | Referência deploy.                                                                 |
| [DYNAMIC_CONTEXTUAL_MENU.md](./DYNAMIC_CONTEXTUAL_MENU.md)               | Referência menu.                                                                   |
| [FOLDER_MAP.md](./FOLDER_MAP.md)                                         | Referência pastas.                                                                 |
| [FUTURE_CONTRACTS_MAP.md](./FUTURE_CONTRACTS_MAP.md)                     | Referência contratos futuros; propostas para evolução do piloto.                   |
| [LEGACY_UI_STATUS.md](./LEGACY_UI_STATUS.md)                             | Referência UI.                                                                     |
| [MENU_CREATION_METHODS.md](./MENU_CREATION_METHODS.md)                   | Referência menu.                                                                   |
| [MENU_IMPORT_CONTRACT.md](./MENU_IMPORT_CONTRACT.md)                     | Referência menu.                                                                   |
| [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)                             | Referência monitorização.                                                          |
| [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md)           | Referência multi-tenant.                                                           |
| [NOW_ENGINE.md](./NOW_ENGINE.md)                                         | Referência Now Engine.                                                             |
| [NOW_ENGINE_DIAGRAM.md](./NOW_ENGINE_DIAGRAM.md)                         | Referência Now Engine.                                                             |
| [NOW_ENGINE_RULES.md](./NOW_ENGINE_RULES.md)                             | Referência Now Engine.                                                             |
| [ONBOARDING_FLOW.md](./ONBOARDING_FLOW.md)                               | Referência onboarding.                                                             |
| [PRODUCTION_READINESS_CONTRACT.md](./PRODUCTION_READINESS_CONTRACT.md)   | Referência produção.                                                               |
| [ROLE_TRANSITIONS.md](./ROLE_TRANSITIONS.md)                             | Referência roles.                                                                  |
| [SCRIPTS_OFICIAIS.md](./SCRIPTS_OFICIAIS.md)                             | Referência scripts.                                                                |
| [SOVEREIGN_MODE_TECHNICAL.md](./SOVEREIGN_MODE_TECHNICAL.md)             | Referência modo soberano.                                                          |
| [SPONSORED_CONTEXTUAL_MENU.md](./SPONSORED_CONTEXTUAL_MENU.md)           | Referência menu.                                                                   |
| [SURFACES_ARCHITECTURE.md](./SURFACES_ARCHITECTURE.md)                   | Referência superfícies.                                                            |
| [SURFACES_CURRENT_STATE.md](./SURFACES_CURRENT_STATE.md)                 | Referência superfícies.                                                            |
| [SURFACE_MAP.md](./SURFACE_MAP.md)                                       | Referência superfícies.                                                            |
| [UI_V2_ARCHITECTURE.md](./UI_V2_ARCHITECTURE.md)                         | Referência UI v2.                                                                  |
| [UI_V2_IMPLEMENTATION_STATUS.md](./UI_V2_IMPLEMENTATION_STATUS.md)       | Referência UI v2.                                                                  |
| [UI_V2_MANIFEST.md](./UI_V2_MANIFEST.md)                                 | Referência UI v2.                                                                  |
| [tenant-model.md](./tenant-model.md)                                     | Referência tenant.                                                                 |

---

## Regra de ouro

**Nada importante fica só em conversa.**
Se foi decidido → virar entrada aqui, ou em CORE_DECISION_LOG.md, ou comentário no código.
**Sempre referenciar estes ficheiros no prompt** (ou usar [PROMPT_STANDARD.md](./PROMPT_STANDARD.md)) quando a tarefa tocar em AppStaff, UI operacional, tarefas, turno, finanças ou comunicação.
