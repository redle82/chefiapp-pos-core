# Topologia de Execução — Core

**Propósito:** Definir **quem executa o quê**. Evita que a IA (ou um dev) coloque lógica no sítio errado: criação de tarefas no cliente, UI a decidir regras, etc.

**Uso:** Em todo prompt que altere fluxo de dados, Kernel, readers, writers ou AppStaff, referenciar: `@docs/architecture/CORE_EXECUTION_TOPOLOGY.md`.

---

## 1. Princípio

**Core decide. UI executa (chama) e mostra.**

- O **Core** (Kernel, Executor, backend, jobs) decide regras, valida, persiste, aplica consequências.
- A **UI** (React, AppStaff, Dashboard) chama APIs, mostra estado, confirma ações, reporta. Não inventa regras nem cria entidades que o contrato reserva ao Core.

---

## 2. Pipeline de execução (escrita)

```
UI (ex: TPV, KDS, AppStaff)
  → chama Kernel.execute(request) ou API HTTP
  → Kernel (gatekeeper)
  → EventExecutor (orchestrator)
  → Repo + EventStore (memory + history)
  → resultado devolvido à UI
```

- **Kernel:** injeta tenantId, contexto, lifecycle; delega no Executor.
- **Executor:** resolve stream, rebuild (projeção), executa lógica (CoreExecutor), commit no EventStore.
- **UI:** não acede ao Repo nem ao EventStore diretamente; não decide transições de estado além do que o Core expõe.

Ver [KERNEL_EXECUTION_MODEL.md](./KERNEL_EXECUTION_MODEL.md).

---

## 3. Leituras (readers)

- **Readers** (`core-boundary/readers/`, ex: OrderReader, TaskReader, RuntimeReader) são a fronteira de **leitura** para a UI.
- A UI chama `readOpenTasks(restaurantId)`, `readActiveOrders(restaurantId)`, etc. Não faz queries diretas ao Supabase/Postgres para dados que têm reader.
- Readers podem ter cache em memória (TTL) para reduzir carga; a decisão de cache é do reader, não da UI.

---

## 4. Escritas (writers / Core)

- **Criação e alteração de entidades** que o contrato atribui ao Core:
  - **Tarefas:** criação = Core (backend/job) ou gerente/dono. O terminal (TaskPanel) só lê, confirma, executa, reporta. Ver [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md).
  - **Identidade/turno:** fonte de verdade = Core/sessão (quando existir); até lá, exceção dev documentada (TabIsolated, fallback).
  - **Pedidos, pagamentos, eventos:** via Kernel.execute() ou API; não lógica de negócio inventada na UI.

---

## 5. AppStaff como terminal

- **AppStaff** = terminal humano do OS. Não é um app genérico.
- Responde a quatro perguntas (identidade, expectativas, necessidades, capacidades); cada uma mapeada a subcontratos.
- **Não** decide: mostra, confirma, executa, reporta. Ver [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md).

---

## 6. UI operacional (Shell, painéis)

- **OperationalShell** impõe contexto e layout (VPC, fundo, padding). Telas dentro do Shell não definem “a página” (maxWidth global, minHeight 100vh no root).
- **PanelRoot** é o wrapper obrigatório para painéis dentro do Shell; sem background/maxWidth próprio.
- Rotas públicas e landing estão fora desta topologia; não usam OperationalShell.

Ver [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md).

---

## 7. Resumo (quem faz o quê)

| Quem | Faz |
|------|-----|
| Core (Kernel, Executor, backend) | Decide regras; valida; persiste; cria tarefas (ou delega em gerente/dono); fonte de identidade/turno (quando existir). |
| Readers | Leitura exposta à UI; cache TTL quando aplicável. |
| UI (Dashboard, AppStaff, TPV, KDS) | Chama Kernel/readers; mostra estado; confirma ações; reporta. Não cria tarefas no cliente; não inventa identidade. |
| AppStaff (Minimal) | Check-in local (TabIsolated) até Core; métricas (readActiveOrders); badge tarefas (readOpenTasks); placeholder financeiro. |

---

**Regra:** Se a tarefa envolve “quem cria”, “quem decide” ou “onde vive esta lógica”, consultar este doc e o contrato específico antes de implementar.
