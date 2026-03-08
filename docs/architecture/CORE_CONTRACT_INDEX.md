# Índice de Contratos Core

**Propósito:** Lista canónica de contratos de arquitectura do ChefIApp Core. Referência única para navegação e auditoria.

<---row---row---rPri---rowri--r a---row---rrma---row---row---g self-ref: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) -->

**Mapa de voo:** [FUNIL_VIDA_CLIENTE.md](../contracts/FUNIL_VIDA_CLIENTE.md) — visão única, 10 telas, fluxograma, analogia do carro, decisão estratégica.

---

## Os 14 contratos (ordem definitiva)

**Total: 14.** ~11 já existem ou estão praticamente completos.

### 🔑 Contratos de Entrada

| #   | Contrato      | Documento                                                                 | Descrição                           |
| --- | ------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| 1   | LANDING_ENTRY | [CONTRATO_LANDING_CANONICA.md](../contracts/CONTRATO_LANDING_CANONICA.md) | Visitante anónimo, sem estado.      |
| 2   | TRIAL_ACCOUNT | [TRIAL_ACCOUNT_CONTRACT.md](../contracts/TRIAL_ACCOUNT_CONTRACT.md)       | Utilizador criado, sem restaurante. |

### 🏗️ Contratos de Bootstrap

| #   | Contrato             | Documento                                                                         | Descrição                                    |
| --- | -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| 3   | RESTAURANT_BOOTSTRAP | [RESTAURANT_BOOTSTRAP_CONTRACT.md](../contracts/RESTAURANT_BOOTSTRAP_CONTRACT.md) | Restaurante existe, mas não opera.           |
| 4   | MENU_MINIMAL         | [MENU_MINIMAL_CONTRACT.md](../contracts/MENU_MINIMAL_CONTRACT.md)                 | Menu mínimo válido (1 categoria, 1 produto). |
| 5   | OPERATION_MODE       | [OPERATION_MODE_CONTRACT.md](../contracts/OPERATION_MODE_CONTRACT.md)             | Rápido vs configurado.                       |

### 🔥 Contratos de Ativação

| #   | Contrato          | Documento                                                               | Descrição                 |
| --- | ----------------- | ----------------------------------------------------------------------- | ------------------------- |
| 6   | FIRST_SALE_RITUAL | [FIRST_SALE_RITUAL.md](../contracts/FIRST_SALE_RITUAL.md)               | Primeira venda realizada. |
| 7   | TRIAL_OPERATION   | [TRIAL_OPERATION_CONTRACT.md](../contracts/TRIAL_OPERATION_CONTRACT.md) | Restaurante em uso real.  |

### ⚙️ Contratos Operacionais

| #   | Contrato                    | Documento                                                                                     | Descrição                                            |
| --- | --------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 8   | FLUXO_DE_PEDIDO_OPERACIONAL | [FLUXO_DE_PEDIDO_OPERACIONAL.md](../contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md)                 | TPV → Core → KDS; estados, eventos.                  |
| 9   | CASH_REGISTER_AND_PAYMENTS  | [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](../contracts/CASH_REGISTER_AND_PAYMENTS_CONTRACT.md) | Caixa, pagamentos, fecho.                            |
| 10  | TASKS_CONTRACT_v1           | [TASKS_CONTRACT_v1.md](../contracts/TASKS_CONTRACT_v1.md)                                     | Tarefas: tipos, ciclo de vida, superfícies.          |
| 11  | OPERATIONAL_SURFACES        | [OPERATIONAL_SURFACES_CONTRACT.md](../contracts/OPERATIONAL_SURFACES_CONTRACT.md)             | Dashboard / TPV / KDS / AppStaff — matriz.           |
| 12  | OPERATIONAL_KERNEL          | [OPERATIONAL_KERNEL_CONTRACT.md](../contracts/OPERATIONAL_KERNEL_CONTRACT.md)                 | Núcleo decisor: CoreHealth, Preflight, EventMonitor. |

### 💳 Contratos de Negócio

| #   | Contrato         | Documento                                                                 | Descrição                                 |
| --- | ---------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| 13  | TRIAL_TO_PAID    | [TRIAL_TO_PAID_CONTRACT.md](../contracts/TRIAL_TO_PAID_CONTRACT.md)       | Fim do trial: escolher plano ou encerrar. |
| 14  | BILLING_AND_PLAN | [BILLING_AND_PLAN_CONTRACT.md](../contracts/BILLING_AND_PLAN_CONTRACT.md) | Planos SaaS, assinatura, trial countdown. |

### Funil do Cliente / Onboarding (fluxo)

