# PRD — Sistema de Tarefas

**Propósito:** PRD (Product Requirements Document) do **sistema de tarefas**: criação, execução, KDS e checklists. Formaliza requisitos de produto a partir dos contratos Core (CORE_TASK_SYSTEM, CORE_TASK_EXECUTION) e documentação KDS/product.  
**Público:** Produto, engenharia.  
**Referência:** [CORE_TASK_SYSTEM_CONTRACT.md](../architecture/CORE_TASK_SYSTEM_CONTRACT.md) · [CORE_TASK_EXECUTION_CONTRACT.md](../architecture/CORE_TASK_EXECUTION_CONTRACT.md) · [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md)

---

## 1. Visão e objetivo

- **Objetivo:** Permitir que gerentes/donos criem tarefas (ligadas a pedidos ou operacionais) e que staff as execute e reporte; tarefas de cozinha aparecem no KDS; SLA e prioridade governados pelo Core.
- **Regra-mãe:** Tarefas são criadas na Web ou no AppStaff (gerente/dono). Staff apenas executa. Core é fonte de verdade.

---

## 2. Requisitos funcionais

### 2.1 Criação de tarefas

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Criar na Web** | Command Center (painel Tarefas): gerente/dono cria tarefa, atribui (equipa/cargo), define tipo (pedido / operacional). | P0 |
| **Criar no AppStaff** | Gerente/dono no mobile pode criar tarefa; staff não cria. | P1 |
| **Tipos** | Tarefa ligada a pedido (ex.: "Entregar pedido #12 à mesa 5"); tarefa operacional (ex.: "Limpar fritadeira", "Repor gelo"). | P0 |
| **Atribuição** | Atribuir a equipa, cargo ou pessoa; Core encaminha para os terminais corretos. | P1 |

### 2.2 Execução e reporte

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **Listar no AppStaff** | Staff vê tarefas atribuídas; executar, confirmar, reportar (sem criar). | P0 |
| **Listar no KDS** | Tarefas de cozinha (ligadas a pedidos ou operacionais de cozinha) aparecem no KDS; SLA e confirmação de preparo/conclusão. | P0 |
| **Confirmação** | Staff/KDS confirma conclusão; Core regista; estado visível no Command Center. | P0 |
| **Não criar (staff)** | Staff não cria tarefas; apenas recebe, executa e reporta. | P0 |

### 2.3 SLA e prioridade

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **SLA no Core** | Core define prazos e prioridade; UI (Web, AppStaff, KDS) mostra; não calcula nem altera. | P0 |
| **Atraso / alerta** | Tarefa atrasada pode virar alerta ou incidente conforme CORE_OPERATIONAL_GOVERNANCE e CORE_TIME_GOVERNANCE. | P1 |

### 2.4 KDS e checklists

| Requisito | Descrição | Prioridade |
|-----------|-----------|------------|
| **KDS mostra tarefas** | KDS mostra fila de pedidos e tarefas de cozinha; confirma estados (em preparo, pronto). | P0 |
| **Checklists (futuro)** | Checklists por tipo de pedido ou operação (ex.: passos de preparo) — evolução. | P2 |

---

## 3. Requisitos não funcionais

- **Fonte de verdade:** Apenas o Core; nenhum terminal inventa tarefas nem regras de prioridade/SLA.
- **Consistência:** Tarefa criada na Web aparece no AppStaff e no KDS (se aplicável) sem atraso inaceitável (eventual consistency).
- **UX:** Mensagens e estados alinhados a GlobalUIState e OPERATIONAL_UI_RESILIENCE (loading, empty, error, blocked).

---

## 4. Referências de contrato

- [CORE_TASK_SYSTEM_CONTRACT.md](../architecture/CORE_TASK_SYSTEM_CONTRACT.md) — Quem cria, tipos, onde aparecem, SLA, KDS ⇄ Tarefas.
- [CORE_TASK_EXECUTION_CONTRACT.md](../architecture/CORE_TASK_EXECUTION_CONTRACT.md) — AppStaff: mostrar, confirmar, executar, reportar.
- [CORE_KDS_CONTRACT.md](../architecture/CORE_KDS_CONTRACT.md) — KDS: pedidos e tarefas de cozinha.
- Documentação KDS: [KDS_PERFEITO_DESIGN.md](./KDS_PERFEITO_DESIGN.md), [KDS_PHASE5_PLAN.md](./KDS_PHASE5_PLAN.md) (referência de evolução).

---

## 5. Critérios de aceite (resumo)

- [ ] Gerente/dono cria tarefa no Command Center (Web) com tipo e atribuição.
- [ ] Tarefa aparece no AppStaff para staff atribuído e no KDS quando for tarefa de cozinha.
- [ ] Staff confirma conclusão; estado atualiza no Core e reflete na Web.
- [ ] Staff não consegue criar tarefas; apenas executar e reportar.
- [ ] SLA e prioridade definidos pelo Core e exibidos nos terminais.

---

*Documento vivo. Alterações em requisitos devem ser alinhadas aos contratos Core.*
