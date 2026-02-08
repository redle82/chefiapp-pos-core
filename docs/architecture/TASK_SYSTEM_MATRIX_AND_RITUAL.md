# Task System — Matriz por Papel e Ritual Operacional

**Status:** CONTRATUAL  
**Tipo:** Corpo do Task System — matriz de tarefas por papel, momento do turno, tipos e relação com alertas/saúde.  
**Subordinado a:** [CHEFIAPP_PRODUCT_DOCTRINE.md](../CHEFIAPP_PRODUCT_DOCTRINE.md), [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md), [CHEFIAPP_SYSTEM_MAP.html](../CHEFIAPP_SYSTEM_MAP.html).

---

## 1. Matriz de tarefas por papel

Por papel: **tarefas críticas** (bloqueiam estado ou venda), **recorrentes** (ritmo do turno), **eventuais** (sob demanda).

| Papel | Críticas | Recorrentes | Eventuais |
| ----- | -------- | ----------- | --------- |
| **Dono (Owner)** | Validar configuração mínima para vender; decisões de fecho. | Rever saúde operacional; relatórios; alertas. | Ajustes de permissões; modos (demo/pilot/prod). |
| **Gerente (Manager)** | Abrir/fechar turno; garantir prontidão para vender. | Atribuir tarefas; acompanhar fila; resolver alertas. | Ajustes de cardápio/preços; escalas; incidentes. |
| **Garçom (Waiter)** | Entregar pedidos; confirmar servido. | Atender mesas; repor; comunicar com cozinha. | Pedidos especiais; reclamações; limpeza de mesa. |
| **Cozinha (Kitchen)** | Preparar e marcar pedidos (em preparo → pronto). | Manter ritmo; repor prep; limpeza de linha. | Picos; ajustes de tempo; avarias. |
| **Limpeza (Cleaning)** | Garantir área operacional limpa no arranque e no fecho. | Limpeza contínua; reposição; checklist de zonas. | Derrames; urgências; pós-evento. |

**Regra:** Tarefas críticas bloqueiam estado (ex.: sem turno aberto não se vende). Recorrentes mantêm ritmo. Eventuais são resolução de problemas ou exceções.

---

## 2. Tarefas por momento do turno

O **ritual operacional** organiza tarefas em quatro momentos.

| Momento | Objetivo | Exemplos (por papel) |
| ------- | -------- | -------------------- |
| **Antes de abrir** | Prontidão para receber clientes. | Dono/Gerente: validar config, abrir turno. Cozinha: mise en place, ligar equipamentos. Limpeza: zonas, casas de banho. Garçom: mesas, mantas, carta. |
| **Durante o turno** | Ritmo e execução. | Garçom: tomar pedidos, entregar, servir. Cozinha: preparar, marcar pronto. Gerente: atribuir tarefas, resolver alertas. Limpeza: limpeza contínua, repor. |
| **Antes de fechar** | Fechar serviço sem deixar pendentes. | Gerente: fechar turno, conferir caixa. Cozinha: encerrar linha, limpar. Garçom: última rodada, fechar mesas. Limpeza: checklist de fecho. |
| **Pós-fecho** | Consolidação e preparação do próximo dia. | Dono/Gerente: relatórios, alertas pendentes. Core: validar, consolidar; Dashboard reflete estado. |

**Regra:** O sistema expõe tarefas por momento quando aplicável (ex.: "Antes de abrir" até o turno abrir; "Antes de fechar" quando o gerente inicia fecho). Tarefas não cumpridas no momento correto podem virar alertas (ver secção 4).

---

## 3. Tipos de tarefas

| Tipo | Definição | Efeito no sistema |
| ---- | --------- | ------------------ |
| **Obrigatórias** | Bloqueiam estado ou venda até estarem cumpridas (ex.: abrir turno, config mínima). | Bloqueiam transição de estado; aparecem como gates no Dashboard e no fluxo operacional. |
| **Operacionais** | Mantêm o ritmo do dia (entregar pedido, preparar, limpar). | Alimentam métricas de execução; atrasos podem gerar alertas. |
| **Qualidade** | Impactam percepção e experiência (limpeza de mesa, apresentação, temperatura). | Alimentam percepção operacional e métricas humanas; não bloqueiam venda. |
| **Exceção** | Resolução de problemas (reclamação, avaria, incidente). | Podem ter prioridade elevada; alimentam alertas e histórico de incidentes. |

**Regra:** O Core (ou contrato local em demo/pilot) classifica cada tarefa num destes tipos. A UI (AppStaff, KDS, Command Center) mostra e executa; não inventa tipos nem regras.

---

## 4. Relação Tarefa ↔ Sistema

As tarefas alimentam o resto do sistema:

| Saída | Como as tarefas alimentam |
| ----- | ------------------------- |
| **Alertas** | Tarefa atrasada ou obrigatória não cumprida → alerta. Prioridade e SLA definidos pelo Core (ou contrato). |
| **Saúde do sistema** | Conjunto de tarefas cumpridas/em atraso/pendentes contribui para "Operação: pronto/incompleto" e para o estado mostrado no Dashboard. |
| **Métricas humanas** | Tempo de execução, taxa de conclusão, distribuição por papel — não só financeiras. |

**Regra estrutural:** Falhas recorrentes (ex.: sempre atraso na mesma tarefa ou no mesmo momento) são tratadas como **sinal de problema estrutural**, não como "culpa do funcionário". O sistema deve expor padrões (ex.: "Limpeza de fritadeira atrasa 80% das vezes no turno X") para decisão do dono/gerente.

---

## 5. XP, pontos e gamificação (com maturidade)

- **Só onde faz sentido:** Reconhecimento de execução consistente ou de conclusão de tarefas críticas/recorrentes.
- **Nunca infantil:** Sem rankings públicos agressivos nem "níveis" que infantilizem o staff.
- **Nunca obrigatória:** O staff não depende de pontos para operar; pontos são reflexo, não objetivo.
- **Ligada a disciplina, não competição vazia:** Objetivo é ritmo e consistência, não competir entre pares de forma destrutiva.

**Regra:** Qualquer mecanismo de XP/pontos deve ser aprovado contra a doutrina (CHEFIAPP_PRODUCT_DOCTRINE): não infantilizar, não substituir a tarefa como pulso.

---

## 6. Implementação viva

A primeira implementação viva é o ritual **Antes de abrir — Gerente**: tarefas obrigatórias (validar prontidão, abrir turno), gate Dashboard/TPV (`MANDATORY_RITUAL_INCOMPLETE`), persistência local (localStorage). Código: `merchant-portal/src/core/ritual/` e secção "Antes de abrir" na página **Turno** (`ManagerTurnoPage`, rota `/app/staff/manager/turno`). Ver [APPSTAFF_UI_SURGERY_SUMMARY.md](./APPSTAFF_UI_SURGERY_SUMMARY.md).

---

## 7. Referências

- [CHEFIAPP_PRODUCT_DOCTRINE.md](../CHEFIAPP_PRODUCT_DOCTRINE.md) — alma: Task System como pulso.
- [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md) — quem cria, tipos (pedido/operacional), onde aparecem, SLA; distinção tarefas operacionais vs ritual.
- [PRD_TASKS.md](../product/PRD_TASKS.md) — requisitos de produto (criação, execução, KDS).
- [CHEFIAPP_SYSTEM_MAP.html](../CHEFIAPP_SYSTEM_MAP.html) — mapa vivo (camadas, papéis, rotas).

**Última atualização:** 2026-02-05