| Documento                                                                                  | Descrição                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [FUNIL_VIDA_CLIENTE.md](../contracts/FUNIL_VIDA_CLIENTE.md#sequência-canônica-oficial-v10) | **Sequência Canônica v1.0** — 8 passos oficiais, tabela obrigatório/pulável, diagrama Mermaid único; referência para UI, Core e discurso comercial.                                                                                                 |
| [ONBOARDING_5MIN_9_TELAS_CONTRACT.md](../contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md)    | **Onboarding 5 minutos (9 telas)** — mapeamento oficial Tela 0–8, estados `tpv_mode`/`shift_status`, regra TPV preview vs live, Ritual de Abertura; princípio Onboarding ≠ Operação. Substitui/estende o fluxo de 4 passos para a implementação UI. |
| [ONBOARDING_FLOW_CONTRACT.md](../contracts/ONBOARDING_FLOW_CONTRACT.md)                    | Fluxo dos 4 passos (passos 3–6 da Sequência Canônica: Bootstrap até Trial silencioso): estados, transições, modais vs páginas, retomada; fonte de verdade para FlowGate/CoreFlow (legado; ver ONBOARDING_5MIN_9_TELAS para 9 telas).                |
| [ONBOARDING_ASSISTANT_CONTRACT.md](../contracts/ONBOARDING_ASSISTANT_CONTRACT.md)          | **Onboarding Assistente** — 7 perguntas (nome, país, tipo, mesas, impressora, KDS, usuários), payload (sessionStorage + Core), destino (/app/activation ou /bootstrap). Camada de Ativação; ponte entre Bem-vindo e Centro de Ativação.             |

---

## System Tree e Control Plane

| Documento                                                          | Descrição                                                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [CORE_SYSTEM_TREE_CONTRACT.md](./CORE_SYSTEM_TREE_CONTRACT.md)     | Árvore canónica do Restaurant OS e mapa endpoint → nó; fonte para DS e para a árvore na UI. |
| [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md) | Estrutura Command Center (System Health, Terminals, Operations, Commerce).                  |
| [SYSTEM_TREE_VS_EXECUTION.md](./SYSTEM_TREE_VS_EXECUTION.md)       | Pilha de execução vs control plane tree.                                                    |
| [ROADMAP_POS_FREEZE.md](../strategy/ROADMAP_POS_FREEZE.md)         | Roadmap pós-freeze: o que está pronto, 3 gaps, 2 fases, trilhos opcionais.                  |

### Dashboard / Control Plane

| Documento                                                                                   | Descrição                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](../contracts/OPERATIONAL_DASHBOARD_V2_CONTRACT.md)   | Contrato do dashboard em modo OPERATIONAL_OS: primeira/segunda dobra, sidebar, regra do menu, o que nunca aparece, mapeamento backend ↔ UI.                             |
| [OPERATIONAL_HEADER_CONTRACT.md](../contracts/OPERATIONAL_HEADER_CONTRACT.md)               | Header operacional (identidade): restaurante como primeiro elemento, estado, operador actual; fontes gm_restaurants, shift, preflight; sidebar ancorada no restaurante. |
| [OPERATIONAL_KERNEL_CONTRACT.md](../contracts/OPERATIONAL_KERNEL_CONTRACT.md)               | Núcleo decisor operacional: responsabilidades CoreHealth, Preflight, EventMonitor; estado composto OperationalState; mapeamento para implementação actual (dispersa).   |
| [TERMINAL_INSTALLATION_RITUAL.md](../contracts/TERMINAL_INSTALLATION_RITUAL.md)             | Ritual de instalação em /admin/devices (canónico); /app/install redireciona; terminal como objeto vivo (nome + Online/Offline); fontes gm_equipment, installedDeviceStorage, gm_terminals. |
| [MODULES_AND_DEVICES_ANTIREGRESSION.md](./MODULES_AND_DEVICES_ANTIREGRESSION.md)             | **Anti-regressão:** TPV/KDS em nova janela; rota canónica /admin/devices; título Hub Módulos; sem duplicar rotas; checklist antes de alterar Módulos ou Dispositivos.   |
| [OPERATIONAL_NAVIGATION_SOVEREIGNTY.md](../contracts/OPERATIONAL_NAVIGATION_SOVEREIGNTY.md) | Soberania de navegação: FlowGate + ORE; em OPERATIONAL_OS nunca redirect para Landing; destino canónico /app/dashboard; DEMO_MODE não controla navegação.               |
| [FLUXO_DE_PEDIDO_OPERACIONAL.md](../contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md)               | Fluxo de pedido operacional TPV → Core → KDS para a Fase 1: estados, eventos, responsabilidades de superfícies e critérios de sucesso (20 pedidos sem erro).            |
| [OPERATIONAL_SURFACES_CONTRACT.md](../contracts/OPERATIONAL_SURFACES_CONTRACT.md)           | Contrato de superfícies operacionais: Dashboard / TPV / KDS / AppStaff — matriz pode/não pode; gate e relação com instalação (Fase 2.1).                                |

### KDS (layout, Bar vs Cozinha)

| Documento                                                                                     | Descrição                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md)                                                | Contrato KDS: quem manda (Core), prioridade/fila/SLA, falha.                                                                       |
| [KDS_LAYOUT_UX_CONTRACT.md](../contracts/KDS_LAYOUT_UX_CONTRACT.md)                           | Layout e UX do KDS: um único scroll na lista, sem barra preta no rodapé; tabs Todas/Cozinha/Bar; filtro activeOnly.                |
| [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md)       | Bar vs Cozinha: station em gm_products e gm_order_items; migração 20260224; fallback na leitura de itens; filtro e secções no KDS. |
| [MELHORIAS_KDS_E_BAR_CONTRATOS_2026-02.md](../audit/MELHORIAS_KDS_E_BAR_CONTRATOS_2026-02.md) | Auditoria: lista das melhorias KDS/Bar e referências aos contratos e ficheiros.                                                    |

### Dois dashboards (referência)

| Documento                                                                  | Descrição                                                                                                                   |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [TWO_DASHBOARDS_REFERENCE.md](./TWO_DASHBOARDS_REFERENCE.md)               | Referência única: 2 dashboards (Staff + Owner), onde vivem (App/Web), regra "não misturar tempos mentais". ~60 s.           |
| [COGNITIVE_MODES_OWNER_DASHBOARD.md](./COGNITIVE_MODES_OWNER_DASHBOARD.md) | Contrato profundo: modos Operação vs Consciência; Owner Dashboard web (completo) e app (compacto).                          |
| [EVENTS_CONTRACT_V1.md](./EVENTS_CONTRACT_V1.md)                           | Tipos de evento, severidade, onde aparecem (feed web/app); base para Staff produtor e Owner consumidor.                     |
| [CONFIGURATION_MAP_V1.md](./CONFIGURATION_MAP_V1.md)                       | Mapa da Configuração Last.app: checklist por setor, status (feito/parcial/não iniciado), árvore de rotas `/admin/config/*`. |

### Caixa e Pagamentos

| Documento                                                                                     | Descrição                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](../contracts/CASH_REGISTER_AND_PAYMENTS_CONTRACT.md) | Caixa como contexto financeiro activo; estados de pagamento (UNPAID/PAID); fluxo TPV (confirmar → marcar pagamento); fecho com total esperado/declarado/diferença; Dashboard só leitura (Fase 2.3). |

### Dispositivo / Turno / Tarefa

| Documento                                                                  | Descrição                                                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [DEVICE_TURN_SHIFT_TASK_CONTRACT.md](./DEVICE_TURN_SHIFT_TASK_CONTRACT.md) | Dispositivo como ator operacional; ligação Dispositivo ↔ Turno ↔ Operador ↔ Tarefa; eventos → tarefas; bloqueios operacionais; offline e runtime local. |

### AppStaff / AppShell

