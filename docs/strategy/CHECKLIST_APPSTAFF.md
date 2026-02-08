# Checklist AppStaff — Agora, Tarefas, Inventory Lite, Roles

**Critério de aceite:** "O staff consegue ver o que importa agora e executar o que o papel permite."

Checklist de teste manual para validar a experiência AppStaff no merchant-portal: tela Agora (tarefas pendentes + pedidos prontos), acções sobre tarefas e pedidos, Inventory Lite (alertas "Repor X") e UI condicionada por papel (RBAC).

Derivado do [CORE_APPSTAFF_CONTRACT.md](../architecture/CORE_APPSTAFF_CONTRACT.md), [TASKS_CONTRACT_v1](../contracts/STATUS_CONTRACT.md) e contratos de estado de pedido. Complementa o [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) (TPV/KDS/cliente).

---

## Pré-requisitos

- [ ] **Docker Core no ar** — `make world-up` (ou `docker compose -f docker-core/docker-compose.core.yml up -d`)
- [ ] **Merchant portal a correr** — ex.: `npm run dev` no merchant-portal
- [ ] **Restaurante seed** — restaurante activo (ex.: `00000000-0000-0000-0000-000000000100`)
- [ ] **Menu com produtos** — pelo menos uma categoria e 2–3 produtos (para pedidos e, se aplicável, consumo de stock)
- [ ] **Acesso a um utilizador com papel conhecido** — ex.: Owner, Manager, Staff/Waiter, Kitchen (para validar RBAC)
- [ ] **Opcional:** Pedidos em estado READY e tarefas OPEN/ACKNOWLEDGED (via TPV/KDS ou simulador) para testar a tela Agora
- [ ] **Opcional:** Ingredientes com stock abaixo do mínimo (para alertas Inventory Lite e "Repor X")

---

## Rotas AppStaff (piloto no merchant-portal)

| Rota / entrada                                     | O que validar                                                                |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/garcom` ou equivalente (Staff Home / Worker)     | Página carrega; navegação para Agora, tarefas, Inventory Lite conforme papel |
| Tela "Agora" (Worker Task Stream com AgoraSection) | Tarefas pendentes e pedidos READY visíveis; acções conforme permissões       |

---

## Agora — Tarefas pendentes e pedidos prontos

| #   | Acção                           | Pass                                                                                                                            | Fail                                       |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1   | Abrir AppStaff (Worker / Agora) | Secção "Agora" carrega; listas de tarefas pendentes (OPEN/ACKNOWLEDGED) e pedidos READY visíveis (ou vazias com mensagem clara) | Erro, tela em branco ou dados não aparecem |
| 2   | Iniciar tarefa                  | Botão "Iniciar" numa tarefa; tarefa transiciona (ex.: OPEN → ACKNOWLEDGED / em execução); lista actualiza após refresh          | Estado não muda ou erro silencioso         |
| 3   | Concluir tarefa                 | Botão "Concluir"; tarefa sai da lista de pendentes (estado RESOLVED); lista actualiza                                           | Tarefa não sai ou erro                     |
| 4   | Rejeitar tarefa                 | Botão "Rejeitar"; tarefa sai da lista (estado DISMISSED); lista actualiza                                                       | Tarefa não sai ou erro                     |
| 5   | Marcar pedido entregue          | Pedido READY → botão "Marcar entregue" (SERVED); pedido sai da lista READY                                                      | Pedido não transiciona ou erro             |

**Regra de ouro Agora:** Apenas utilizadores com permissão (ex.: `canMarkServed`) devem ver/executar a acção correspondente. Auditor (read-only) não deve ver botões de execução.

---

## Inventory Lite — Alertas e "Repor X"

| #   | Acção                     | Pass                                                                                                                                                                           | Fail                                                                       |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1   | Ver secção Inventory Lite | Se existirem alertas (stock ≤ min_qty), secção visível para papéis com `canSeeInventoryLite`; lista de ingredientes em alerta                                                  | Secção não aparece quando há alertas, ou aparece para papéis sem permissão |
| 2   | Criar tarefa "Repor X"    | Com papel Owner/Manager (canCreateTask): botão "Repor [ingrediente]" cria tarefa tipo ESTOQUE_CRITICO; mensagem "Repor [nome]"; tarefa aparece na Agora ou na lista de tarefas | Botão ausente para Owner/Manager, ou criação falha, ou tarefa não aparece  |
| 3   | Staff sem canCreateTask   | Papel Staff/Waiter/Kitchen sem canCreateTask: não vê botão "Repor X" (ou vê apenas lista de alertas, sem criar tarefa)                                                         | Staff consegue criar tarefa de reposição quando não deveria                |

---

## RBAC — O que cada papel vê e pode fazer

| Papel           | Deve poder                                                                                                        | Não deve poder                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Owner / Manager | Criar tarefa, atribuir, marcar pedido SERVED, ver Inventory Lite, criar "Repor X", fechar caixa (se implementado) | —                                                             |
| Waiter / Staff  | Marcar pedido SERVED, ver Orders Lite / Agora (pedidos READY), ver tarefas atribuídas                             | Criar tarefa, fechar caixa, ver Billing                       |
| Kitchen         | Ver KDS Lite / tarefas de cozinha; executar tarefas (iniciar/concluir/rejeitar) conforme atribuição               | Criar tarefa, fechar caixa, ver Billing                       |
| Auditor         | Ver dados (read-only)                                                                                             | Qualquer acção de escrita (criar tarefa, marcar SERVED, etc.) |

Validar pelo menos: **Manager vê e usa "Nova Tarefa" e "Repor X"; Staff não vê "Nova Tarefa" nem botão "Repor X".**

---

## Regras de ouro (cross-cutting)

1. **AppStaff não inventa dados.** Tarefas e pedidos vêm do Core (Docker); acções passam por RPCs/API do Core.
2. **UI reflecte permissões.** Botões e secções visíveis conforme `getAppStaffPermissions(role)`; chamadas com role inválido devem ser rejeitadas (403) e logadas.
3. **Agora = "o que importa agora".** Tarefas OPEN/ACKNOWLEDGED e pedidos READY; após executar (concluir/rejeitar/marcar SERVED), a lista actualiza (refresh ou realtime).

---

## Referências

- Contrato AppStaff: [CORE_APPSTAFF_CONTRACT.md](../architecture/CORE_APPSTAFF_CONTRACT.md)
- Checklist operacional TPV/KDS/Cliente: [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)
- Plano de teste antes de freeze: [TEST_PLAN_BEFORE_FREEZE.md](./TEST_PLAN_BEFORE_FREEZE.md)
- Erros canónicos (stock/alertas): [ERROS_CANON.md](./ERROS_CANON.md)
- Bússola (Runtime vs Cloud, onde testar): [CHEFIAPP_OS_MAPA_MENTAL_E_FLUXO.md](./CHEFIAPP_OS_MAPA_MENTAL_E_FLUXO.md)
