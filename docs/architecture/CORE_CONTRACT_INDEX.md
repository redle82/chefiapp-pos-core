# Índice de Contratos Core

**Propósito:** Lista canónica de contratos de arquitectura do ChefIApp Core. Referência única para navegação e auditoria.

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