| Documento                                                          | Descrição                                                                                                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [APPSTAFF_APPSHELL_MAP.md](./APPSTAFF_APPSHELL_MAP.md)             | Mapa completo do AppShell: estrutura (TopBar, área central, navegação contextual), áreas comuns, áreas por papel, destino da Master View; sem código. |
| [APPSTAFF_ROUTE_MAP.md](./APPSTAFF_ROUTE_MAP.md)                   | Rotas e componentes implementados sob `/app/staff`; mapeamento rota → componente.                                                                     |
| [APPSTAFF_UI_SURGERY_SUMMARY.md](./APPSTAFF_UI_SURGERY_SUMMARY.md) | Resumo da refatoração layout: uma tela = uma responsabilidade; Visão Operacional, Turno, Equipe, Tarefas, Exceções, TPV/KDS em tela cheia.            |

### Planos

| Documento                                                     | Descrição                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [FASE_2_PLANO_COMPLETO.md](../plans/FASE_2_PLANO_COMPLETO.md) | Plano completo Fase 2 (2.1–2.5): superfícies, pessoas/turnos, caixa/pagamentos, observabilidade, uso real + freeze. |

---

_Índice mínimo. Expandir conforme repopulação do índice em tarefas futuras._

---

## Índice completo (auto-gerado para contract-gate)

### docs/architecture

| Documento | Status |
| --- | --- |
| [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) | indexado |
| [ADMIN_CONFIG_MODE_UX.md](./ADMIN_CONFIG_MODE_UX.md) | indexado |
| [ADMIN_DOMAINS_CONTRACT.md](./ADMIN_DOMAINS_CONTRACT.md) | indexado |
| [ADMIN_GLOSSARY.md](./ADMIN_GLOSSARY.md) | indexado |
| [ADMIN_NAVIGATION_MAP.md](./ADMIN_NAVIGATION_MAP.md) | indexado |
| [ADMIN_OBSERVABILITY_HOOKS.md](./ADMIN_OBSERVABILITY_HOOKS.md) | indexado |
| [ADMIN_QA_UX_CHECKLIST.md](./ADMIN_QA_UX_CHECKLIST.md) | indexado |
| [ADR_HYBRID_BACKEND.md](./ADR_HYBRID_BACKEND.md) | indexado |
| [ANOMALY_DEFINITION.md](./ANOMALY_DEFINITION.md) | indexado |
| [ANTI_SUPABASE_CHECKLIST.md](./ANTI_SUPABASE_CHECKLIST.md) | indexado |
| [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) | indexado |
| [APPSTAFF_2.0_EXECUTIVE_SUMMARY.md](./APPSTAFF_2.0_EXECUTIVE_SUMMARY.md) | indexado |
| [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](./APPSTAFF_APPROOT_SURFACE_CONTRACT.md) | indexado |
| [APPSTAFF_APPSHELL_MAP.md](./APPSTAFF_APPSHELL_MAP.md) | indexado |
| [APPSTAFF_AUDIT_VS_CONTRACTS.md](./APPSTAFF_AUDIT_VS_CONTRACTS.md) | indexado |
| [APPSTAFF_BASELINE_CONSOLIDATED.md](./APPSTAFF_BASELINE_CONSOLIDATED.md) | indexado |
| [APPSTAFF_CONFIG_SEPARATION_CONTRACT.md](./APPSTAFF_CONFIG_SEPARATION_CONTRACT.md) | indexado |
| [APPSTAFF_HOME_LAUNCHER_CONTRACT.md](./APPSTAFF_HOME_LAUNCHER_CONTRACT.md) | indexado |
| [APPSTAFF_LAUNCHER_CONTRACT.md](./APPSTAFF_LAUNCHER_CONTRACT.md) | indexado |
| [APPSTAFF_LAUNCHER_NAVIGATION_CONTRACT.md](./APPSTAFF_LAUNCHER_NAVIGATION_CONTRACT.md) | indexado |
| [APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md](./APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md) | indexado |
| [APPSTAFF_MAP_PEN_README.md](./APPSTAFF_MAP_PEN_README.md) | indexado |
| [APPSTAFF_RECONSTRUCAO.md](./APPSTAFF_RECONSTRUCAO.md) | indexado |
| [APPSTAFF_ROLE_HOME_REDESIGN.md](./APPSTAFF_ROLE_HOME_REDESIGN.md) | indexado |
| [APPSTAFF_ROUTE_MAP.md](./APPSTAFF_ROUTE_MAP.md) | indexado |
| [APPSTAFF_RUNTIME_MODEL.md](./APPSTAFF_RUNTIME_MODEL.md) | indexado |
| [APPSTAFF_SYNC_MAP.md](./APPSTAFF_SYNC_MAP.md) | indexado |
| [APPSTAFF_UI_SURGERY_SUMMARY.md](./APPSTAFF_UI_SURGERY_SUMMARY.md) | indexado |
| [APPSTAFF_UX_ARCHITECTURE.md](./APPSTAFF_UX_ARCHITECTURE.md) | indexado |
| [APPSTAFF_VISUAL_CANON.md](./APPSTAFF_VISUAL_CANON.md) | indexado |
| [APP_O_QUE_E_E_COERENCIA.md](./APP_O_QUE_E_E_COERENCIA.md) | indexado |
| [APP_STAFF_MOBILE_CONTRACT.md](./APP_STAFF_MOBILE_CONTRACT.md) | indexado |
| [ARCHITECTURE_CANON.md](./ARCHITECTURE_CANON.md) | indexado |
| [ARCHITECTURE_DECISION_RECORDS.md](./ARCHITECTURE_DECISION_RECORDS.md) | indexado |
| [ARCHITECTURE_GUARD.md](./ARCHITECTURE_GUARD.md) | indexado |
| [ARCHITECTURE_OFFICIAL_2026.md](./ARCHITECTURE_OFFICIAL_2026.md) | indexado |
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | indexado |
| [ARQUITETURA_E_APPSTAFF_COMPLETO.md](./ARQUITETURA_E_APPSTAFF_COMPLETO.md) | indexado |
| [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) | indexado |
| [AUDITORIA_CORE_SISTEMA_2026-02-03.md](./AUDITORIA_CORE_SISTEMA_2026-02-03.md) | indexado |
| [AUDITOR_MUDANCAS_SOBERANIA.md](./AUDITOR_MUDANCAS_SOBERANIA.md) | indexado |
| [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) | indexado |
| [AUDIT_SUPABASE_DOMAIN_FASE2.md](./AUDIT_SUPABASE_DOMAIN_FASE2.md) | indexado |
| [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | indexado |
| [BEVERAGE_CANON.md](./BEVERAGE_CANON.md) | indexado |
| [BILLING_FLOW.md](./BILLING_FLOW.md) | indexado |
| [BILLING_OPERATIONAL_CONTRACT.md](./BILLING_OPERATIONAL_CONTRACT.md) | indexado |
| [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md) | indexado |
| [BOOTSTRAP_CONTRACT.md](./BOOTSTRAP_CONTRACT.md) | indexado |
| [BOOTSTRAP_KERNEL.md](./BOOTSTRAP_KERNEL.md) | indexado |
| [BOOT_CHAIN.md](./BOOT_CHAIN.md) | indexado |
| [BOUNDARY_CONTEXTS.md](./BOUNDARY_CONTEXTS.md) | indexado |
| [C4_COMPONENT.md](./C4_COMPONENT.md) | indexado |
| [C4_CONTAINER.md](./C4_CONTAINER.md) | indexado |
| [C4_CONTEXT.md](./C4_CONTEXT.md) | indexado |
| [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) | indexado |
| [CANONICAL_ROUTES_BY_MODE.md](./CANONICAL_ROUTES_BY_MODE.md) | indexado |
| [CASH_REGISTER_LIFECYCLE_CONTRACT.md](./CASH_REGISTER_LIFECYCLE_CONTRACT.md) | indexado |
| [CATALOGO_ACOES_CRIACAO_RESTAURANTE.md](./CATALOGO_ACOES_CRIACAO_RESTAURANTE.md) | indexado |
| [CHEFIAPP_OS_DELIVERY.md](./CHEFIAPP_OS_DELIVERY.md) | indexado |
| [CHEFIAPP_PRICING_AND_POSITIONING.md](./CHEFIAPP_PRICING_AND_POSITIONING.md) | indexado |
| [CLOSED_PILOT_CONTRACT.md](./CLOSED_PILOT_CONTRACT.md) | indexado |
| [CODE_AND_DEVICE_PAIRING_CONTRACT.md](./CODE_AND_DEVICE_PAIRING_CONTRACT.md) | indexado |
| [COGNITIVE_MODES_OWNER_DASHBOARD.md](./COGNITIVE_MODES_OWNER_DASHBOARD.md) | indexado |
| [CONFIGURATION_MAP_V1.md](./CONFIGURATION_MAP_V1.md) | indexado |
| [CONFIG_GENERAL_WIREFRAME.md](./CONFIG_GENERAL_WIREFRAME.md) | indexado |
| [CONFIG_LOCATION_VS_CONTRACT.md](./CONFIG_LOCATION_VS_CONTRACT.md) | indexado |
| [CONFIG_UBICACIONES_CONTRACT.md](./CONFIG_UBICACIONES_CONTRACT.md) | indexado |
| [CONTRACT_AUDIT_REFERENCED.md](./CONTRACT_AUDIT_REFERENCED.md) | indexado |
| [CONTRACT_CREATION_PROTOCOL.md](./CONTRACT_CREATION_PROTOCOL.md) | indexado |
| [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) | indexado |
| [CONTRACT_IMPLEMENTATION_STATUS.md](./CONTRACT_IMPLEMENTATION_STATUS.md) | indexado |
| [CONTRACT_RECONCILIATION_FINAL.md](./CONTRACT_RECONCILIATION_FINAL.md) | indexado |
| [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md) | indexado |
| [CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md](./CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md) | indexado |
| [CORE_APPSTAFF_IDENTITY_CONTRACT.md](./CORE_APPSTAFF_IDENTITY_CONTRACT.md) | indexado |
| [CORE_APPSTAFF_IOS_UIUX_CONTRACT.md](./CORE_APPSTAFF_IOS_UIUX_CONTRACT.md) | indexado |
| [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) | indexado |
| [CORE_CONTRACT_COVERAGE.md](./CORE_CONTRACT_COVERAGE.md) | indexado |
| [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md) | indexado |
| [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) | indexado |
| [CORE_DECISION_LOG.md](./CORE_DECISION_LOG.md) | indexado |
| [CORE_DESIGN_IMPLEMENTATION_POLICY.md](./CORE_DESIGN_IMPLEMENTATION_POLICY.md) | indexado |
| [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md) | indexado |
| [CORE_EVENTS_CONTRACT.md](./CORE_EVENTS_CONTRACT.md) | indexado |
| [CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT.md](./CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT.md) | indexado |
| [CORE_EXECUTION_TOPOLOGY.md](./CORE_EXECUTION_TOPOLOGY.md) | indexado |
| [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md) | indexado |
| [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) | indexado |
| [CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md](./CORE_HEARTBEAT_AND_LIVENESS_CONTRACT.md) | indexado |
| [CORE_IDENTITY_AND_TRUST_CONTRACT.md](./CORE_IDENTITY_AND_TRUST_CONTRACT.md) | indexado |
| [CORE_IMMUTABLE_SHIFT_CONTRACT.md](./CORE_IMMUTABLE_SHIFT_CONTRACT.md) | indexado |
| [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md) | indexado |
| [CORE_INVISIBLE_LAWS_INDEX.md](./CORE_INVISIBLE_LAWS_INDEX.md) | indexado |
| [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md) | indexado |
| [CORE_LANDING_ROUTES_CONTRACT.md](./CORE_LANDING_ROUTES_CONTRACT.md) | indexado |
| [CORE_MANIFESTO.md](./CORE_MANIFESTO.md) | indexado |
| [CORE_MOBILE_TERMINALS_CONTRACT.md](./CORE_MOBILE_TERMINALS_CONTRACT.md) | indexado |
| [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md) | indexado |
| [CORE_OPERATIONAL_AWARENESS_CONTRACT.md](./CORE_OPERATIONAL_AWARENESS_CONTRACT.md) | indexado |
| [CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md](./CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md) | indexado |
| [CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md](./CORE_OPERATIONAL_GOVERNANCE_CONTRACT.md) | indexado |
| [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md) | indexado |
| [CORE_OS_LAYERS.md](./CORE_OS_LAYERS.md) | indexado |
| [CORE_OVERRIDE_AND_AUTHORITY_CONTRACT.md](./CORE_OVERRIDE_AND_AUTHORITY_CONTRACT.md) | indexado |
| [CORE_PRINT_CONTRACT.md](./CORE_PRINT_CONTRACT.md) | indexado |
| [CORE_RECONCILIATION_CONTRACT.md](./CORE_RECONCILIATION_CONTRACT.md) | indexado |
| [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) | indexado |
| [CORE_SCHEMA_MIN_CONTRACT.md](./CORE_SCHEMA_MIN_CONTRACT.md) | indexado |
| [CORE_SILENCE_AND_NOISE_POLICY.md](./CORE_SILENCE_AND_NOISE_POLICY.md) | indexado |
| [CORE_STATE.md](./CORE_STATE.md) | indexado |
| [CORE_SYSTEM_AWARENESS_MODEL.md](./CORE_SYSTEM_AWARENESS_MODEL.md) | indexado |
| [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) | indexado |
| [CORE_SYSTEM_TREE_CONTRACT.md](./CORE_SYSTEM_TREE_CONTRACT.md) | indexado |
| [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md) | indexado |
| [CORE_TASK_SYSTEM_CONTRACT.md](./CORE_TASK_SYSTEM_CONTRACT.md) | indexado |
| [CORE_TIME_AND_TURN_CONTRACT.md](./CORE_TIME_AND_TURN_CONTRACT.md) | indexado |
| [CORE_TIME_GOVERNANCE_CONTRACT.md](./CORE_TIME_GOVERNANCE_CONTRACT.md) | indexado |
| [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md) | indexado |
| [CORE_TRUTH_HIERARCHY.md](./CORE_TRUTH_HIERARCHY.md) | indexado |
| [CORE_WEB_COMMAND_CENTER_CONTRACT.md](./CORE_WEB_COMMAND_CENTER_CONTRACT.md) | indexado |
| [CURRENT_SYSTEM_MAP.md](./CURRENT_SYSTEM_MAP.md) | indexado |
| [CUSTOMER_JOURNEY_MAP.md](./CUSTOMER_JOURNEY_MAP.md) | indexado |
| [DATABASE_AUTHORITY.md](./DATABASE_AUTHORITY.md) | indexado |
| [DATA_LINEAGE.md](./DATA_LINEAGE.md) | indexado |
| [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) | indexado |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | indexado |
| [DESIGN_SYSTEM_ALIGNMENT.md](./DESIGN_SYSTEM_ALIGNMENT.md) | indexado |
| [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md) | indexado |
| [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md) | indexado |
| [DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md](./DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md) | indexado |
| [DESKTOP_DISTRIBUTION_CONTRACT.md](./DESKTOP_DISTRIBUTION_CONTRACT.md) | indexado |
| [DEVICE_TURN_SHIFT_TASK_CONTRACT.md](./DEVICE_TURN_SHIFT_TASK_CONTRACT.md) | indexado |
| [DIAGRAMAS_SOBERANIA_CHEFIAPP.md](./DIAGRAMAS_SOBERANIA_CHEFIAPP.md) | indexado |
| [DOCKER_CORE_ONLY.md](./DOCKER_CORE_ONLY.md) | indexado |
| [DOMINIOS_E_CONTRATOS.md](./DOMINIOS_E_CONTRATOS.md) | indexado |
| [DYNAMIC_CONTEXTUAL_MENU.md](./DYNAMIC_CONTEXTUAL_MENU.md) | indexado |
| [EDGE_CASES.md](./EDGE_CASES.md) | indexado |
| [ENTRADA_TELEFONE_DASHBOARD.md](./ENTRADA_TELEFONE_DASHBOARD.md) | indexado |
| [EVENTS_CONTRACT_V1.md](./EVENTS_CONTRACT_V1.md) | indexado |
| [EVENT_BUS_IMPLEMENTATION_COMPLETE.md](./EVENT_BUS_IMPLEMENTATION_COMPLETE.md) | indexado |
| [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) | indexado |
| [EXPORT_FORMATS.md](./EXPORT_FORMATS.md) | indexado |
| [FINANCIAL_CORE_VIOLATION_AUDIT.md](./FINANCIAL_CORE_VIOLATION_AUDIT.md) | indexado |
| [FISCAL_POSITIONING.md](./FISCAL_POSITIONING.md) | indexado |
| [FISCAL_RECONCILIATION_CONTRACT.md](./FISCAL_RECONCILIATION_CONTRACT.md) | indexado |
| [FLOW_TPV_ORDER_KDS.md](./FLOW_TPV_ORDER_KDS.md) | indexado |
| [FOLDER_MAP.md](./FOLDER_MAP.md) | indexado |
| [FUTURE_CONTRACTS_MAP.md](./FUTURE_CONTRACTS_MAP.md) | indexado |
| [GATES_FLUXO_CRIACAO_E_OPERACAO.md](./GATES_FLUXO_CRIACAO_E_OPERACAO.md) | indexado |
| [GDPR_MAPPING.md](./GDPR_MAPPING.md) | indexado |
| [HEARTBEAT_MINIMAL_CONTRACT.md](./HEARTBEAT_MINIMAL_CONTRACT.md) | indexado |
| [INSTALLATION_MINIMAL_CONTRACT.md](./INSTALLATION_MINIMAL_CONTRACT.md) | indexado |
| [KERNEL_EXECUTION_MODEL.md](./KERNEL_EXECUTION_MODEL.md) | indexado |
| [LANDING_STATE_ROUTING_CONTRACT.md](./LANDING_STATE_ROUTING_CONTRACT.md) | indexado |
| [LEGACY_UI_STATUS.md](./LEGACY_UI_STATUS.md) | indexado |
| [MANAGEMENT_ADVISOR_CONTRACT.md](./MANAGEMENT_ADVISOR_CONTRACT.md) | indexado |
| [MAPS_AUDIT_REPORT.md](./MAPS_AUDIT_REPORT.md) | indexado |
| [MENU_BUILDER_CONTRACT_V1.md](./MENU_BUILDER_CONTRACT_V1.md) | indexado |
| [MENU_CATALOG_VISUAL_SPEC.md](./MENU_CATALOG_VISUAL_SPEC.md) | indexado |
| [MENU_CONTRACT.md](./MENU_CONTRACT.md) | indexado |
| [MENU_CORE_CONTRACT.md](./MENU_CORE_CONTRACT.md) | indexado |
| [MENU_CREATION_METHODS.md](./MENU_CREATION_METHODS.md) | indexado |
| [MENU_DERIVATIONS.md](./MENU_DERIVATIONS.md) | indexado |
| [MENU_DERIVATIONS_CHECKLIST.md](./MENU_DERIVATIONS_CHECKLIST.md) | indexado |
| [MENU_FALLBACK_CONTRACT.md](./MENU_FALLBACK_CONTRACT.md) | indexado |
| [MENU_HEADER_WAVE_CONTRACT.md](./MENU_HEADER_WAVE_CONTRACT.md) | indexado |
| [MENU_IMPORT_CONTRACT.md](./MENU_IMPORT_CONTRACT.md) | indexado |
| [MENU_OPERATIONAL_STATE.md](./MENU_OPERATIONAL_STATE.md) | indexado |
| [MENU_VISUAL_CONTRACT.md](./MENU_VISUAL_CONTRACT.md) | indexado |
| [MENU_VISUAL_RUNTIME_CONTRACT.md](./MENU_VISUAL_RUNTIME_CONTRACT.md) | indexado |
| [MERCHANT_PORTAL_RUNTIME_CONTRACT.md](./MERCHANT_PORTAL_RUNTIME_CONTRACT.md) | indexado |
| [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md) | indexado |
| [MODULES_AND_DEVICES_ANTIREGRESSION.md](./MODULES_AND_DEVICES_ANTIREGRESSION.md) | indexado |
| [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) | indexado |
| [MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md](./MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md) | indexado |
| [MULTI_TENANT_ARCHITECTURE.md](./MULTI_TENANT_ARCHITECTURE.md) | indexado |
| [MULTI_TENANT_ROLES_CONTRACT.md](./MULTI_TENANT_ROLES_CONTRACT.md) | indexado |
| [NAVIGATION_CONTRACT.md](./NAVIGATION_CONTRACT.md) | indexado |
| [NAVIGATION_OPERATIONAL_CONTRACT.md](./NAVIGATION_OPERATIONAL_CONTRACT.md) | indexado |
| [NON_MUSCLE_INFRASTRUCTURE_CONTRACT.md](./NON_MUSCLE_INFRASTRUCTURE_CONTRACT.md) | indexado |
| [NOW_ENGINE.md](./NOW_ENGINE.md) | indexado |
| [NOW_ENGINE_DIAGRAM.md](./NOW_ENGINE_DIAGRAM.md) | indexado |
| [NOW_ENGINE_RULES.md](./NOW_ENGINE_RULES.md) | indexado |
| [OBSERVABILITY_LOGGING_CONTRACT.md](./OBSERVABILITY_LOGGING_CONTRACT.md) | indexado |
| [OFFLINE_IDEMPOTENCY_CONTRACT.md](./OFFLINE_IDEMPOTENCY_CONTRACT.md) | indexado |
| [OFFLINE_PRINT_ORDER_CONTRACT.md](./OFFLINE_PRINT_ORDER_CONTRACT.md) | indexado |
| [OFFLINE_STRATEGY.md](./OFFLINE_STRATEGY.md) | indexado |
| [ONBOARDING_FLOW.md](./ONBOARDING_FLOW.md) | indexado |
| [ONDE_VER_NO_NAVEGADOR.md](./ONDE_VER_NO_NAVEGADOR.md) | indexado |
| [OPERATIONAL_APP_MODE_CONTRACT.md](./OPERATIONAL_APP_MODE_CONTRACT.md) | indexado |
| [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) | indexado |
| [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) | indexado |
| [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md) | indexado |
| [OPERATIONAL_READINESS_DECLARATION.md](./OPERATIONAL_READINESS_DECLARATION.md) | indexado |
| [OPERATIONAL_READINESS_ENGINE.md](./OPERATIONAL_READINESS_ENGINE.md) | indexado |
| [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) | indexado |
| [OPERATIONAL_UI_RESILIENCE_CONTRACT.md](./OPERATIONAL_UI_RESILIENCE_CONTRACT.md) | indexado |
| [OPTIONAL_FEATURE_TABLES_CONTRACT.md](./OPTIONAL_FEATURE_TABLES_CONTRACT.md) | indexado |
| [ORDER_ORIGIN_CLASSIFICATION.md](./ORDER_ORIGIN_CLASSIFICATION.md) | indexado |
| [ORE_ORGANISM_AND_MENU.md](./ORE_ORGANISM_AND_MENU.md) | indexado |
| [OS_ARCHITECTURE_AND_EVENT_FLOW_AUDIT.md](./OS_ARCHITECTURE_AND_EVENT_FLOW_AUDIT.md) | indexado |
| [OWASP_ASVS_CHECKLIST.md](./OWASP_ASVS_CHECKLIST.md) | indexado |
| [OWNER_DASHBOARD_WIREFRAME.md](./OWNER_DASHBOARD_WIREFRAME.md) | indexado |
| [PAGE_TYPES_AND_TEMPLATES_CONTRACT.md](./PAGE_TYPES_AND_TEMPLATES_CONTRACT.md) | indexado |
| [PAYMENT_LAYER.md](./PAYMENT_LAYER.md) | indexado |
| [PHASE1_HYBRID_IMPLEMENTATION_COMPLETE.md](./PHASE1_HYBRID_IMPLEMENTATION_COMPLETE.md) | indexado |
| [PILOT_MODE_RUNTIME_CONTRACT.md](./PILOT_MODE_RUNTIME_CONTRACT.md) | indexado |
| [PLANO_REFATORACAO_BOUNDARY_18_FICHEIROS.md](./PLANO_REFATORACAO_BOUNDARY_18_FICHEIROS.md) | indexado |
| [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) | indexado |
| [PRODUCTION_READINESS_CONTRACT.md](./PRODUCTION_READINESS_CONTRACT.md) | indexado |
| [PROMPT_DESIGN_SYSTEM_UNIFICATION.md](./PROMPT_DESIGN_SYSTEM_UNIFICATION.md) | indexado |
| [PROMPT_STANDARD.md](./PROMPT_STANDARD.md) | indexado |
| [PROVIDERS_ARCHITECTURE.md](./PROVIDERS_ARCHITECTURE.md) | indexado |
| [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md) | indexado |
| [PUBLIC_WEB_ORDER_FLOW_CONTRACT.md](./PUBLIC_WEB_ORDER_FLOW_CONTRACT.md) | indexado |
| [QUERY_DISCIPLINE_CONTRACT.md](./QUERY_DISCIPLINE_CONTRACT.md) | indexado |
| [RATE_LIMITING_AND_INPUT_VALIDATION.md](./RATE_LIMITING_AND_INPUT_VALIDATION.md) | indexado |
| [README.md](./README.md) | indexado |
| [READY_TO_PUBLISH_CHECKLIST.md](./READY_TO_PUBLISH_CHECKLIST.md) | indexado |
| [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](./RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md) | indexado |
| [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) | indexado |
| [RESTAURANT_LOGO_IDENTITY_CONTRACT.md](./RESTAURANT_LOGO_IDENTITY_CONTRACT.md) | indexado |
| [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md) | indexado |
| [RESTAURANT_PEOPLE_AND_INVITES_CONTRACT.md](./RESTAURANT_PEOPLE_AND_INVITES_CONTRACT.md) | indexado |
| [RETENTION_POLICY.md](./RETENTION_POLICY.md) | indexado |
| [ROLE_TRANSITIONS.md](./ROLE_TRANSITIONS.md) | indexado |
| [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) | indexado |
| [ROUTES_AND_BOOT_DIAGRAM.md](./ROUTES_AND_BOOT_DIAGRAM.md) | indexado |
| [ROUTES_CANONICAL_CONTRACT.md](./ROUTES_CANONICAL_CONTRACT.md) | indexado |
| [RUNTIME_CONNECTIVITY_CONTRACT.md](./RUNTIME_CONNECTIVITY_CONTRACT.md) | indexado |
| [SCRIPTS_OFICIAIS.md](./SCRIPTS_OFICIAIS.md) | indexado |
| [SESSION_RESUME_CONTRACT.md](./SESSION_RESUME_CONTRACT.md) | indexado |
| [SLO_SLI.md](./SLO_SLI.md) | indexado |
| [SOFIA_GASTROBAR_REAL_PILOT.md](./SOFIA_GASTROBAR_REAL_PILOT.md) | indexado |
| [SOVEREIGN_MODE_TECHNICAL.md](./SOVEREIGN_MODE_TECHNICAL.md) | indexado |
| [SPONSORED_CONTEXTUAL_MENU.md](./SPONSORED_CONTEXTUAL_MENU.md) | indexado |
| [STACK_2026.md](./STACK_2026.md) | indexado |
| [STAFF_SESSION_LOCATION_CONTRACT.md](./STAFF_SESSION_LOCATION_CONTRACT.md) | indexado |
| [STOCK_OS_CONTRACT.md](./STOCK_OS_CONTRACT.md) | indexado |
| [SURFACES_ARCHITECTURE.md](./SURFACES_ARCHITECTURE.md) | indexado |
| [SURFACES_CURRENT_STATE.md](./SURFACES_CURRENT_STATE.md) | indexado |
| [SURFACE_MAP.md](./SURFACE_MAP.md) | indexado |
| [SYSTEM_OVERVIEW_DIAGRAM.md](./SYSTEM_OVERVIEW_DIAGRAM.md) | indexado |
| [SYSTEM_RULE_DEVICE_ONLY.md](./SYSTEM_RULE_DEVICE_ONLY.md) | indexado |
| [SYSTEM_TREE_VS_EXECUTION.md](./SYSTEM_TREE_VS_EXECUTION.md) | indexado |
| [TASK_SYSTEM_MATRIX_AND_RITUAL.md](./TASK_SYSTEM_MATRIX_AND_RITUAL.md) | indexado |
| [TEMPLATE_SELECTION_CONTRACT.md](./TEMPLATE_SELECTION_CONTRACT.md) | indexado |
| [TENANCY_KERNEL_CONTRACT.md](./TENANCY_KERNEL_CONTRACT.md) | indexado |
| [TENANT_SELECTION_CONTRACT.md](./TENANT_SELECTION_CONTRACT.md) | indexado |
| [TERMINAL_IDENTITY_MINIMAL_CONTRACT.md](./TERMINAL_IDENTITY_MINIMAL_CONTRACT.md) | indexado |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | indexado |
| [THREAT_MODEL_MITIGATION_MATRIX.md](./THREAT_MODEL_MITIGATION_MATRIX.md) | indexado |
| [TPV_INSTALLATION_CONTRACT.md](./TPV_INSTALLATION_CONTRACT.md) | indexado |
| [TPV_ROUTES_AND_ENDPOINTS_CONTRACT.md](./TPV_ROUTES_AND_ENDPOINTS_CONTRACT.md) | indexado |
| [TRIAL_MODE_CONTRACT.md](./TRIAL_MODE_CONTRACT.md) | indexado |
| [TWO_DASHBOARDS_REFERENCE.md](./TWO_DASHBOARDS_REFERENCE.md) | indexado |
| [UI_V2_ARCHITECTURE.md](./UI_V2_ARCHITECTURE.md) | indexado |
| [UI_V2_IMPLEMENTATION_STATUS.md](./UI_V2_IMPLEMENTATION_STATUS.md) | indexado |
| [UI_V2_MANIFEST.md](./UI_V2_MANIFEST.md) | indexado |
| [WHAT_WE_DO_NOT_PROCESS.md](./WHAT_WE_DO_NOT_PROCESS.md) | indexado |
| [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md) | indexado |
| [tenant-model.md](./tenant-model.md) | indexado |

### docs/contracts

| Documento | Status |
| --- | --- |
| [ACCESS_RULES_MINIMAL.md](../contracts/ACCESS_RULES_MINIMAL.md) | indexado |
| [BILLING_AND_PLAN_CONTRACT.md](../contracts/BILLING_AND_PLAN_CONTRACT.md) | indexado |
| [CASH_REGISTER_AND_PAYMENTS_CONTRACT.md](../contracts/CASH_REGISTER_AND_PAYMENTS_CONTRACT.md) | indexado |
| [CONFIG_RUNTIME_CONTRACT.md](../contracts/CONFIG_RUNTIME_CONTRACT.md) | indexado |
| [CONFIG_WEB_UX.md](../contracts/CONFIG_WEB_UX.md) | indexado |
| [CONTRATO_DE_ATIVIDADE_OPERACIONAL.md](../contracts/CONTRATO_DE_ATIVIDADE_OPERACIONAL.md) | indexado |
| [CONTRATO_DO_TURNO.md](../contracts/CONTRATO_DO_TURNO.md) | indexado |
| [CONTRATO_ENTRADA_CANONICA.md](../contracts/CONTRATO_ENTRADA_CANONICA.md) | indexado |
| [CONTRATO_LANDING_CANONICA.md](../contracts/CONTRATO_LANDING_CANONICA.md) | indexado |
| [CONTRATO_OWNER_ONLY_WEB.md](../contracts/CONTRATO_OWNER_ONLY_WEB.md) | indexado |
| [CONTRATO_PRONTIDAO_DADOS.md](../contracts/CONTRATO_PRONTIDAO_DADOS.md) | indexado |
| [CONTRATO_TRIAL_REAL.md](../contracts/CONTRATO_TRIAL_REAL.md) | indexado |
| [CONTRATO_VIDA_RESTAURANTE.md](../contracts/CONTRATO_VIDA_RESTAURANTE.md) | indexado |
| [CORE_FINANCE_CONTRACT_v1.md](../contracts/CORE_FINANCE_CONTRACT_v1.md) | indexado |
| [CORE_FOUR_TERMINALS_INDEX.md](../contracts/CORE_FOUR_TERMINALS_INDEX.md) | indexado |
| [CORE_PUBLIC_WEB_CONTRACT.md](../contracts/CORE_PUBLIC_WEB_CONTRACT.md) | indexado |
| [DOMAIN_WRITE_AUTHORITY_CONTRACT.md](../contracts/DOMAIN_WRITE_AUTHORITY_CONTRACT.md) | indexado |
| [EVENTS_AND_STREAMS.md](../contracts/EVENTS_AND_STREAMS.md) | indexado |
| [EXECUTION_CONTEXT_CONTRACT.md](../contracts/EXECUTION_CONTEXT_CONTRACT.md) | indexado |
| [EXECUTION_FENCE_CONTRACT.md](../contracts/EXECUTION_FENCE_CONTRACT.md) | indexado |
| [FIRST_SALE_RITUAL.md](../contracts/FIRST_SALE_RITUAL.md) | indexado |
| [FLUXO_DE_PEDIDO_OPERACIONAL.md](../contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md) | indexado |
| [FUNIL_VIDA_CLIENTE.md](../contracts/FUNIL_VIDA_CLIENTE.md) | indexado |
| [INTEGRATION_EVENT_CATALOG.md](../contracts/INTEGRATION_EVENT_CATALOG.md) | indexado |
| [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md) | indexado |
| [KDS_LAYOUT_UX_CONTRACT.md](../contracts/KDS_LAYOUT_UX_CONTRACT.md) | indexado |
| [LEI_DO_TURNO.md](../contracts/LEI_DO_TURNO.md) | indexado |
| [LOGO_IDENTITY_CONTRACT.md](../contracts/LOGO_IDENTITY_CONTRACT.md) | indexado |
| [MENU_BUILDING_CONTRACT_v1.md](../contracts/MENU_BUILDING_CONTRACT_v1.md) | indexado |
| [MENU_MINIMAL_CONTRACT.md](../contracts/MENU_MINIMAL_CONTRACT.md) | indexado |
| [ONBOARDING_5MIN_9_TELAS_CONTRACT.md](../contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md) | indexado |
| [ONBOARDING_ASSISTANT_CONTRACT.md](../contracts/ONBOARDING_ASSISTANT_CONTRACT.md) | indexado |
| [ONBOARDING_FLOW_CONTRACT.md](../contracts/ONBOARDING_FLOW_CONTRACT.md) | indexado |
| [OPERATIONAL_ALERTS_CONTRACT.md](../contracts/OPERATIONAL_ALERTS_CONTRACT.md) | indexado |
| [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](../contracts/OPERATIONAL_DASHBOARD_V2_CONTRACT.md) | indexado |
| [OPERATIONAL_DEVICE_ONLY_CONTRACT.md](../contracts/OPERATIONAL_DEVICE_ONLY_CONTRACT.md) | indexado |
| [OPERATIONAL_HEADER_CONTRACT.md](../contracts/OPERATIONAL_HEADER_CONTRACT.md) | indexado |
| [OPERATIONAL_KERNEL_CONTRACT.md](../contracts/OPERATIONAL_KERNEL_CONTRACT.md) | indexado |
| [OPERATIONAL_NAVIGATION_SOVEREIGNTY.md](../contracts/OPERATIONAL_NAVIGATION_SOVEREIGNTY.md) | indexado |
| [OPERATIONAL_SURFACES_CONTRACT.md](../contracts/OPERATIONAL_SURFACES_CONTRACT.md) | indexado |
| [OPERATION_MODE_CONTRACT.md](../contracts/OPERATION_MODE_CONTRACT.md) | indexado |
| [ORDER_STATUS_CONTRACT_v1.md](../contracts/ORDER_STATUS_CONTRACT_v1.md) | indexado |
| [README.md](../contracts/README.md) | indexado |
| [RESTAURANT_BOOTSTRAP_CONTRACT.md](../contracts/RESTAURANT_BOOTSTRAP_CONTRACT.md) | indexado |
| [RESTAURANT_LIFECYCLE_CONTRACT.md](../contracts/RESTAURANT_LIFECYCLE_CONTRACT.md) | indexado |
| [STATUS_CONTRACT.md](../contracts/STATUS_CONTRACT.md) | indexado |
| [SUPABASE_ZERO_LOCAL_STACK.md](../contracts/SUPABASE_ZERO_LOCAL_STACK.md) | indexado |
| [TASKS_CONTRACT_v1.md](../contracts/TASKS_CONTRACT_v1.md) | indexado |
| [TERMINAL_INSTALLATION_RITUAL.md](../contracts/TERMINAL_INSTALLATION_RITUAL.md) | indexado |
| [TRIAL_ACCOUNT_CONTRACT.md](../contracts/TRIAL_ACCOUNT_CONTRACT.md) | indexado |
| [TRIAL_OPERATION_CONTRACT.md](../contracts/TRIAL_OPERATION_CONTRACT.md) | indexado |
| [TRIAL_TO_PAID_CONTRACT.md](../contracts/TRIAL_TO_PAID_CONTRACT.md) | indexado |
| [WEEKLY_RESTAURANT_SIMULATION_CONTRACT.md](../contracts/WEEKLY_RESTAURANT_SIMULATION_CONTRACT.md) | indexado |
| [WORLD_SCHEMA_v1.md](../contracts/WORLD_SCHEMA_v1.md) | indexado |
